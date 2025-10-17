import { Waves, Utensils, Baby, Coffee } from "lucide-react";

const features = [
  {
    icon: Waves,
    title: "Piscina Refrescante",
    description: "Área de piscina completa para toda a família se divertir",
  },
  {
    icon: Utensils,
    title: "6 Áreas de Churrasqueira",
    description: "Espaços equipados para seus churrascos em família",
  },
  {
    icon: Baby,
    title: "Playground",
    description: "Área segura e divertida para as crianças brincarem",
  },
  {
    icon: Coffee,
    title: "Café & Lanchonete",
    description: "Deliciosos cafés da manhã e lanches durante todo o dia",
  },
];

const About = () => {
  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Conheça o Shangrilá
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Um espaço completo de lazer para você e sua família aproveitarem momentos inesquecíveis
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
