import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Pencil,
  Trash2,
  CalendarIcon,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useExpenses, Expense, ExpenseFilters } from '@/hooks/useExpenses';
import { ExpenseFormModal } from '@/components/admin/ExpenseFormModal';

const Expenses: React.FC = () => {
  const today = new Date();
  
  // Filters state
  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
    category: 'all',
    status: 'all',
  });

  const {
    expenses,
    categories,
    payers,
    isLoading,
    totals,
    byCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseNameSuggestions,
    getLastExpenseByName,
    createCategory,
    createPayer,
  } = useExpenses(filters);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Previous month data for comparison
  const prevMonthStart = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
  const prevMonthEnd = format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
  const { totals: prevMonthTotals } = useExpenses({
    startDate: prevMonthStart,
    endDate: prevMonthEnd,
  });

  // Quick filters
  const applyQuickFilter = (type: 'today' | 'week' | 'month' | 'year') => {
    let start: Date, end: Date;
    switch (type) {
      case 'today':
        start = end = today;
        break;
      case 'week':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'year':
        start = startOfYear(today);
        end = endOfYear(today);
        break;
    }
    setFilters({
      ...filters,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    });
  };

  // Month comparison
  const monthDiff = totals.total - prevMonthTotals.total;
  const monthDiffPercent = prevMonthTotals.total > 0 
    ? ((monthDiff / prevMonthTotals.total) * 100).toFixed(1) 
    : '0';

  // Sort categories by amount for visualization
  const sortedCategories = useMemo(() => {
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totals.total > 0 ? (amount / totals.total) * 100 : 0,
      }));
  }, [byCategory, totals.total]);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setModalOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data);
    } else {
      await createExpense(data);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gastos do Clube</h1>
          <p className="text-muted-foreground">Gerencie os gastos e despesas</p>
        </div>
        <Button onClick={() => { setEditingExpense(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Gasto
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total no Período
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              vs Mês Anterior
            </CardTitle>
            {monthDiff >= 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              monthDiff >= 0 ? "text-red-600" : "text-green-600"
            )}>
              {monthDiff >= 0 ? '+' : ''}{formatCurrency(monthDiff)}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthDiff >= 0 ? '+' : ''}{monthDiffPercent}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost by Category */}
      {sortedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedCategories.map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{cat.name}</span>
                  <span className="font-medium">
                    {formatCurrency(cat.amount)} ({cat.percent.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={cat.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('today')}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('week')}
            >
              Esta Semana
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('month')}
            >
              Este Mês
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyQuickFilter('year')}
            >
              Este Ano
            </Button>
          </div>

          {/* Date and category filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate
                      ? format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate ? new Date(filters.startDate) : undefined}
                    onSelect={(date) =>
                      date && setFilters({ ...filters, startDate: format(date, 'yyyy-MM-dd') })
                    }
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate
                      ? format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate ? new Date(filters.endDate) : undefined}
                    onSelect={(date) =>
                      date && setFilters({ ...filters, endDate: format(date, 'yyyy-MM-dd') })
                    }
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value as 'paid' | 'pending' | 'all' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Lista de Gastos ({expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum gasto encontrado no período selecionado.
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{expense.name}</span>
                      <Badge variant="outline">{expense.category}</Badge>
                      <Badge
                        variant={expense.status === 'paid' ? 'default' : 'secondary'}
                        className={cn(
                          expense.status === 'paid'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                        )}
                      >
                        {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(expense.expense_date), 'dd/MM/yyyy', { locale: ptBR })}
                      {expense.paid_by && ` • Pago por: ${expense.paid_by}`}
                      {expense.payment_method && ` • ${expense.payment_method}`}
                    </div>
                    {expense.notes && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold whitespace-nowrap">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <ExpenseFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
        expense={editingExpense}
        categories={categories}
        payers={payers}
        onSubmit={handleSubmit}
        onCreateCategory={createCategory}
        onCreatePayer={createPayer}
        getNameSuggestions={getExpenseNameSuggestions}
        getLastExpenseByName={getLastExpenseByName}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gasto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gasto "{expenseToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;
