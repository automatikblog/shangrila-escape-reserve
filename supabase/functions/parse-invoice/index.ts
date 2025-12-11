import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing invoice image with AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{ "items": [] }';
    
    console.log('AI Response:', content);

    // Parse the JSON response
    let parsedContent;
    try {
      // Try to extract JSON from the response (it might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = { items: [] };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      parsedContent = { items: [] };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in parse-invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, items: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
