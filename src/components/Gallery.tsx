import galleryBBQ from "@/assets/gallery-bbq.jpg";
import galleryPlayground from "@/assets/gallery-playground.jpg";
import galleryCafe from "@/assets/gallery-cafe.jpg";

const images = [
  {
    src: galleryBBQ,
    alt: "Área de churrasqueira do Clube Shangrilá",
    title: "Churrasqueiras",
  },
  {
    src: galleryPlayground,
    alt: "Playground para crianças",
    title: "Playground",
  },
  {
    src: galleryCafe,
    alt: "Café da manhã no clube",
    title: "Café & Lanchonete",
  },
];

const Gallery = () => {
  return (
    <section id="galeria" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Nossas Instalações
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conheça os espaços que tornam o Shangrilá especial
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
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

export default Gallery;
