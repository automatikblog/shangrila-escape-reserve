import { Waves, Utensils, Baby, Coffee, Flame, Home, Bed, Bird, Trophy } from "lucide-react";
import galleryPool from "@/assets/gallery-pool.jpg";
import galleryBBQ from "@/assets/gallery-bbq.jpg";
import galleryPlayground from "@/assets/gallery-playground.jpg";
import galleryBathrooms from "@/assets/gallery-bathrooms.jpg";
import galleryFirepit from "@/assets/gallery-firepit.jpg";
import galleryPergola from "@/assets/gallery-pergola.jpg";
import galleryHammocks from "@/assets/gallery-hammocks.jpg";
import galleryChickens from "@/assets/gallery-chickens.jpg";
import galleryBilliards from "@/assets/gallery-billiards.jpg";

const features = [
  {
    icon: Waves,
    title: "Piscina",
    description: "Área de piscina refrescante para toda a família",
  },
  {
    icon: Utensils,
    title: "Quiosque/Churrasqueira",
    description: "6 áreas equipadas para churrascos",
  },
  {
    icon: Baby,
    title: "Playground",
    description: "Área segura e divertida para as crianças",
  },
  {
    icon: Home,
    title: "Banheiros",
    description: "Instalações sanitárias masculino e feminino",
  },
  {
    icon: Flame,
    title: "Fogo de Chão",
    description: "Espaço para confraternizações ao ar livre",
  },
  {
    icon: Home,
    title: "Pergolado",
    description: "Área coberta para descanso e sombra",
  },
  {
    icon: Bed,
    title: "Redário",
    description: "Redes coloridas para relaxar",
  },
  {
    icon: Bird,
    title: "Galinheiro",
    description: "Contato com a natureza e animais",
  },
  {
    icon: Trophy,
    title: "Bilhar",
    description: "Sala de jogos e entretenimento",
  },
];

const images = [
  {
    src: galleryPool,
    alt: "Piscina do Clube Shangrilá",
    title: "Piscina",
  },
  {
    src: galleryBBQ,
    alt: "Área de quiosque e churrasqueira do Clube Shangrilá",
    title: "Quiosque/Churrasqueira",
  },
  {
    src: galleryPlayground,
    alt: "Playground para crianças",
    title: "Playground",
  },
  {
    src: galleryBathrooms,
    alt: "Banheiros masculino e feminino",
    title: "Banheiros",
  },
  {
    src: galleryFirepit,
    alt: "Fogo de chão do clube",
    title: "Fogo de Chão",
  },
  {
    src: galleryPergola,
    alt: "Pergolado do clube",
    title: "Pergolado",
  },
  {
    src: galleryHammocks,
    alt: "Redário com redes coloridas",
    title: "Redário",
  },
  {
    src: galleryChickens,
    alt: "Galinheiro do clube",
    title: "Galinheiro",
  },
  {
    src: galleryBilliards,
    alt: "Sala de bilhar",
    title: "Bilhar",
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
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

        {/* Gallery Section */}
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Nossas Instalações
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja os espaços que tornam o Shangrilá especial
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 aspect-[4/3]"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-2xl font-bold">
                    {image.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
