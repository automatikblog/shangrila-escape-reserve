
## Remover Cafe da Manha da Pagina Principal

### O que sera feito

Remover todas as referencias ao "Cafe da manha" na pagina principal do site (pagina publica). A area administrativa nao sera alterada.

### Alteracoes

**1. `src/components/Pricing.tsx`**
- Remover o card "Cafe da Manha" (R$ 45) do array `pricingOptions`
- O grid passara de 4 colunas para 3 colunas (`lg:grid-cols-3`)

**2. `src/components/Reservas.tsx`**
- Remover a opcao "cafe" do dropdown de tipo de reserva (linhas 342-353)
- Remover a mencao "Cafe da manha: 30 vagas" do aviso de vagas limitadas (linha 260)
- Remover a validacao "Cafe so aos domingos" do handleSubmit (linhas 165-169)
- Remover a logica de resetar tipo de reserva quando muda de/para domingo (linhas 78-80)
- Remover a funcao `isSunday` que so era usada para o cafe (linhas 69-71)

### O que NAO sera alterado
- Paginas administrativas (admin/Reservations.tsx, ReservationFormModal.tsx) continuam com cafe
- Hook `useReservations.ts` mantem os dados do cafe para o admin
