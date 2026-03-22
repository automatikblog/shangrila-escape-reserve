

## Duas funcionalidades na Comanda

### 1. Alterar nome da comanda

Adicionar um botao de editar ao lado do nome no `ComandaDetailsModal`. Ao clicar, o nome vira um input editavel. Ao salvar, atualiza `client_sessions.client_name` no banco e faz refresh.

**Arquivo: `src/components/admin/ComandaDetailsModal.tsx`**
- Adicionar estado `editingName` / `editedName`
- No header (linha 336), ao lado do nome, colocar icone de lapis. Ao clicar, mostrar Input + botoes salvar/cancelar
- Ao salvar, fazer `supabase.from('client_sessions').update({ client_name }).eq('id', sessionId)` e chamar toast + refetch

### 2. Item avulso (cobrar na hora)

Adicionar botao "Item Avulso" no modal da comanda que permite criar um pedido com nome e valor customizado, sem vincular a menu_items ou estoque.

**Arquivo: `src/components/admin/ComandaDetailsModal.tsx`**
- Adicionar botao "Cobrar Item Avulso" (icone Plus) na area de pedidos
- Ao clicar, mostra mini-form inline com: nome do item (text) e valor (number)
- Ao confirmar, cria um pedido via:
  1. `INSERT INTO orders` (table_id da comanda, client_session_id, status 'delivered', delivery_type 'mesa')
  2. `INSERT INTO order_items` (item_name, item_price, quantity 1, category 'avulso', menu_item_id NULL)
- Sem decrementar estoque (menu_item_id = null)
- Apos inserir, chama refetch/debouncedFetch para o valor aparecer na comanda

**Arquivo: `src/hooks/useComandas.ts`**
- Nenhuma alteracao necessaria - ja suporta items sem menu_item_id

**Banco de dados:**
- Nenhuma migracao necessaria - `order_items.menu_item_id` ja e nullable

### Resumo tecnico
- 2 features no mesmo componente `ComandaDetailsModal`
- Sem alteracao de schema
- Item avulso usa category 'avulso' para diferenciar visualmente
- O valor do item avulso soma normalmente na comanda pois ja e um order_item como qualquer outro

