import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Comanda, ComandaOrder } from '@/hooks/useComandas';
import { Clock, DollarSign, FileText, User, MapPin, Store, Check, X, Plus, Banknote, Pencil, Calculator, Users, Percent, CreditCard, Minus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ComandaDetailsModalProps {
  comanda: Comanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: (comanda: Comanda) => void;
  onAddPartialPayment?: (sessionId: string, amount: number, paymentMethod: string, notes?: string) => Promise<boolean>;
  onUpdateDiscount?: (sessionId: string, discount: number) => Promise<boolean>;
  onUpdateItemQuantity?: (itemId: string, newQuantity: number) => Promise<boolean>;
  onDeleteItem?: (itemId: string) => Promise<boolean>;
}

const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
];

export const ComandaDetailsModal: React.FC<ComandaDetailsModalProps> = ({
  comanda,
  open,
  onOpenChange,
  onClose,
  onAddPartialPayment,
  onUpdateDiscount,
  onUpdateItemQuantity,
  onDeleteItem,
}) => {
  const [showPartialPaymentForm, setShowPartialPaymentForm] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialNotes, setPartialNotes] = useState('');
  const [partialPaymentMethod, setPartialPaymentMethod] = useState<string>('');
  const [isSubmittingPartial, setIsSubmittingPartial] = useState(false);
  
  // Edit notes state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  // Bill splitter state
  const [splitPeople, setSplitPeople] = useState<number>(2);
  
  // Discount state
  const [discount, setDiscount] = useState<string>('0');
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  
  // Edit item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  // Initialize states when comanda changes
  useEffect(() => {
    if (comanda) {
      setDiscount(comanda.discount?.toString() || '0');
    }
  }, [comanda]);

  if (!comanda) return null;

  const formatTimeElapsed = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAddPartialPayment = async () => {
    const amount = parseFloat(partialAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }
    if (!partialPaymentMethod) {
      toast.error('Selecione o método de pagamento');
      return;
    }

    setIsSubmittingPartial(true);
    const success = await onAddPartialPayment?.(comanda.session_id, amount, partialPaymentMethod, partialNotes || undefined);
    setIsSubmittingPartial(false);

    if (success) {
      setPartialAmount('');
      setPartialNotes('');
      setPartialPaymentMethod('');
      setShowPartialPaymentForm(false);
    }
  };

  const handleStartEditNotes = (order: ComandaOrder) => {
    setEditingOrderId(order.id);
    setEditedNotes(order.notes || '');
  };

  const handleSaveNotes = async (orderId: string) => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ notes: editedNotes || null })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast.success('Observação atualizada');
      setEditingOrderId(null);
      setEditedNotes('');
    } catch (err) {
      console.error('Error updating notes:', err);
      toast.error('Erro ao salvar observação');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setEditingOrderId(null);
    setEditedNotes('');
  };

  const handleSaveDiscount = async () => {
    const discountValue = parseFloat(discount.replace(',', '.'));
    if (isNaN(discountValue) || discountValue < 0) {
      toast.error('Digite um valor de desconto válido');
      return;
    }
    
    setIsSavingDiscount(true);
    const success = await onUpdateDiscount?.(comanda.session_id, discountValue);
    setIsSavingDiscount(false);
    
    if (success) {
      toast.success('Desconto aplicado');
    }
  };

  const handleUpdateItemQuantity = async (itemId: string, newQuantity: number) => {
    setIsUpdatingItem(true);
    const success = await onUpdateItemQuantity?.(itemId, newQuantity);
    setIsUpdatingItem(false);
    if (success) {
      if (newQuantity <= 0) {
        toast.success('Item removido');
      }
      setEditingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setIsUpdatingItem(true);
    const success = await onDeleteItem?.(itemId);
    setIsUpdatingItem(false);
    if (success) {
      toast.success('Item removido');
      setEditingItemId(null);
    }
  };

  // Calculate totals with discount
  const discountValue = parseFloat(discount.replace(',', '.')) || 0;
  const totalAfterDiscount = Math.max(0, comanda.total - discountValue);
  const remainingAfterDiscount = Math.max(0, comanda.remaining_total - discountValue + (comanda.discount || 0));
  
  // Calculate split amount based on remaining after discount
  const splitAmount = splitPeople > 0 ? remainingAfterDiscount / splitPeople : 0;

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return null;
    const found = PAYMENT_METHODS.find(pm => pm.value === method);
    return found ? found.label : method;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Comanda - {comanda.client_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 flex-wrap shrink-0 px-6">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Aberta há {formatTimeElapsed(comanda.created_at)}
          </span>
          {comanda.table_number !== 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Mesa {comanda.table_number}
            </span>
          )}
          {comanda.table_number === 0 && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Store className="h-4 w-4" />
              Balcão
            </span>
          )}
        </div>

        <Separator className="shrink-0 mx-6" />

        {/* Fixed Discount Section - Always visible at top */}
        <div className="shrink-0 px-6 py-2">
          <div className="p-3 border rounded-lg bg-accent/20 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Desconto na Comanda
            </h4>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="flex-1"
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveDiscount}
                disabled={isSavingDiscount}
              >
                <Check className="h-3 w-3 mr-1" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>

        <Separator className="shrink-0 mx-6" />

        {/* Scrollable content area with native overflow */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 min-h-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-4 py-2">
            {/* Orders */}
            {comanda.orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pedido ainda
              </p>
            ) : (
              comanda.orders.map((order, index) => (
                <div key={order.id} className="space-y-2 p-3 rounded-lg border bg-background">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Pedido #{index + 1}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(order.created_at)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {order.delivery_type === 'mesa' ? (
                          <><MapPin className="h-3 w-3 mr-1" />Mesa</>
                        ) : (
                          <><Store className="h-3 w-3 mr-1" />Balcão</>
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="group">
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdatingItem}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 w-7 p-0"
                                onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdatingItem}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="flex-1 text-sm truncate">{item.item_name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              disabled={isUpdatingItem}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingItemId(null)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="flex justify-between text-sm py-0.5 px-1 -mx-1 rounded cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onUpdateItemQuantity && setEditingItemId(item.id)}
                          >
                            <span className="flex items-center gap-1">
                              {item.quantity}x {item.item_name}
                              {onUpdateItemQuantity && (
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              R$ {(item.item_price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Notes section with edit capability */}
                  {editingOrderId === order.id ? (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Observação..."
                        className="flex-1 h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => handleSaveNotes(order.id)}
                        disabled={isSavingNotes}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={handleCancelEditNotes}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded cursor-pointer hover:bg-muted/70 transition-colors group"
                      onClick={() => handleStartEditNotes(order)}
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground flex-1">
                        {order.notes || <span className="italic">Sem observação - clique para adicionar</span>}
                      </span>
                      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Subtotal: R$ {order.order_total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* Partial Payments Section */}
            {comanda.partial_payments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Pagamentos Realizados
                  </h4>
                  {comanda.partial_payments.map((pp) => (
                    <div key={pp.id} className="flex justify-between items-center text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-900">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Check className="h-3 w-3 text-blue-600" />
                        <span className="text-muted-foreground">{formatTime(pp.created_at)}</span>
                        {pp.payment_method && (
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodLabel(pp.payment_method)}
                          </Badge>
                        )}
                        {pp.notes && <span className="text-xs">({pp.notes})</span>}
                      </div>
                      <span className="font-medium text-blue-600">R$ {Number(pp.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Partial Payment Form */}
            {showPartialPaymentForm && (
              <div className="p-3 border rounded-lg bg-accent/20 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Novo Pagamento
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Valor (ex: 40)"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                  <Select
                    value={partialPaymentMethod}
                    onValueChange={setPartialPaymentMethod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(pm => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Quem pagou? (opcional)"
                  value={partialNotes}
                  onChange={(e) => setPartialNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleAddPartialPayment}
                    disabled={isSubmittingPartial || !partialAmount || !partialPaymentMethod}
                    className="flex-1"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowPartialPaymentForm(false);
                      setPartialAmount('');
                      setPartialNotes('');
                      setPartialPaymentMethod('');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="shrink-0 mx-6" />

        {/* Totals */}
        <div className="space-y-2 shrink-0 px-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal dos Pedidos</span>
            <span className="font-medium">R$ {comanda.total.toFixed(2)}</span>
          </div>
          
          {discountValue > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 flex items-center gap-1">
                <Percent className="h-4 w-4" />
                Desconto
              </span>
              <span className="text-orange-600 font-medium">
                - R$ {discountValue.toFixed(2)}
              </span>
            </div>
          )}
          
          {comanda.partial_payments_total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                Pagamentos Realizados
              </span>
              <span className="text-blue-600 font-medium">
                - R$ {comanda.partial_payments_total.toFixed(2)}
              </span>
            </div>
          )}
          {remainingAfterDiscount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-destructive flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Falta Pagar
                </span>
                <span className="text-destructive font-medium">
                  R$ {remainingAfterDiscount.toFixed(2)}
                </span>
              </div>
              
              {/* Bill splitter */}
              <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dividir por</span>
                  <Input
                    type="number"
                    min={1}
                    value={splitPeople}
                    onChange={(e) => setSplitPeople(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-7 text-center text-sm"
                  />
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">
                  R$ {splitAmount.toFixed(2)} cada
                </span>
              </div>
            </>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-lg font-bold">Total Final</span>
            </div>
            <span className="text-lg font-bold">
              R$ {totalAfterDiscount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 px-6 pb-6">
          {/* Payment Button */}
          {!showPartialPaymentForm && remainingAfterDiscount > 0 && onAddPartialPayment && (
            <Button
              variant="outline"
              onClick={() => setShowPartialPaymentForm(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pagamento
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Salvar e Fechar
            </Button>
            <Button
              variant="destructive"
              onClick={() => onClose(comanda)}
            >
              Encerrar Comanda
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
