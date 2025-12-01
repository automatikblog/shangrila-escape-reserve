import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Users, MessageCircle } from "lucide-react";
import { ptBR } from "date-fns/locale";
const Reservas = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoReserva, setTipoReserva] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");

  // Feriados nacionais brasileiros de 2024-2026 (adicione mais conforme necessário)
  const feriados2024 = [new Date(2024, 0, 1),
  // Ano Novo
  new Date(2024, 1, 13),
  // Carnaval
  new Date(2024, 2, 29),
  // Sexta-feira Santa
  new Date(2024, 3, 21),
  // Tiradentes
  new Date(2024, 4, 1),
  // Dia do Trabalho
  new Date(2024, 4, 30),
  // Corpus Christi
  new Date(2024, 8, 7),
  // Independência
  new Date(2024, 9, 12),
  // Nossa Senhora Aparecida
  new Date(2024, 10, 2),
  // Finados
  new Date(2024, 10, 15),
  // Proclamação da República
  new Date(2024, 10, 20),
  // Dia da Consciência Negra
  new Date(2024, 11, 25) // Natal
  ];
  const feriados2025 = [new Date(2025, 0, 1),
  // Ano Novo
  new Date(2025, 2, 4),
  // Carnaval
  new Date(2025, 3, 18),
  // Sexta-feira Santa
  new Date(2025, 3, 21),
  // Tiradentes
  new Date(2025, 4, 1),
  // Dia do Trabalho
  new Date(2025, 5, 19),
  // Corpus Christi
  new Date(2025, 8, 7),
  // Independência
  new Date(2025, 9, 12),
  // Nossa Senhora Aparecida
  new Date(2025, 10, 2),
  // Finados
  new Date(2025, 10, 15),
  // Proclamação da República
  new Date(2025, 10, 20),
  // Dia da Consciência Negra
  new Date(2025, 11, 25) // Natal
  ];
  const feriados2026 = [new Date(2026, 0, 1),
  // Ano Novo
  new Date(2026, 1, 17),
  // Carnaval
  new Date(2026, 3, 3),
  // Sexta-feira Santa
  new Date(2026, 3, 21),
  // Tiradentes
  new Date(2026, 4, 1),
  // Dia do Trabalho
  new Date(2026, 5, 4),
  // Corpus Christi
  new Date(2026, 8, 7),
  // Independência
  new Date(2026, 9, 12),
  // Nossa Senhora Aparecida
  new Date(2026, 10, 2),
  // Finados
  new Date(2026, 10, 15),
  // Proclamação da República
  new Date(2026, 10, 20),
  // Dia da Consciência Negra
  new Date(2026, 11, 25) // Natal
  ];
  const todosFeriados = [...feriados2024, ...feriados2025, ...feriados2026];

  // Verifica se é feriado
  const isFeriado = (date: Date) => {
    return todosFeriados.some(feriado => feriado.getDate() === date.getDate() && feriado.getMonth() === date.getMonth() && feriado.getFullYear() === date.getFullYear());
  };

  // Verifica se é sexta, sábado ou domingo
  const isWeekendDay = (date: Date) => {
    const day = date.getDay();
    return day === 5 || day === 6 || day === 0; // 5=Sexta, 6=Sábado, 0=Domingo
  };

  // Dia disponível: sexta, sábado, domingo OU feriado
  const isDiaDisponivel = (date: Date) => {
    return isWeekendDay(date) || isFeriado(date);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Por favor, selecione uma data");
      return;
    }
    if (!name || !whatsapp || !tipoReserva || !numeroPessoas) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    toast.success("Reserva solicitada com sucesso! Você receberá a confirmação no WhatsApp informado.");

    // Reset form
    setDate(undefined);
    setName("");
    setWhatsapp("");
    setTipoReserva("");
    setNumeroPessoas("");
  };
  return <section id="reservas" className="py-20 bg-muted/30">
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
              

              {/* 1. Selecione a Data */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">1. Selecione a Data *</Label>
                <div className="flex flex-col items-center">
                  <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} disabled={date => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || !isDiaDisponivel(date);
                }} className="rounded-md border" />
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
                {date && <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm font-medium">Data selecionada:</p>
                    <p className="text-lg font-semibold text-primary">
                      {date.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                    </p>
                  </div>}
              </div>

              {/* 2. Escolha o que deseja reservar */}
              <div>
                <Label htmlFor="tipoReserva" className="text-lg font-semibold mb-3 block">
                  2. Escolha o que deseja reservar *
                </Label>
                <Select value={tipoReserva} onValueChange={setTipoReserva}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada do clube - R$ 10</SelectItem>
                    <SelectItem value="piscina">Piscina - R$ 20</SelectItem>
                    <SelectItem value="quiosque">Quiosque/Churrasqueira - R$ 50</SelectItem>
                    <SelectItem value="cafe">Café da manhã - R$ 45 (Domingos 10h-13h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Informe quantidade de pessoas */}
              <div>
                <Label htmlFor="numeroPessoas" className="text-lg font-semibold mb-3 block">
                  3. Informe a quantidade de pessoas *
                </Label>
                <Input id="numeroPessoas" type="number" min="1" value={numeroPessoas} onChange={e => setNumeroPessoas(e.target.value)} placeholder="Ex: 4" required className="mt-1" />
              </div>

              {/* 4. Nome e WhatsApp */}
              <div className="space-y-4 pt-2">
                <Label className="text-lg font-semibold block">4. Seus dados de contato</Label>
                
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input id="whatsapp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(00) 00000-0000" required className="mt-1" />
                  <div className="mt-2 p-3 bg-primary/10 border border-primary/30 rounded-md">
                    <p className="text-sm font-semibold text-foreground">
                      📱 Você receberá a confirmação da sua reserva neste WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Confirmar Reserva */}
              <div className="pt-4">
                <Label className="text-lg font-semibold mb-3 block">5. Confirme sua reserva</Label>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg">
                  Confirmar Reserva
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
    </section>;
};
export default Reservas;