import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, MessageCircle, DollarSign, Gift, Users, Calendar } from "lucide-react";

const pricingOptions = [
  {
    title: "Entrada do Clube",
    price: "R$ 10",
    description: "Acesso às áreas de lazer",
    features: ["Playground", "Áreas de convivência"],
  },
  {
    title: "Piscina",
    price: "R$ 20",
    description: "Acesso completo à piscina",
    features: ["Inclui entrada do clube", "Uso da piscina", "Banheiros"],
    popular: true,
  },
  {
    title: "Quiosque/Churrasqueira",
    price: "R$ 50",
    description: "Aluguel do espaço",
    features: ["Área equipada", "Mesa e bancos", "Perfeito para família"],
  },
  {
    title: "Café da Manhã",
    price: "R$ 45",
    description: "Exclusivo aos domingos",
    features: ["Domingos das 10h às 13h", "Reserva obrigatória", "Café completo"],
    special: true,
  },
];

const Pricing = () => {
  return (
    <section id="precos" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Faça sua Reserva
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Funcionamento: Sextas, Sábados, Domingos e Feriados das 10h às 18h
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
          {pricingOptions.map((option, index) => (
            <Card
              key={index}
              className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                option.popular ? "border-primary border-2 shadow-lg" : ""
              } ${
                option.special ? "border-orange-500 border-2 shadow-lg bg-gradient-to-br from-primary/5 to-orange-500/5" : ""
              }`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}
              {option.special && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Domingos
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl mb-2">{option.title}</CardTitle>
                <div className="text-4xl font-bold text-primary mb-2">
                  {option.price}
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Informações Importantes */}
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-2 border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-6">
              <CardTitle className="text-2xl md:text-3xl text-center flex items-center justify-center gap-3">
                <DollarSign className="w-7 h-7 text-primary" />
                Informações Importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Lado Esquerdo - Informações de Pagamento */}
                <div className="space-y-5">
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1">Pagamento na chegada</p>
                      <p className="text-sm text-muted-foreground">Todos os valores são pagos ao chegar ao clube</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1">Crianças até 6 anos</p>
                      <p className="text-sm text-muted-foreground">Entrada gratuita</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1">Acima de 65 anos</p>
                      <p className="text-sm text-muted-foreground">Meia-entrada</p>
                    </div>
                  </div>
                </div>

                {/* Lado Direito - Aluguel para Eventos */}
                <div className="flex flex-col justify-center">
                  <div className="p-6 bg-gradient-to-br from-accent/20 to-primary/10 rounded-xl border-2 border-accent/30 shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-xl">Aluguel para Eventos</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                      Disponibilizamos o espaço completo para aniversários, confraternizações e eventos especiais.
                    </p>
                    <a
                      href="https://wa.me/5513996327270?text=Ol%C3%A1+Gostaria+de+mais+informa%C3%A7%C3%B5es+sobre+aluguel+para+eventos"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Consultar pelo WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
