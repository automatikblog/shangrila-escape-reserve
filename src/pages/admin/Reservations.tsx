import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useReservations, 
  RESERVATION_LABELS, 
  RESERVATION_PRICES, 
  RESERVATION_LIMITS 
} from '@/hooks/useReservations';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Users, 
  Phone, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  List
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AdminReservations: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayReservations, setDayReservations] = useState<any[]>([]);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const { 
    reservations, 
    loading, 
    getAvailability,
    deleteReservation 
  } = useReservations();

  const datesWithReservations = useMemo(() => {
    const dates = new Set<string>();
    reservations.forEach(r => {
      if (r.status === 'confirmed') {
        dates.add(r.reservation_date);
      }
    });
    return dates;
  }, [reservations]);

  const reservationsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    reservations
      .filter(r => r.status === 'confirmed')
      .sort((a, b) => new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime())
      .forEach(r => {
        if (!grouped[r.reservation_date]) {
          grouped[r.reservation_date] = [];
        }
        grouped[r.reservation_date].push(r);
      });
    return grouped;
  }, [reservations]);

  useEffect(() => {
    loadDayData();
  }, [selectedDate, reservations]);

  const loadDayData = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayRes = reservations.filter(r => r.reservation_date === dateStr && r.status === 'confirmed');
    setDayReservations(dayRes);
    
    const avail = await getAvailability(selectedDate);
    setAvailability(avail);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReservation(id);
      toast.success('Reserva removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover reserva');
    }
  };

  const getOccupancyColor = (type: string, count: number) => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return 'text-green-600';
    const percentage = count / limit;
    if (percentage >= 1) return 'text-red-600';
    if (percentage >= 0.8) return 'text-amber-600';
    return 'text-green-600';
  };

  const ReservationCard = ({ reservation, showDate = false }: { reservation: any; showDate?: boolean }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-card rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {RESERVATION_LABELS[reservation.reservation_type] || reservation.reservation_type}
          </Badge>
          <Badge className="bg-primary text-primary-foreground text-xs">
            R$ {RESERVATION_PRICES[reservation.reservation_type]}
          </Badge>
          {showDate && (
            <Badge variant="secondary" className="text-xs">
              {format(parseISO(reservation.reservation_date), "dd/MM")}
            </Badge>
          )}
        </div>
        <p className="font-semibold">{reservation.client_name}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {reservation.client_whatsapp}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {reservation.num_people} pessoa(s)
          </span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="shrink-0">
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Remover a reserva de <strong>{reservation.client_name}</strong> e liberar a vaga?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete(reservation.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reservas</h1>
        <p className="text-muted-foreground">Gerencie as reservas do clube</p>
      </div>

      <Tabs defaultValue="calendario" className="w-full">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="calendario" className="flex-1">
            <CalendarDays className="h-4 w-4 mr-2" />
            Por Data
          </TabsTrigger>
          <TabsTrigger value="todas" className="flex-1">
            <List className="h-4 w-4 mr-2" />
            Todas ({reservations.filter(r => r.status === 'confirmed').length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Por Data */}
        <TabsContent value="calendario" className="mt-6 space-y-6">
          {/* Linha 1: Calendário + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Calendário */}
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ptBR}
                  className="pointer-events-auto mx-auto"
                  modifiers={{
                    hasReservation: (date) => datesWithReservations.has(format(date, 'yyyy-MM-dd'))
                  }}
                  modifiersClassNames={{
                    hasReservation: 'bg-primary/20 font-bold text-primary'
                  }}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 justify-center">
                  <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30"></div>
                  <span>Dias com reservas</span>
                </div>
              </CardContent>
            </Card>

            {/* Ocupação */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Ocupação - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(RESERVATION_LABELS).map(([key, label]) => {
                  const count = availability[key] || 0;
                  const limit = RESERVATION_LIMITS[key];
                  const isSunday = selectedDate.getDay() === 0;
                  
                  if (key === 'cafe' && !isSunday) return null;
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground">R$ {RESERVATION_PRICES[key]}</p>
                      </div>
                      <p className={`font-bold text-sm ${getOccupancyColor(key, count)}`}>
                        {limit === null ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Ilimitado
                          </span>
                        ) : (
                          `${count}/${limit}`
                        )}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo do Dia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm">Total de Reservas</span>
                  <span className="text-3xl font-bold">{dayReservations.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Total de Pessoas</span>
                  <span className="text-3xl font-bold">
                    {dayReservations.reduce((acc, r) => acc + r.num_people, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Linha 2: Lista de Reservas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                Reservas - {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : dayReservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma reserva para esta data</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {dayReservations.map((reservation) => (
                    <ReservationCard key={reservation.id} reservation={reservation} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Todas */}
        <TabsContent value="todas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Reservas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : Object.keys(reservationsByDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma reserva encontrada</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(reservationsByDate).map(([dateStr, dateReservations]) => {
                    const date = parseISO(dateStr);
                    const isToday = isSameDay(date, new Date());
                    const isPast = date < new Date() && !isToday;
                    
                    return (
                      <div key={dateStr} className={isPast ? 'opacity-50' : ''}>
                        <div className="flex items-center gap-2 mb-3 flex-wrap border-b pb-2">
                          <h3 className="font-semibold">
                            {format(date, "EEEE, dd/MM", { locale: ptBR })}
                          </h3>
                          {isToday && <Badge className="bg-green-600">Hoje</Badge>}
                          {isPast && <Badge variant="secondary">Passado</Badge>}
                          <Badge variant="outline">{dateReservations.length} reserva(s)</Badge>
                          <Badge variant="outline">
                            {dateReservations.reduce((acc, r) => acc + r.num_people, 0)} pessoa(s)
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {dateReservations.map((reservation) => (
                            <ReservationCard key={reservation.id} reservation={reservation} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReservations;