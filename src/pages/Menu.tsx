import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Menu = () => {
  const menuSections = [
    {
      title: "Cachaças Artesanais",
      items: [
        { name: "Branca, Carvalho, Côco, Banana, Pequi, Mel c/ Gengibre, Carqueijo, Caju", price: "R$ 6,00" }
      ]
    },
    {
      title: "Cachaças e Aguardentes",
      items: [
        { name: "Cabaré", price: "R$ 6,00" },
        { name: "Cachaça 51", price: "R$ 5,00" },
        { name: "Canelinha", price: "R$ 5,00" },
        { name: "Catuaba", price: "R$ 6,00" },
        { name: "Contine", price: "R$ 6,00" },
        { name: "Domecq", price: "R$ 10,00" },
        { name: "Montilla Cristal", price: "R$ 8,00" },
        { name: "Montilla Ouro", price: "R$ 8,00" },
        { name: "Paratudo", price: "R$ 5,00" },
        { name: "Pitu", price: "R$ 5,00" },
        { name: "Sagatiba", price: "R$ 5,00" },
        { name: "Salinas", price: "R$ 12,00" },
        { name: "São Francisco", price: "R$ 6,00" },
        { name: "Seleta", price: "R$ 6,00" },
        { name: "Velho Barreiro", price: "R$ 8,00" }
      ]
    },
    {
      title: "Licores e Destilados",
      items: [
        { name: "Campari", price: "R$ 12,00" },
        { name: "Cynar", price: "R$ 10,00" },
        { name: "Dom Luiz", price: "R$ 10,00" },
        { name: "Dreher", price: "R$ 6,00" },
        { name: "Gin", price: "R$ 6,00" },
        { name: "Gin Abacaxi", price: "R$ 6,00" },
        { name: "Gin Maçã Verde", price: "R$ 6,00" },
        { name: "Jurupinga", price: "R$ 12,00" },
        { name: "Licor 43", price: "R$ 12,00" },
        { name: "Matuta Banana", price: "R$ 12,00" },
        { name: "Menta", price: "R$ 6,00" },
        { name: "St Remy", price: "R$ 12,00" },
        { name: "Tequila Jose Cuervo Ouro", price: "R$ 18,00" },
        { name: "Xiboquinha", price: "R$ 6,00" },
        { name: "Ypioca Carvalho", price: "R$ 10,00" },
        { name: "Ypioca Ouro", price: "R$ 5,00" }
      ]
    },
    {
      title: "Whiskies",
      items: [
        { name: "Whisky Ballantines", price: "R$ 20,00" },
        { name: "Whisky Chivas 12 anos", price: "R$ 27,00" },
        { name: "Whisky Old Eight", price: "R$ 12,00" },
        { name: "Whisky Passport", price: "R$ 15,00" },
        { name: "Whisky Passport Honey", price: "R$ 13,00" },
        { name: "Whisky Passport Selection", price: "R$ 20,00" },
        { name: "Whisky Red Label", price: "R$ 12,00" },
        { name: "Whisky White Horse", price: "R$ 12,00" }
      ]
    },
    {
      title: "Vodka",
      items: [
        { name: "Vodka Smirnoff", price: "R$ 20,00" }
      ]
    },
    {
      title: "Cervejas - Garrafa 600ml",
      items: [
        { name: "Amstel", price: "R$ 12,00" },
        { name: "Skol", price: "R$ 12,00" },
        { name: "Original", price: "R$ 12,00" },
        { name: "Heineken", price: "R$ 18,00" }
      ]
    },
    {
      title: "Cervejas - Lata e Long Neck",
      items: [
        { name: "Skol 1L (Litrão)", price: "R$ 15,00" },
        { name: "Corona Extra 330ml", price: "R$ 11,00" },
        { name: "Império 269ml", price: "R$ 5,00" },
        { name: "Budweiser 269ml", price: "R$ 6,00" },
        { name: "Amstel 269ml", price: "R$ 6,00" },
        { name: "Skol Pilsen 269ml", price: "R$ 6,00" },
        { name: "Brahma Duplo Malte 350ml", price: "R$ 7,50" }
      ]
    },
    {
      title: "Cervejas Zero Álcool",
      items: [
        { name: "Itapaiva 350ml", price: "R$ 6,00" },
        { name: "Heineken 350ml", price: "R$ 7,00" },
        { name: "Sol Zero", price: "R$ 12,00" }
      ]
    },
    {
      title: "Refrigerantes - Lata",
      items: [
        { name: "Itubaina 350ml", price: "R$ 5,00" },
        { name: "Coca-Cola, Guaraná Antarctica, Pepsi Cola, Sprite, Fanta Laranja", price: "R$ 6,00" },
        { name: "Coca-Cola Sem Açúcar 310ml", price: "R$ 6,00" }
      ]
    },
    {
      title: "Refrigerantes - Garrafa 2L",
      items: [
        { name: "Guaraná Antarctica, Soda, Sukita Laranja, Sprite, Fanta Laranja e Uva", price: "R$ 14,00" },
        { name: "Coca-Cola", price: "R$ 18,00" }
      ]
    },
    {
      title: "Caipirinhas de Limão",
      items: [
        { name: "Velho Barreiro", price: "R$ 18,00" },
        { name: "Vodka", price: "R$ 25,00" }
      ]
    },
    {
      title: "Caipirinhas de Cambuci",
      items: [
        { name: "Velho Barreiro", price: "R$ 20,00" },
        { name: "Vodka", price: "R$ 26,00" }
      ]
    },
    {
      title: "Caipirinhas Shangri-La",
      items: [
        { name: "Velho Barreiro", price: "R$ 20,00" },
        { name: "Vodka", price: "R$ 25,00" }
      ]
    },
    {
      title: "Drinks Especiais",
      items: [
        { name: "Shangri-La s/ álcool (suco de cambuci c/ groselha)", price: "R$ 15,00" },
        { name: "Vinho Tinto São Tomé", price: "R$ 8,00" },
        { name: "Vinho Branco Seco Campo Largo", price: "R$ 8,00" },
        { name: "Campari c/ Laranja", price: "R$ 17,00" }
      ]
    },
    {
      title: "Bebidas Mistas",
      items: [
        { name: "Skol Beats Senses 269ml", price: "R$ 8,00" },
        { name: "Chopp de Vinho Draft", price: "R$ 18,00" },
        { name: "Red Line 600ml", price: "R$ 18,00" }
      ]
    },
    {
      title: "Energéticos",
      items: [
        { name: "Red Bull 250ml", price: "R$ 14,00" },
        { name: "Baly 473ml", price: "R$ 12,00" },
        { name: "TNT 473ml", price: "R$ 12,00" },
        { name: "Monster 473ml", price: "R$ 14,00" },
        { name: "Vibe 2L", price: "R$ 25,00" },
        { name: "Baly 2L", price: "R$ 25,00" }
      ]
    },
    {
      title: "Águas e Hidratação",
      items: [
        { name: "Água Tônica Antarctica 350ml", price: "R$ 7,00" },
        { name: "Água com gás 510ml", price: "R$ 4,50" },
        { name: "Água sem gás 510ml", price: "R$ 3,00" },
        { name: "Água sem gás 1,5L", price: "R$ 8,00" },
        { name: "Água de Coco Natural", price: "R$ 10,00" }
      ]
    },
    {
      title: "Sucos e Diversos",
      items: [
        { name: "Gatorade 500ml", price: "R$ 9,00" },
        { name: "Suco Del Valle 290ml", price: "R$ 7,00" },
        { name: "Suco Laranja 1L", price: "R$ 12,00" },
        { name: "Gelo Saborizado", price: "R$ 6,00" },
        { name: "Guaraviton", price: "R$ 4,00" }
      ]
    },
    {
      title: "Porções",
      items: [
        { name: "Frango à Passarinho", price: "R$ 30,00 / R$ 50,00", description: "Pequena / Grande" },
        { name: "Calabresa Acebolada c/ Pão", price: "R$ 30,00 / R$ 50,00", description: "Pequena / Grande" },
        { name: "Batata Frita", price: "R$ 25,00 / R$ 40,00", description: "300g / 500g" },
        { name: "Salame", price: "R$ 20,00 / R$ 35,00", description: "100g / 200g" },
        { name: "Azeitona Verde", price: "R$ 15,00" },
        { name: "Nuggets", price: "R$ 11,00 / R$ 20,00", description: "6 unid / 12 unid" }
      ]
    },
    {
      title: "Lanches Tradicionais (55g)",
      items: [
        { name: "Hambúrguer", price: "R$ 12,00" },
        { name: "X Burguer", price: "R$ 14,00" },
        { name: "X Bacon", price: "R$ 19,00" },
        { name: "X Salada", price: "R$ 16,00" },
        { name: "X Calabresa", price: "R$ 19,00" },
        { name: "X Shangri-La", price: "R$ 18,00", description: "pão de forma, ovo, bacon e queijo" }
      ]
    },
    {
      title: "Lanches Gourmet (150g)",
      items: [
        { name: "Hambúrguer", price: "R$ 17,00" },
        { name: "X Burguer", price: "R$ 21,00" },
        { name: "X Bacon", price: "R$ 26,00" },
        { name: "X Salada", price: "R$ 23,00" }
      ],
      note: "Todos os lanches acompanham batata frita"
    },
    {
      title: "Baldes Promocionais",
      highlight: true,
      items: [
        { 
          name: "Balde Cerveja", 
          price: "R$ 40,00",
          description: "08 unidades – Latas 269ml (Império, Amstel, Budweiser etc.)"
        },
        { 
          name: "Balde Whisky", 
          price: "R$ 180,00",
          description: "1 Whisky Red Label + 4 unidades de gelo + 1 energético (Baly ou Vibe)"
        }
      ]
    },
    {
      title: "Churrasqueira",
      items: [
        { name: "Gelo 5kg", price: "R$ 12,00" },
        { name: "Carvão 2kg", price: "R$ 15,00" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-accent to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white text-center mb-4 animate-fade-in">
            Nosso Cardápio
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Sabores que transformam seu dia no Shangri-La
          </p>
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuSections.map((section, idx) => (
              <Card 
                key={idx} 
                className={`hover:shadow-xl transition-all duration-300 ${
                  section.highlight ? 'border-primary border-2 bg-gradient-to-br from-primary/5 to-accent/5' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className={`text-xl ${section.highlight ? 'text-primary' : 'text-secondary'}`}>
                    {section.title}
                  </CardTitle>
                  {section.note && (
                    <p className="text-sm text-muted-foreground italic mt-2">{section.note}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between items-start gap-2 pb-2 border-b border-border/50 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-foreground leading-tight">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          )}
                        </div>
                        <span className="font-semibold text-primary whitespace-nowrap text-sm">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Note Section */}
          <div className="mt-12 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              <span className="font-semibold text-secondary">Observação:</span> Doses de 50ml. 
              Preços e produtos sujeitos a alterações sem aviso prévio.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Menu;
