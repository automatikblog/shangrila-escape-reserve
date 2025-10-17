import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const pricingOptions = [
  {
    title: "Entrada",
    price: "R$ 10",
    description: "Acesso às áreas de lazer",
    features: ["Playground", "Áreas de convivência", "Estacionamento"],
  },
  {
    title: "Entrada + Piscina",
    price: "R$ 20",
    description: "Acesso completo",
    features: ["Tudo da entrada", "Uso da piscina", "Vestiários"],
    popular: true,
  },
  {
    title: "Churrasqueira",
    price: "R$ 50",
    description: "Aluguel do espaço",
    features: ["Área equipada", "Mesa e bancos", "Carvão não incluso"],
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

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {pricingOptions.map((option, index) => (
            <Card
              key={index}
              className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${
                option.popular ? "border-primary border-2 shadow-lg" : ""
              }`}
            >
              {option.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{option.title}</CardTitle>
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

        <div className="text-center">
          <div className="inline-block bg-destructive/10 border-l-4 border-destructive px-6 py-4 rounded-r-lg">
            <p className="text-sm font-semibold text-destructive">
              ⚠️ Proibida a entrada de bebidas de fora
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
