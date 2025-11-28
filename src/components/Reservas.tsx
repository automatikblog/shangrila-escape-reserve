import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users } from "lucide-react";

const Reservas = () => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tipoReserva, setTipoReserva] = useState("");
  const [numeroPessoas, setNumeroPessoas] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !whatsapp || !tipoReserva || !numeroPessoas) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    toast.success("Reserva solicitada com sucesso! Você receberá a confirmação no WhatsApp informado.");
    
    // Reset form
    setName("");
    setWhatsapp("");
    setTipoReserva("");
    setNumeroPessoas("");
  };

  return (
    <section id="reservas" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Faça sua Reserva
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reserve seu dia de lazer conosco
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="text-primary" />
              Complete sua Reserva
            </CardTitle>
            <CardDescription className="text-base">
              Preencha os dados abaixo para confirmar sua reserva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Você receberá a confirmação da sua reserva neste WhatsApp. O pagamento será feito na chegada ao clube.
                  </p>
                </div>

                <div>
                  <Label htmlFor="tipoReserva">O que você está reservando? *</Label>
                  <Select value={tipoReserva} onValueChange={setTipoReserva}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada do clube</SelectItem>
                      <SelectItem value="piscina">Piscina</SelectItem>
                      <SelectItem value="quiosque">Quiosque/Churrasqueira</SelectItem>
                      <SelectItem value="cafe">Café da manhã</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numeroPessoas">Quantas pessoas? *</Label>
                  <Input
                    id="numeroPessoas"
                    type="number"
                    min="1"
                    value={numeroPessoas}
                    onChange={(e) => setNumeroPessoas(e.target.value)}
                    placeholder="Ex: 4"
                    required
                    className="mt-1"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg"
                >
                  Confirmar Reserva
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Reservas;
