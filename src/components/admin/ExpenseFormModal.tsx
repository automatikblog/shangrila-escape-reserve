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
import { CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Expense, ExpenseCategory, ExpensePayer } from '@/hooks/useExpenses';

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  categories: ExpenseCategory[];
  payers: ExpensePayer[];
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCreateCategory: (name: string) => Promise<any>;
  onCreatePayer: (name: string) => Promise<any>;
  getNameSuggestions: (search: string) => Promise<string[]>;
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
  onCreatePayer,
  getNameSuggestions,
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

  // Autocomplete state
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedAmount, setSuggestedAmount] = useState<number | null>(null);

  // New category/payer creation
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewPayer, setShowNewPayer] = useState(false);
  const [newPayerName, setNewPayerName] = useState('');

  // Reset form when modal opens/closes or expense changes
  useEffect(() => {
    if (open) {
      if (expense) {
        setName(expense.name);
        setCategory(expense.category);
        setAmount(expense.amount.toString());
        setExpenseDate(new Date(expense.expense_date));
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
      setSuggestedAmount(null);
      setNameSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, expense]);

  // Fetch name suggestions
  const handleNameChange = useCallback(async (value: string) => {
    setName(value);
    if (value.length >= 2) {
      const suggestions = await getNameSuggestions(value);
      setNameSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setNameSuggestions([]);
      setShowSuggestions(false);
    }
  }, [getNameSuggestions]);

  // Select a suggestion
  const handleSelectSuggestion = async (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);

    // Get last expense with this name to auto-fill values
    const lastExpense = await getLastExpenseByName(suggestion);
    if (lastExpense) {
      setCategory(lastExpense.category);
      setSuggestedAmount(lastExpense.amount);
      if (!amount) {
        setAmount(lastExpense.amount.toString());
      }
      if (lastExpense.payment_method) {
        setPaymentMethod(lastExpense.payment_method);
      }
      if (lastExpense.paid_by) {
        setPaidBy(lastExpense.paid_by);
      }
    }
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

  const handleCreatePayer = async () => {
    if (!newPayerName.trim()) return;
    const result = await onCreatePayer(newPayerName.trim());
    if (result) {
      setPaidBy(newPayerName.trim());
      setNewPayerName('');
      setShowNewPayer(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Gasto' : 'Novo Gasto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name with autocomplete */}
          <div className="space-y-2 relative">
            <Label htmlFor="name">Nome do Gasto *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => nameSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ex: Conta de luz, Compra de gás..."
              required
            />
            {showSuggestions && (
              <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                {nameSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                    onMouseDown={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {suggestedAmount !== null && (
              <p className="text-xs text-muted-foreground">
                Último valor usado: R$ {suggestedAmount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
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
      </DialogContent>
    </Dialog>
  );
};
