import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useReservations, 
  RESERVATION_LABELS, 
  RESERVATION_PRICES, 
  RESERVATION_LIMITS 
} from '@/hooks/useReservations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  CalendarDays, 
  Users, 
  Phone, 
  Trash2, 
  AlertCircle,
  CheckCircle
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
    fetchReservations, 
    getAvailability,
    deleteReservation 
  } = useReservations();

  useEffect(() => {
    loadDayData();
  }, [selectedDate, reservations]);

  const loadDayData = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayRes = reservations.filter(r => r.reservation_date === dateStr);
    setDayReservations(dayRes);
    
    const avail = await getAvailability(selectedDate);
    setAvailability(avail);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReservation(id);
      toast.success('Reserva removida com sucesso! Vaga liberada.');
    } catch (error) {
      toast.error('Erro ao remover reserva');
    }
  };

  const getOccupancyColor = (type: string, count: number) => {
    const limit = RESERVATION_LIMITS[type];
    if (limit === null) return 'text-green-500';
    const percentage = count / limit;
    if (percentage >= 1) return 'text-red-500';
    if (percentage >= 0.8) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reservas</h1>
        <p className="text-muted-foreground">Gerencie as reservas do clube</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Selecione a Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Ocupação do Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Ocupação - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(RESERVATION_LABELS).map(([key, label]) => {
              const count = availability[key] || 0;
              const limit = RESERVATION_LIMITS[key];
              const isSunday = selectedDate.getDay() === 0;
              
              // Café só aparece aos domingos
              if (key === 'cafe' && !isSunday) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">R$ {RESERVATION_PRICES[key]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getOccupancyColor(key, count)}`}>
                      {limit === null ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Ilimitado
                        </span>
                      ) : (
                        `${count}/${limit}`
                      )}
                    </p>
                    {limit !== null && count >= limit && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Esgotado
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <span>Total de Reservas</span>
              <span className="text-2xl font-bold">{dayReservations.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span>Total de Pessoas</span>
              <span className="text-2xl font-bold">
                {dayReservations.reduce((acc, r) => acc + r.num_people, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Reservas para {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : dayReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma reserva para esta data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayReservations.map((reservation) => (
                <div 
                  key={reservation.id} 
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        {RESERVATION_LABELS[reservation.reservation_type] || reservation.reservation_type}
                      </Badge>
                      <Badge variant="secondary">
                        R$ {RESERVATION_PRICES[reservation.reservation_type]}
                      </Badge>
                    </div>
                    <p className="font-semibold text-lg">{reservation.client_name}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {reservation.client_whatsapp}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reservation.num_people} pessoa(s)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reservado em: {format(new Date(reservation.created_at), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação irá remover a reserva de <strong>{reservation.client_name}</strong> e 
                          liberar a vaga para novas reservas. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(reservation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sim, remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReservations;