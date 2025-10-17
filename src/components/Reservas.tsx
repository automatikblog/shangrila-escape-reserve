import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { ptBR } from "date-fns/locale";

const Reservas = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Check if date is Friday, Saturday, or Sunday
  const isWeekendDay = (date: Date) => {
    const day = date.getDay();
    return day === 5 || day === 6 || day === 0; // 5=Friday, 6=Saturday, 0=Sunday
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }
    
    if (!isWeekendDay(date)) {
      toast.error("Reservas disponíveis apenas para sexta, sábado e domingo");
      return;
    }

    if (!name || !phone) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    // Here you would integrate with Google Calendar
    toast.success("Reserva solicitada com sucesso! Entraremos em contato em breve.");
    
    // Reset form
    setName("");
    setPhone("");
    setDate(undefined);
  };

  return (
    <section id="reservas" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Reserve sua Mesa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Café da manhã disponível nas sextas, sábados e domingos
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CalendarIcon className="text-primary" />
              Agende seu Café da Manhã
            </CardTitle>
            <CardDescription className="text-base">
              Apenas 10 mesas disponíveis por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      // Disable past dates and non-weekend days
                      return date < today || !isWeekendDay(date);
                    }}
                    className="rounded-md border"
                  />
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={16} />
                    <span>10 mesas por dia</span>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                      className="mt-1"
                    />
                  </div>

                  {date && (
                    <div className="p-4 bg-accent/20 rounded-lg">
                      <p className="text-sm font-medium">Data selecionada:</p>
                      <p className="text-lg font-semibold text-primary">
                        {date.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-lg"
                  >
                    Confirmar Reserva
                  </Button>
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
