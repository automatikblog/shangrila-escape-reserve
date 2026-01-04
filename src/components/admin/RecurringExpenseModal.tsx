import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2 } from 'lucide-react';
import { RecurringExpense, ExpenseCategory, ExpensePayer } from '@/hooks/useExpenses';

interface RecurringExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recurringExpense?: RecurringExpense | null;
  categories: ExpenseCategory[];
  payers: ExpensePayer[];
  onSubmit: (data: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onCreateCategory: (name: string) => Promise<any>;
  onCreatePayer: (name: string) => Promise<any>;
}

const PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Boleto',
  'Transferência',
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

export const RecurringExpenseModal: React.FC<RecurringExpenseModalProps> = ({
  open,
  onOpenChange,
  recurringExpense,
  categories,
  payers,
  onSubmit,
  onCreateCategory,
  onCreatePayer,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [notes, setNotes] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New category/payer creation
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewPayer, setShowNewPayer] = useState(false);
  const [newPayerName, setNewPayerName] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (recurringExpense) {
        setName(recurringExpense.name);
        setCategory(recurringExpense.category);
        setAmount(recurringExpense.amount.toString());
        setPaymentMethod(recurringExpense.payment_method || '');
        setPaidBy(recurringExpense.paid_by || '');
        setNotes(recurringExpense.notes || '');
        setDaysOfWeek(recurringExpense.days_of_week);
        setIsActive(recurringExpense.is_active);
      } else {
        setName('');
        setCategory('');
        setAmount('');
        setPaymentMethod('');
        setPaidBy('');
        setNotes('');
        setDaysOfWeek([]);
        setIsActive(true);
      }
    }
  }, [open, recurringExpense]);

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !amount || daysOfWeek.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        category,
        amount: parseFloat(amount),
        payment_method: paymentMethod || null,
        paid_by: paidBy || null,
        notes: notes || null,
        days_of_week: daysOfWeek,
        is_active: isActive,
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
            {recurringExpense ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="recurring-name">Nome do Gasto *</Label>
            <Input
              id="recurring-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Funcionário João, Gasolina..."
              required
            />
          </div>

          {/* Days of Week */}
          <div className="space-y-2">
            <Label>Dias da Semana *</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.value}
                  type="button"
                  variant={daysOfWeek.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDay(day.value)}
                  className="min-w-[52px]"
                >
                  {day.short}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione os dias em que este gasto acontece regularmente
            </p>
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
            <Label htmlFor="recurring-amount">Valor (R$) *</Label>
            <Input
              id="recurring-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
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
            <Label>Quem Paga</Label>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="recurring-notes">Observações</Label>
            <Textarea
              id="recurring-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais..."
              rows={2}
            />
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor="is-active" className="font-normal cursor-pointer">
              Gasto ativo (aparece na lista para lançamento rápido)
            </Label>
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
              disabled={isSubmitting || !name || !category || !amount || daysOfWeek.length === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : recurringExpense ? (
                'Atualizar'
              ) : (
                'Criar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
