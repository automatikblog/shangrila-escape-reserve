

## Atualizar Acesso Rapido no Atendimento

### Alteracoes em `src/pages/admin/Atendimento.tsx` (linhas 870-876)

Substituir o array de itens de acesso rapido:

**Antes:**
```
Entrada do clube sem piscina - R$20
Entrada com piscina - R$50
Entrada sem piscina (antiga) - R$10  [HIDDEN/disabled]
Entrada com piscina (antiga) - R$30  [HIDDEN/disabled]
Churrasqueira - R$50
Café da manhã - R$45
```

**Depois:**
```
Entrada sem piscina (verão) - R$20
Entrada com piscina (verão) - R$50
Entrada sem piscina (inverno) - R$10
Entrada com piscina (inverno) - R$30
Criança 6-10 anos com piscina - R$15  [NOVO]
Churrasqueira - R$50
```

- Renomear "Entrada do clube sem piscina" para "Entrada sem piscina (verão)"
- Renomear "Entrada com piscina" para "Entrada com piscina (verão)"
- Renomear "(antiga)" para "(inverno)" nos dois itens de R$10 e R$30, e reativa-los
- Adicionar novo item "Criança 6-10 anos com piscina" por R$15 com icone Users
- Remover "Café da manhã" do acesso rapido

### Nota importante

Os nomes no acesso rapido fazem match com `menu_items` pelo nome. Sera necessario tambem criar o item "Criança 6-10 anos com piscina" no cardapio (menu_items) e renomear os itens existentes para que o match funcione. Se os itens ja existirem com os nomes antigos no banco, sera preciso atualizar os nomes la tambem.

