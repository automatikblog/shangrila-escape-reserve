import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RESERVATION_LABELS, RESERVATION_PRICES } from '@/hooks/useReservations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_type: string;
  client_name: string;
  client_email: string;
  client_whatsapp?: string | null;
  num_people: number;
  status: string;
}

interface ReservationFormModalProps {
  open: boolean;
  onClose: () => void;
  reservation?: Reservation | null;
  onSuccess: () => void;
}

const ReservationFormModal: React.FC<ReservationFormModalProps> = ({
  open,
  onClose,
  reservation,
  onSuccess
}) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tipoReserva, setTipoReserva] = useState('');
  const [numeroPessoas, setNumeroPessoas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!reservation;

  useEffect(() => {
    if (reservation) {
      setDate(new Date(reservation.reservation_date + 'T12:00:00'));
      setName(reservation.client_name);
      setEmail(reservation.client_email || '');
      setWhatsapp(reservation.client_whatsapp || '');
      setTipoReserva(reservation.reservation_type);
      setNumeroPessoas(String(reservation.num_people));
    } else {
      setDate(undefined);
      setName('');
      setEmail('');
      setWhatsapp('');
      setTipoReserva('');
      setNumeroPessoas('');
    }
  }, [reservation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !name || !whatsapp || !tipoReserva || !numeroPessoas) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Por favor, informe um email válido');
        return;
      }
    }

    setSubmitting(true);
    try {
      const reservationData = {
        reservation_date: format(date, 'yyyy-MM-dd'),
        reservation_type: tipoReserva,
        client_name: name,
        client_email: email || '',
        client_whatsapp: whatsapp,
        num_people: parseInt(numeroPessoas),
        status: 'confirmed',
      };

      if (isEditing && reservation) {
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', reservation.id);

        if (error) throw error;
        toast.success('Reserva atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('reservations')
          .insert(reservationData);

        if (error) throw error;
        toast.success('Reserva criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving reservation:', error);
      toast.error(error.message || 'Erro ao salvar reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const isSunday = date?.getDay() === 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Reserva' : 'Nova Reserva'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tipo de Reserva */}
          <div className="space-y-2">
            <Label>Tipo de Reserva *</Label>
            <Select value={tipoReserva} onValueChange={setTipoReserva}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESERVATION_LABELS).map(([key, label]) => {
                  if (key === 'cafe' && !isSunday) return null;
                  return (
                    <SelectItem key={key} value={key}>
                      {label} - R$ {RESERVATION_PRICES[key]}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Número de Pessoas */}
          <div className="space-y-2">
            <Label htmlFor="numPeople">Número de Pessoas *</Label>
            <Input
              id="numPeople"
              type="number"
              min="1"
              value={numeroPessoas}
              onChange={(e) => setNumeroPessoas(e.target.value)}
              placeholder="Ex: 4"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Reserva'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationFormModal;
