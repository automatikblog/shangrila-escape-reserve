import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Loader2, Search, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Helper to parse date string without timezone issues
const parseDateString = (dateStr: string): Date => {
  // Parse as local date to avoid timezone shifting
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};
import { Expense, ExpenseCategory, ExpensePayer } from '@/hooks/useExpenses';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
  payers: ExpensePayer[];
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCreateCategory: (name: string) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<boolean>;
  onCreatePayer: (name: string) => Promise<any>;
  getAllExpenseNames: () => Promise<Expense[]>;
  getLastExpenseByName: (name: string) => Promise<Expense | null>;
}

const PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  open,
  onOpenChange,
  expense,
  categories,
  payers,
  onSubmit,
  onCreateCategory,
  onDeleteCategory,
  onCreatePayer,
  getAllExpenseNames,
  getLastExpenseByName,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick select state
  const [showQuickSelect, setShowQuickSelect] = useState(false);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);

  // New category/payer creation
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewPayer, setShowNewPayer] = useState(false);
  const [newPayerName, setNewPayerName] = useState('');

  // Category delete state
  const [categoryToDelete, setCategoryToDelete] = useState<ExpenseCategory | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        setName(expense.name);
        setCategory(expense.category);
        setAmount(expense.amount.toString());
        setExpenseDate(parseDateString(expense.expense_date));
        setPaymentMethod(expense.payment_method || '');
        setPaidBy(expense.paid_by || '');
        setStatus(expense.status);
        setNotes(expense.notes || '');
      } else {
        setName('');
        setCategory('');
        setAmount('');
        setExpenseDate(new Date());
        setPaymentMethod('');
        setPaidBy('');
        setStatus('paid');
        setNotes('');
      }
      setShowQuickSelect(false);
      setSearchFilter('');
    }
  }, [open, expense]);

  // Load all expenses for quick select
  const loadAllExpenses = async () => {
    setIsLoadingExpenses(true);
    const expenses = await getAllExpenseNames();
    setAllExpenses(expenses);
    setIsLoadingExpenses(false);
  };

  const handleOpenQuickSelect = () => {
    setShowQuickSelect(true);
    loadAllExpenses();
  };

  // Filter expenses by search
  const filteredExpenses = allExpenses.filter(e =>
    e.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    e.category.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Select a previous expense to auto-fill
  const handleSelectExpense = (selectedExpense: Expense) => {
    setName(selectedExpense.name);
    setCategory(selectedExpense.category);
    setAmount(selectedExpense.amount.toString());
    if (selectedExpense.payment_method) {
      setPaymentMethod(selectedExpense.payment_method);
    }
    if (selectedExpense.paid_by) {
      setPaidBy(selectedExpense.paid_by);
    }
    setShowQuickSelect(false);
    setSearchFilter('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !amount) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        category,
        amount: parseFloat(amount),
        expense_date: format(expenseDate, 'yyyy-MM-dd'),
        payment_method: paymentMethod || null,
        paid_by: paidBy || null,
        status,
        notes: notes || null,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    const result = await onCreateCategory(newCategoryName.trim());
    if (result) {
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const success = await onDeleteCategory(categoryToDelete.id);
    if (success) {
      if (category === categoryToDelete.name) {
        setCategory('');
      }
      setCategoryToDelete(null);
    }
  };

  const handleCreatePayer = async () => {
    if (!newPayerName.trim()) return;
    const result = await onCreatePayer(newPayerName.trim());
    if (result) {
      setPaidBy(newPayerName.trim());
      setNewPayerName('');
      setShowNewPayer(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {expense ? 'Editar Gasto' : 'Novo Gasto'}
            </DialogTitle>
          </DialogHeader>

          {/* Quick Select View */}
          {showQuickSelect ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickSelect(false)}
                >
                  ← Voltar
                </Button>
                <span className="text-sm text-muted-foreground">Selecione um gasto anterior</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                {isLoadingExpenses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum gasto encontrado
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredExpenses.map((exp) => (
                      <button
                        key={exp.id}
                        type="button"
                        className="w-full p-3 text-left hover:bg-accent transition-colors"
                        onClick={() => handleSelectExpense(exp)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{exp.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {exp.category}
                              {exp.paid_by && ` • ${exp.paid_by}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(exp.amount)}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(parseDateString(exp.expense_date), 'dd/MM/yy')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Select Button */}
              {!expense && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenQuickSelect}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Usar gasto anterior (auto-preencher)
                </Button>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Gasto *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Conta de luz, Compra de gás..."
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Categoria *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => setShowCategoryManager(true)}
                  >
                    Gerenciar categorias
                  </Button>
                </div>
                {!showNewCategory ? (
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewCategory(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nova categoria"
                      autoFocus
                    />
                    <Button type="button" onClick={handleCreateCategory}>
                      Criar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowNewCategory(false);
                        setNewCategoryName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Data do Gasto *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !expenseDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expenseDate ? format(expenseDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expenseDate}
                      onSelect={(date) => date && setExpenseDate(date)}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Paid By */}
              <div className="space-y-2">
                <Label>Quem Pagou</Label>
                {!showNewPayer ? (
                  <div className="flex gap-2">
                    <Select value={paidBy} onValueChange={setPaidBy}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {payers.map((payer) => (
                          <SelectItem key={payer.id} value={payer.name}>
                            {payer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewPayer(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newPayerName}
                      onChange={(e) => setNewPayerName(e.target.value)}
                      placeholder="Nome do pagador"
                      autoFocus
                    />
                    <Button type="button" onClick={handleCreatePayer}>
                      Criar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowNewPayer(false);
                        setNewPayerName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status *</Label>
                <RadioGroup
                  value={status}
                  onValueChange={(value) => setStatus(value as 'paid' | 'pending')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid" className="font-normal cursor-pointer">
                      Pago
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="pending" />
                    <Label htmlFor="pending" className="font-normal cursor-pointer">
                      Pendente
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações opcionais..."
                  rows={3}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !name || !category || !amount}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : expense ? (
                    'Atualizar'
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Manager Dialog */}
      <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span>{cat.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setCategoryToDelete(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoryToDelete?.name}"?
              Os gastos existentes com esta categoria não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
