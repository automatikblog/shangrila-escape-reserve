import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, MessageCircle } from "lucide-react";

const pricingOptions = [
  {
    title: "Entrada do Clube",
    price: "R$ 10",
    description: "Acesso às áreas de lazer",
    features: ["Playground", "Áreas de convivência", "Estacionamento"],
  },
  {
    title: "Piscina",
    price: "R$ 20",
    description: "Acesso completo à piscina",
    features: ["Inclui entrada do clube", "Uso da piscina", "Vestiários"],
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
            Preços e Opções
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Valores justos para você aproveitar o melhor do clube
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">💰 Informações Importantes</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Pagamento na chegada:</strong> Todos os valores são pagos ao chegar ao clube</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Crianças até 6 anos:</strong> Entrada gratuita</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Acima de 65 anos:</strong> Meia-entrada</span>
              </div>
            </div>
          </div>

          <div className="bg-accent/15 border-2 border-accent/40 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">🎉 Aluguel para Eventos</h3>
            <p className="text-sm text-muted-foreground mb-3">Disponibilizamos o espaço completo para aniversários e confraternizações.</p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <MessageCircle size={16} className="text-primary" />
              <span>Consulte valores e disponibilidade pelo <a href="https://wa.me/5513996327270?text=Olá+Gostaria+de+mais+informações+sobre+aluguel+para+eventos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">WhatsApp</a></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
