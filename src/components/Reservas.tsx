import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Users, Mail, Phone, AlertTriangle, CheckCircle } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { 
  RESERVATION_LIMITS, 
  RESERVATION_LABELS, 
  RESERVATION_PRICES 
} from "@/hooks/useReservations";

const Reservas = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoReserva, setTipoReserva] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Feriados nacionais brasileiros de 2024-2026
  const feriados2024 = [
    new Date(2024, 0, 1), new Date(2024, 1, 13), new Date(2024, 2, 29),
    new Date(2024, 3, 21), new Date(2024, 4, 1), new Date(2024, 4, 30),
    new Date(2024, 8, 7), new Date(2024, 9, 12), new Date(2024, 10, 2),
    new Date(2024, 10, 15), new Date(2024, 10, 20), new Date(2024, 11, 25)
  ];
  const feriados2025 = [
    new Date(2025, 0, 1), new Date(2025, 2, 4), new Date(2025, 3, 18),
    new Date(2025, 3, 21), new Date(2025, 4, 1), new Date(2025, 5, 19),
    new Date(2025, 8, 7), new Date(2025, 9, 12), new Date(2025, 10, 2),
    new Date(2025, 10, 15), new Date(2025, 10, 20), new Date(2025, 11, 25)
  ];
  const feriados2026 = [
    new Date(2026, 0, 1), new Date(2026, 1, 17), new Date(2026, 3, 3),
    new Date(2026, 3, 21), new Date(2026, 4, 1), new Date(2026, 5, 4),
    new Date(2026, 8, 7), new Date(2026, 9, 12), new Date(2026, 10, 2),
    new Date(2026, 10, 15), new Date(2026, 10, 20), new Date(2026, 11, 25)
  ];
  const todosFeriados = [...feriados2024, ...feriados2025, ...feriados2026];

  const isFeriado = (date: Date) => {
    return todosFeriados.some(
      feriado => 
        feriado.getDate() === date.getDate() && 
        feriado.getMonth() === date.getMonth() && 
        feriado.getFullYear() === date.getFullYear()
    );
  };

  const isWeekendDay = (date: Date) => {
    const day = date.getDay();
    return day === 5 || day === 6 || day === 0;
  };

  const isDiaDisponivel = (date: Date) => {
    return isWeekendDay(date) || isFeriado(date);
  };

  const isSunday = (date: Date | undefined) => {
    return date ? date.getDay() === 0 : false;
  };

  // Carregar disponibilidade quando a data muda
  useEffect(() => {
    if (date) {
      loadAvailability(date);
      // Resetar tipo de reserva se mudar de/para domingo
      if (tipoReserva === 'cafe' && !isSunday(date)) {
        setTipoReserva('');
      }
    }
  }, [date]);

  const loadAvailability = async (selectedDate: Date) => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('reservations')
        .select('reservation_type')
        .eq('reservation_date', dateStr)
        .eq('status', 'confirmed');

      if (error) throw error;

      const counts: Record<string, number> = { entrada: 0, piscina: 0, quiosque: 0, cafe: 0 };
      data?.forEach(r => {
        if (counts[r.reservation_type] !== undefined) {
          counts[r.reservation_type]++;
        }
      });
      setAvailability(counts);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingSlots = (type: string): number | null => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return null;
    return Math.max(0, limit - (availability[type] || 0));
  };

  const isTypeAvailable = (type: string): boolean => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return true;
    return (availability[type] || 0) < limit;
  };

  const sendConfirmationEmail = async (reservationData: {
    clientName: string;
    clientEmail: string;
    reservationDate: string;
    reservationType: string;
    reservationPrice: number;
    numPeople: number;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-reservation-email', {
        body: reservationData,
      });

      if (error) {
        console.error('Error sending confirmation email:', error);
        // Não falha a reserva se o email não for enviado
      }
    } catch (error) {
      console.error('Error calling email function:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }
    if (!name || !whatsapp || !tipoReserva || !numeroPessoas) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validar email apenas se preenchido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Por favor, informe um email válido");
        return;
      }
    }

    // Validação: Café só aos domingos
    if (tipoReserva === 'cafe' && !isSunday(date)) {
      toast.error("Café da manhã está disponível apenas aos domingos");
      return;
    }

    // Verificar disponibilidade
    if (!isTypeAvailable(tipoReserva)) {
      toast.error("Este tipo de reserva está esgotado para a data selecionada");
      return;
    }

    setSubmitting(true);
    try {
      const reservationDate = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('reservations')
        .insert({
          reservation_date: reservationDate,
          reservation_type: tipoReserva,
          client_name: name,
          client_email: email || '',
          client_whatsapp: whatsapp,
          num_people: parseInt(numeroPessoas),
          status: 'confirmed',
        });

      if (error) throw error;

      // Enviar email de confirmação apenas se email foi informado
      if (email) {
        await sendConfirmationEmail({
          clientName: name,
          clientEmail: email,
          reservationDate: reservationDate,
          reservationType: tipoReserva,
          reservationPrice: RESERVATION_PRICES[tipoReserva],
          numPeople: parseInt(numeroPessoas),
        });
      }

      toast.success("Reserva confirmada! Você receberá a confirmação no email informado.");
      
      // Reset form
      setDate(undefined);
      setName("");
      setEmail("");
      setWhatsapp("");
      setTipoReserva("");
      setNumeroPessoas("");
      setAvailability({});
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      toast.error(error.message || "Erro ao criar reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionLabel = (type: string) => {
    const remaining = getRemainingSlots(type);
    const price = RESERVATION_PRICES[type];
    const label = RESERVATION_LABELS[type];
    
    if (remaining === null) {
      return `${label} - R$ ${price}`;
    }
    
    if (remaining === 0) {
      return `${label} - R$ ${price} (ESGOTADO)`;
    }
    
    return `${label} - R$ ${price} (${remaining} vagas)`;
  };

  return (
    <section id="reservas" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CalendarIcon className="text-primary" />
              Complete sua Reserva
            </CardTitle>
            <CardDescription className="text-base">
              Selecione a data e preencha os dados para confirmar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nota de Vagas Limitadas */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  Vagas limitadas! Quiosque/Churrasqueira: 5 vagas | Café da manhã: 30 vagas
                </p>
              </div>

              {/* 1. Selecione a Data */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">1. Selecione a Data *</Label>
                <div className="flex flex-col items-center">
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={setDate} 
                    locale={ptBR} 
                    disabled={(calDate) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return calDate < today || !isDiaDisponivel(calDate);
                    }} 
                    className="rounded-md border" 
                  />
                  <div className="mt-4 text-center space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                      <CalendarIcon size={16} />
                      <span>Sex, Sáb, Dom e Feriados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                      <Users size={16} />
                      <span>Horário: 10h às 18h</span>
                    </div>
                  </div>
                </div>
                {date && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm font-medium">Data selecionada:</p>
                    <p className="text-lg font-semibold text-primary">
                      {date.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Escolha o que deseja reservar */}
              <div>
                <Label htmlFor="tipoReserva" className="text-lg font-semibold mb-3 block">
                  2. Escolha o que deseja reservar *
                </Label>
                <Select 
                  value={tipoReserva} 
                  onValueChange={setTipoReserva}
                  disabled={!date || loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={loading ? "Verificando disponibilidade..." : "Selecione uma opção"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada" disabled={!isTypeAvailable('entrada')}>
                      <span className="flex items-center gap-2">
                        {getOptionLabel('entrada')}
                        {isTypeAvailable('entrada') && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </span>
                    </SelectItem>
                    <SelectItem value="piscina" disabled={!isTypeAvailable('piscina')}>
                      <span className="flex items-center gap-2">
                        {getOptionLabel('piscina')}
                        {isTypeAvailable('piscina') && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </span>
                    </SelectItem>
                    <SelectItem value="quiosque" disabled={!isTypeAvailable('quiosque')}>
                      <span className="flex items-center gap-2">
                        {getOptionLabel('quiosque')}
                        {isTypeAvailable('quiosque') ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    </SelectItem>
                    {isSunday(date) && (
                      <SelectItem value="cafe" disabled={!isTypeAvailable('cafe')}>
                        <span className="flex items-center gap-2">
                          {getOptionLabel('cafe')}
                          {isTypeAvailable('cafe') ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </span>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!date && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selecione uma data primeiro para ver a disponibilidade
                  </p>
                )}
              </div>

              {/* 3. Informe quantidade de pessoas */}
              <div>
                <Label htmlFor="numeroPessoas" className="text-lg font-semibold mb-3 block">
                  3. Informe a quantidade de pessoas *
                </Label>
                <Input 
                  id="numeroPessoas" 
                  type="number" 
                  min="1" 
                  value={numeroPessoas} 
                  onChange={e => setNumeroPessoas(e.target.value)} 
                  placeholder="Ex: 4" 
                  required 
                  className="mt-1" 
                />
              </div>

              {/* 4. Nome e Email */}
              <div className="space-y-4 pt-2">
                <Label className="text-lg font-semibold block">4. Seus dados de contato</Label>
                
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Seu nome" 
                    required 
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="seu@email.com" 
                    className="mt-1" 
                  />
                  {email && (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/30 rounded-md">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Você receberá a confirmação da sua reserva neste email
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input 
                    id="whatsapp" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    placeholder="(00) 00000-0000" 
                    required 
                    className="mt-1" 
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Para contato em caso de necessidade
                  </p>
                </div>
              </div>

              {/* 5. Confirmar Reserva */}
              <div className="pt-4">
                <Label className="text-lg font-semibold mb-3 block">5. Confirme sua reserva</Label>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                  disabled={submitting}
                >
                  {submitting ? "Confirmando..." : "Confirmar Reserva"}
                </Button>

                {/* Informações de pagamento */}
                <div className="mt-4 p-4 bg-accent/20 border border-accent rounded-lg space-y-2">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    💳 Informações de Pagamento
                  </p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li>• Pagamento realizado na chegada ao clube</li>
                    <li>• Crianças até 6 anos: entrada gratuita</li>
                    <li>• Acima de 65 anos: meia-entrada</li>
                  </ul>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Reservas;
