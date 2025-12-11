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

IMPORTANTE - Colunas da nota fiscal:
- A coluna "QUANTIDADE" ou "QTD.COM" contém a quantidade de CAIXAS/PACKS
- A coluna "QTD.TRIB" ou "QTD TRIB" contém a quantidade REAL de unidades individuais
- SEMPRE use a QTD.TRIB para o campo "quantidade" pois é o total de unidades soltas

Exemplo: Se QTD.COM=5 (caixas) e QTD.TRIB=40 (unidades), use quantidade=40

Para cada produto, extraia:
- codigo: código do produto (COD.PRODUTO)
- descricao: nome/descrição do produto (DESCRIÇÃO DOS PRODUTOS)
- quantidade: use QTD.TRIB (quantidade tributável/unidades individuais), NÃO a quantidade de caixas
- valorUnitario: valor unitário da CAIXA (VL.UN.COM), não precisa dividir
- ncm: código NCM se disponível

Retorne APENAS um JSON válido no formato:
{
  "items": [
    { "codigo": "23457", "descricao": "BUDWEISER LT 269ML CX C/8", "quantidade": 40, "valorUnitario": 21.56, "ncm": "22030000" }
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
