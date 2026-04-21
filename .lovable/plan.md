

## Atualizar precos na pagina principal (Pricing)

### Alteracoes em `src/components/Pricing.tsx`

Atualizar os 2 primeiros cards do array `pricingOptions`:

**Card 1 - Entrada do Clube:**
- Preco: `R$ 10` -> `R$ 20`

**Card 2 - Piscina (Mais Popular):**
- Titulo: `Piscina` -> `Entrada + Piscina`
- Preco: `R$ 20` -> `R$ 35`
- Manter descricao "Acesso completo a piscina" e features existentes

**Card 3 - Quiosque/Churrasqueira:**
- Sem alteracoes (continua R$ 50)

### Observacao importante

Esses precos na Home sao apenas informativos para o publico (texto estatico). Eles NAO afetam:
- Os valores cobrados no Atendimento (que vem de `menu_items`)
- Os itens de Acesso Rapido (Entrada sem piscina R$20 verao, Entrada com piscina R$50 verao, etc.)

A memoria de pricing-tiers ja esta consistente: a Home agora mostra precos de inverno (R$20 entrada, R$35 piscina), enquanto o Atendimento mantem ambas variantes (verao R$20/R$50 e inverno R$10/R$30) para uso interno conforme a estacao.

