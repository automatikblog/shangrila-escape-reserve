import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed", items: [] }, 405);
  }

  const authorization = req.headers.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!authorization || !token) {
    return json({ error: "Authentication required", items: [] }, 401);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authorization } },
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Authentication required", items: [] }, 401);
    }

    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "staff"])
      .limit(1);
    if (roleError) {
      console.error("Could not verify invoice-import role:", roleError.code);
      return json({ error: "Could not verify access", items: [] }, 500);
    }
    if (!roles?.length) {
      return json({ error: "Staff access required", items: [] }, 403);
    }

    const payload = await req.json().catch(() => null);
    const image = payload?.image;
    if (typeof image !== "string" || !/^data:image\/[\w.+-]+;base64,/i.test(image)) {
      return json({ error: "A base64 image is required", items: [] }, 400);
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const model = Deno.env.get("GEMINI_MODEL");
    if (!apiKey || !model) {
      console.error("Invoice provider configuration is missing");
      return json({ error: "Invoice provider is not configured", items: [] }, 503);
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em ler notas fiscais brasileiras (NF-e/DANFE). Analise a imagem e extraia os produtos da seção "DADOS DOS PRODUTOS/SERVIÇOS".

REGRA CRÍTICA PARA QUANTIDADE - Siga esta ordem de prioridade:

1. SE existir coluna "QTD.TRIB" ou "QTD TRIB": USE ESSE VALOR (é a quantidade real de unidades)
2. SE NÃO existir QTD.TRIB: CALCULE baseado na descrição do produto:
   - Identifique se a descrição indica pack/caixa: "CX C/8", "12X269ML", "PACK 6", "C/12", etc.
   - Multiplique: QUANTIDADE × unidades_por_pack
   - Exemplo: "BUDWEISER CX C/8" com QUANTIDADE=5 → 5×8 = 40 unidades
   - Exemplo: "BRAHMA 12X269ML" com QUANTIDADE=3 → 3×12 = 36 unidades
3. SE for produto individual (sem indicação de pack): use a QUANTIDADE diretamente

Padrões comuns de pack na descrição:
- "CX C/8" ou "C/8" = 8 unidades por caixa
- "12X269ML" = 12 unidades
- "PACK 6" = 6 unidades
- "FARDO 12" = 12 unidades
- "24UN" = 24 unidades

Para cada produto, extraia:
- codigo: código do produto (COD.PRODUTO)
- descricao: descrição completa do produto
- quantidade: TOTAL DE UNIDADES INDIVIDUAIS (seguindo as regras acima)
- valorUnitario: valor unitário da linha (VL.UN.COM)
- ncm: código NCM se disponível

Retorne APENAS um JSON válido no formato:
{
  "items": [
    { "codigo": "13839", "descricao": "BUDWEISER LT 269ML CX C/8", "quantidade": 40, "valorUnitario": 21.56, "ncm": "22030000" }
  ]
}

Se não conseguir identificar produtos, retorne: { "items": [] }
Não inclua explicações, apenas o JSON.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os produtos desta nota fiscal:'
              },
              {
                type: 'image_url',
                image_url: { url: image }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Invoice provider returned HTTP", response.status);
      return json({ error: "Invoice provider request failed", items: [] }, 502);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return json({ error: "Invalid invoice provider response", items: [] }, 502);
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return json({ error: "Invalid invoice provider response", items: [] }, 502);
    }
    if (!Array.isArray(result?.items)) {
      return json({ error: "Invalid invoice provider response", items: [] }, 502);
    }
    return json({ items: result.items });
  } catch {
    console.error("Unexpected error in invoice import");
    return json({ error: "Invoice import failed", items: [] }, 500);
  }
});
