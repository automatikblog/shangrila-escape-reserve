import React, { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Helper to parse date string without timezone issues
const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
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
  Filter,
  Repeat,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useExpenses, Expense, RecurringExpense, ExpenseFilters } from '@/hooks/useExpenses';
import { ExpenseFormModal } from '@/components/admin/ExpenseFormModal';
import { RecurringExpenseModal } from '@/components/admin/RecurringExpenseModal';
import { supabase } from '@/integrations/supabase/client';

const DAYS_OF_WEEK_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Expenses: React.FC = () => {
  const today = new Date();
  const todayDayOfWeek = getDay(today);
  
  // Filters state
  const [filters, setFilters] = useState<ExpenseFilters>({
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
    category: 'all',
    status: 'all',
  });

  // Previous month totals (fetched separately to avoid double hook)
  const [prevMonthTotal, setPrevMonthTotal] = useState(0);

  const {
    expenses,
    categories,
    payers,
    recurringExpenses,
    isLoading,
    totals,
    byCategory,
    createExpense,
    updateExpense,
    deleteExpense,
    getAllExpenseNames,
    getLastExpenseByName,
    createCategory,
    deleteCategory,
    createPayer,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    applyRecurringExpense,
  } = useExpenses(filters);

  // Fetch previous month total once on mount
  React.useEffect(() => {
    const fetchPrevMonth = async () => {
      const prevMonthStart = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
      const prevMonthEnd = format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
      
      const { data } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', prevMonthStart)
        .lte('expense_date', prevMonthEnd);
      
      if (data) {
        setPrevMonthTotal(data.reduce((sum, e) => sum + Number(e.amount), 0));
      }
    };
    fetchPrevMonth();
  }, []);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Recurring modal state
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [deleteRecurringDialogOpen, setDeleteRecurringDialogOpen] = useState(false);
  const [recurringToDelete, setRecurringToDelete] = useState<RecurringExpense | null>(null);

  // Filter recurring expenses for today
  const todayRecurring = recurringExpenses.filter(
    r => r.is_active && r.days_of_week.includes(todayDayOfWeek)
  );

  // Quick filters
  const applyQuickFilter = useCallback((type: 'today' | 'week' | 'month' | 'year') => {
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
    setFilters(prev => ({
      ...prev,
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    }));
  }, [today]);

  // Month comparison
  const monthDiff = totals.total - prevMonthTotal;
  const monthDiffPercent = prevMonthTotal > 0 
    ? ((monthDiff / prevMonthTotal) * 100).toFixed(1) 
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

  const handleEditRecurring = (recurring: RecurringExpense) => {
    setEditingRecurring(recurring);
    setRecurringModalOpen(true);
  };

  const handleDeleteRecurring = (recurring: RecurringExpense) => {
    setRecurringToDelete(recurring);
    setDeleteRecurringDialogOpen(true);
  };

  const confirmDeleteRecurring = async () => {
    if (recurringToDelete) {
      await deleteRecurringExpense(recurringToDelete.id);
      setDeleteRecurringDialogOpen(false);
      setRecurringToDelete(null);
    }
  };

  const handleSubmitRecurring = async (data: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingRecurring) {
      await updateRecurringExpense(editingRecurring.id, data);
    } else {
      await createRecurringExpense(data);
    }
  };

  const handleApplyRecurring = async (recurring: RecurringExpense) => {
    await applyRecurringExpense(recurring, format(today, 'yyyy-MM-dd'));
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setEditingRecurring(null); setRecurringModalOpen(true); }}>
            <Repeat className="h-4 w-4 mr-2" />
            Recorrente
          </Button>
          <Button onClick={() => { setEditingExpense(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Gasto
          </Button>
        </div>
      </div>

      {/* Today's Recurring Expenses */}
      {todayRecurring.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Gastos recorrentes de hoje ({format(today, 'EEEE', { locale: ptBR })})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {todayRecurring.map((recurring) => (
                <Button
                  key={recurring.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleApplyRecurring(recurring)}
                >
                  <Play className="h-3 w-3" />
                  {recurring.name} - {formatCurrency(recurring.amount)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Tabs for Expenses and Recurring */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses">Gastos ({expenses.length})</TabsTrigger>
          <TabsTrigger value="recurring">Recorrentes ({recurringExpenses.length})</TabsTrigger>
        </TabsList>

        {/* Expenses List */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lista de Gastos</CardTitle>
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
                          {format(parseDateString(expense.expense_date), 'dd/MM/yyyy', { locale: ptBR })}
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
        </TabsContent>

        {/* Recurring Expenses List */}
        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gastos Recorrentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum gasto recorrente configurado.</p>
                  <p className="text-sm mt-2">
                    Configure gastos que acontecem regularmente (ex: funcionários, contas fixas)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurringExpenses.map((recurring) => (
                    <div
                      key={recurring.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3",
                        !recurring.is_active && "opacity-50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{recurring.name}</span>
                          <Badge variant="outline">{recurring.category}</Badge>
                          {!recurring.is_active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {recurring.days_of_week.map(d => DAYS_OF_WEEK_SHORT[d]).join(', ')}
                          {recurring.paid_by && ` • ${recurring.paid_by}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold whitespace-nowrap">
                          {formatCurrency(recurring.amount)}
                        </span>
                        <div className="flex gap-1">
                          {recurring.is_active && recurring.days_of_week.includes(todayDayOfWeek) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApplyRecurring(recurring)}
                              title="Lançar hoje"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRecurring(recurring)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRecurring(recurring)}
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
        </TabsContent>
      </Tabs>

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
        onDeleteCategory={deleteCategory}
        onCreatePayer={createPayer}
        getAllExpenseNames={getAllExpenseNames}
        getLastExpenseByName={getLastExpenseByName}
      />

      {/* Recurring Form Modal */}
      <RecurringExpenseModal
        open={recurringModalOpen}
        onOpenChange={(open) => {
          setRecurringModalOpen(open);
          if (!open) setEditingRecurring(null);
        }}
        recurringExpense={editingRecurring}
        categories={categories}
        payers={payers}
        onSubmit={handleSubmitRecurring}
        onCreateCategory={createCategory}
        onCreatePayer={createPayer}
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
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Recurring Confirmation Dialog */}
      <AlertDialog open={deleteRecurringDialogOpen} onOpenChange={setDeleteRecurringDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gasto Recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o gasto recorrente "{recurringToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRecurring}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Expenses;
