export interface MenuItem {
  id?: string;
  name: string;
  price: string;
  description?: string;
  category: string;
  isAvailable?: boolean;
}

export interface MenuSection {
  title: string;
  category: string;
  items: MenuItem[];
  highlight?: boolean;
  note?: string;
}

export const menuSections: MenuSection[] = [
  {
    title: "Cachaças e Aguardentes",
    category: "cachacas",
    items: [
      { name: "Artesanais: Branca, Carvalho, Côco, Banana, Pequi, Mel c/ Gengibre, Carqueijo, Caju", price: "R$ 6,00", category: "cachacas" },
      { name: "Cabaré", price: "R$ 6,00", category: "cachacas" },
      { name: "Cachaça 51", price: "R$ 5,00", category: "cachacas" },
      { name: "Canelinha", price: "R$ 5,00", category: "cachacas" },
      { name: "Catuaba", price: "R$ 6,00", category: "cachacas" },
      { name: "Contine", price: "R$ 6,00", category: "cachacas" },
      { name: "Domecq", price: "R$ 10,00", category: "cachacas" },
      { name: "Montilla Cristal", price: "R$ 8,00", category: "cachacas" },
      { name: "Montilla Ouro", price: "R$ 8,00", category: "cachacas" },
      { name: "Paratudo", price: "R$ 5,00", category: "cachacas" },
      { name: "Pitu", price: "R$ 5,00", category: "cachacas" },
      { name: "Sagatiba", price: "R$ 5,00", category: "cachacas" },
      { name: "Salinas", price: "R$ 12,00", category: "cachacas" },
      { name: "São Francisco", price: "R$ 6,00", category: "cachacas" },
      { name: "Seleta", price: "R$ 6,00", category: "cachacas" },
      { name: "Velho Barreiro", price: "R$ 8,00", category: "cachacas" }
    ]
  },
  {
    title: "Licores e Destilados",
    category: "licores",
    items: [
      { name: "Campari", price: "R$ 12,00", category: "licores" },
      { name: "Cynar", price: "R$ 10,00", category: "licores" },
      { name: "Dom Luiz", price: "R$ 10,00", category: "licores" },
      { name: "Dreher", price: "R$ 6,00", category: "licores" },
      { name: "Gin", price: "R$ 6,00", category: "licores" },
      { name: "Gin Abacaxi", price: "R$ 6,00", category: "licores" },
      { name: "Gin Maçã Verde", price: "R$ 6,00", category: "licores" },
      { name: "Jurupinga", price: "R$ 12,00", category: "licores" },
      { name: "Licor 43", price: "R$ 12,00", category: "licores" },
      { name: "Matuta Banana", price: "R$ 12,00", category: "licores" },
      { name: "Menta", price: "R$ 6,00", category: "licores" },
      { name: "St Remy", price: "R$ 12,00", category: "licores" },
      { name: "Tequila Jose Cuervo Ouro", price: "R$ 18,00", category: "licores" },
      { name: "Xiboquinha", price: "R$ 6,00", category: "licores" },
      { name: "Ypioca Carvalho", price: "R$ 10,00", category: "licores" },
      { name: "Ypioca Ouro", price: "R$ 5,00", category: "licores" }
    ]
  },
  {
    title: "Whiskies",
    category: "whiskies",
    items: [
      { name: "Whisky Ballantines", price: "R$ 20,00", category: "whiskies" },
      { name: "Whisky Chivas 12 anos", price: "R$ 27,00", category: "whiskies" },
      { name: "Whisky Old Eight", price: "R$ 12,00", category: "whiskies" },
      { name: "Whisky Passport", price: "R$ 15,00", category: "whiskies" },
      { name: "Whisky Passport Honey", price: "R$ 13,00", category: "whiskies" },
      { name: "Whisky Passport Selection", price: "R$ 20,00", category: "whiskies" },
      { name: "Whisky Red Label", price: "R$ 12,00", category: "whiskies" },
      { name: "Whisky White Horse", price: "R$ 12,00", category: "whiskies" }
    ]
  },
  {
    title: "Vodka",
    category: "vodka",
    items: [
      { name: "Vodka Smirnoff", price: "R$ 20,00", category: "vodka" }
    ]
  },
  {
    title: "Cervejas - Garrafa 600ml",
    category: "cervejas-garrafa",
    items: [
      { name: "Amstel", price: "R$ 12,00", category: "cervejas-garrafa" },
      { name: "Skol", price: "R$ 12,00", category: "cervejas-garrafa" },
      { name: "Original", price: "R$ 12,00", category: "cervejas-garrafa" },
      { name: "Heineken", price: "R$ 18,00", category: "cervejas-garrafa" }
    ]
  },
  {
    title: "Cervejas - Lata e Long Neck",
    category: "cervejas-lata",
    items: [
      { name: "Skol 1L (Litrão)", price: "R$ 15,00", category: "cervejas-lata" },
      { name: "Corona Extra 330ml", price: "R$ 11,00", category: "cervejas-lata" },
      { name: "Império 269ml", price: "R$ 5,00", category: "cervejas-lata" },
      { name: "Budweiser 269ml", price: "R$ 6,00", category: "cervejas-lata" },
      { name: "Amstel 269ml", price: "R$ 6,00", category: "cervejas-lata" },
      { name: "Skol Pilsen 269ml", price: "R$ 6,00", category: "cervejas-lata" },
      { name: "Brahma Duplo Malte 350ml", price: "R$ 7,50", category: "cervejas-lata" }
    ]
  },
  {
    title: "Cervejas Zero Álcool",
    category: "cervejas-zero",
    items: [
      { name: "Itapaiva 350ml", price: "R$ 6,00", category: "cervejas-zero" },
      { name: "Heineken 350ml", price: "R$ 7,00", category: "cervejas-zero" },
      { name: "Sol Zero", price: "R$ 12,00", category: "cervejas-zero" }
    ]
  },
  {
    title: "Refrigerantes - Lata",
    category: "refrigerantes-lata",
    items: [
      { name: "Itubaina 350ml", price: "R$ 5,00", category: "refrigerantes-lata" },
      { name: "Coca-Cola, Guaraná Antarctica, Pepsi Cola, Sprite, Fanta Laranja", price: "R$ 6,00", category: "refrigerantes-lata" },
      { name: "Coca-Cola Sem Açúcar 310ml", price: "R$ 6,00", category: "refrigerantes-lata" }
    ]
  },
  {
    title: "Refrigerantes - Garrafa 2L",
    category: "refrigerantes-garrafa",
    items: [
      { name: "Guaraná Antarctica, Soda, Sukita Laranja, Sprite, Fanta Laranja e Uva", price: "R$ 14,00", category: "refrigerantes-garrafa" },
      { name: "Coca-Cola", price: "R$ 18,00", category: "refrigerantes-garrafa" }
    ]
  },
  {
    title: "Caipirinhas de Limão",
    category: "caipirinhas-limao",
    items: [
      { name: "Velho Barreiro", price: "R$ 18,00", category: "caipirinhas-limao" },
      { name: "Vodka", price: "R$ 25,00", category: "caipirinhas-limao" }
    ]
  },
  {
    title: "Caipirinhas de Cambuci",
    category: "caipirinhas-cambuci",
    items: [
      { name: "Velho Barreiro", price: "R$ 20,00", category: "caipirinhas-cambuci" },
      { name: "Vodka", price: "R$ 26,00", category: "caipirinhas-cambuci" }
    ]
  },
  {
    title: "Caipirinhas Shangri-La",
    category: "caipirinhas-shangrila",
    items: [
      { name: "Velho Barreiro", price: "R$ 20,00", category: "caipirinhas-shangrila" },
      { name: "Vodka", price: "R$ 25,00", category: "caipirinhas-shangrila" }
    ]
  },
  {
    title: "Drinks Especiais",
    category: "drinks",
    items: [
      { name: "Shangri-La s/ álcool (suco de cambuci c/ groselha)", price: "R$ 15,00", category: "drinks" },
      { name: "Vinho Tinto São Tomé", price: "R$ 8,00", category: "drinks" },
      { name: "Vinho Branco Seco Campo Largo", price: "R$ 8,00", category: "drinks" },
      { name: "Campari c/ Laranja", price: "R$ 17,00", category: "drinks" }
    ]
  },
  {
    title: "Bebidas Mistas",
    category: "bebidas-mistas",
    items: [
      { name: "Skol Beats Senses 269ml", price: "R$ 8,00", category: "bebidas-mistas" },
      { name: "Chopp de Vinho Draft", price: "R$ 18,00", category: "bebidas-mistas" },
      { name: "Red Line 600ml", price: "R$ 18,00", category: "bebidas-mistas" }
    ]
  },
  {
    title: "Energéticos",
    category: "energeticos",
    items: [
      { name: "Red Bull 250ml", price: "R$ 14,00", category: "energeticos" },
      { name: "Baly 473ml", price: "R$ 12,00", category: "energeticos" },
      { name: "TNT 473ml", price: "R$ 12,00", category: "energeticos" },
      { name: "Monster 473ml", price: "R$ 14,00", category: "energeticos" },
      { name: "Vibe 2L", price: "R$ 25,00", category: "energeticos" },
      { name: "Baly 2L", price: "R$ 25,00", category: "energeticos" }
    ]
  },
  {
    title: "Águas e Hidratação",
    category: "aguas",
    items: [
      { name: "Água Tônica Antarctica 350ml", price: "R$ 7,00", category: "aguas" },
      { name: "Água com gás 510ml", price: "R$ 4,50", category: "aguas" },
      { name: "Água sem gás 510ml", price: "R$ 3,00", category: "aguas" },
      { name: "Água sem gás 1,5L", price: "R$ 8,00", category: "aguas" },
      { name: "Água de Coco Natural", price: "R$ 10,00", category: "aguas" }
    ]
  },
  {
    title: "Sucos e Diversos",
    category: "sucos",
    items: [
      { name: "Gatorade 500ml", price: "R$ 9,00", category: "sucos" },
      { name: "Suco Del Valle 290ml", price: "R$ 7,00", category: "sucos" },
      { name: "Suco Laranja 1L", price: "R$ 12,00", category: "sucos" },
      { name: "Gelo Saborizado", price: "R$ 6,00", category: "sucos" },
      { name: "Guaraviton", price: "R$ 4,00", category: "sucos" }
    ]
  },
  {
    title: "Porções",
    category: "porcoes",
    items: [
      { name: "Frango à Passarinho", price: "R$ 30,00 / R$ 50,00", description: "Pequena / Grande", category: "porcoes" },
      { name: "Calabresa Acebolada c/ Pão", price: "R$ 30,00 / R$ 50,00", description: "Pequena / Grande", category: "porcoes" },
      { name: "Batata Frita", price: "R$ 25,00 / R$ 40,00", description: "300g / 500g", category: "porcoes" },
      { name: "Salame", price: "R$ 20,00 / R$ 35,00", description: "100g / 200g", category: "porcoes" },
      { name: "Azeitona Verde", price: "R$ 15,00", category: "porcoes" },
      { name: "Nuggets", price: "R$ 11,00 / R$ 20,00", description: "6 unid / 12 unid", category: "porcoes" }
    ]
  },
  {
    title: "Lanches Tradicionais (55g)",
    category: "lanches-tradicionais",
    items: [
      { name: "Hambúrguer", price: "R$ 12,00", category: "lanches-tradicionais" },
      { name: "X Burguer", price: "R$ 14,00", category: "lanches-tradicionais" },
      { name: "X Bacon", price: "R$ 19,00", category: "lanches-tradicionais" },
      { name: "X Salada", price: "R$ 16,00", category: "lanches-tradicionais" },
      { name: "X Calabresa", price: "R$ 19,00", category: "lanches-tradicionais" },
      { name: "X Shangri-La", price: "R$ 18,00", description: "pão de forma, ovo, bacon e queijo", category: "lanches-tradicionais" }
    ]
  },
  {
    title: "Lanches Gourmet (150g)",
    category: "lanches-gourmet",
    items: [
      { name: "Hambúrguer", price: "R$ 17,00", category: "lanches-gourmet" },
      { name: "X Burguer", price: "R$ 21,00", category: "lanches-gourmet" },
      { name: "X Bacon", price: "R$ 26,00", category: "lanches-gourmet" },
      { name: "X Salada", price: "R$ 23,00", category: "lanches-gourmet" }
    ],
    note: "Todos os lanches acompanham batata frita"
  },
  {
    title: "Baldes Promocionais",
    category: "baldes",
    highlight: true,
    items: [
      { 
        name: "Balde Cerveja", 
        price: "R$ 40,00",
        description: "08 unidades – Latas 269ml (Império, Amstel, Budweiser etc.)",
        category: "baldes"
      },
      { 
        name: "Balde Whisky", 
        price: "R$ 180,00",
        description: "1 Whisky Red Label + 4 unidades de gelo + 1 energético (Baly ou Vibe)",
        category: "baldes"
      }
    ]
  },
  {
    title: "Churrasqueira",
    category: "churrasqueira",
    items: [
      { name: "Gelo 5kg", price: "R$ 12,00", category: "churrasqueira" },
      { name: "Carvão 2kg", price: "R$ 15,00", category: "churrasqueira" }
    ]
  }
];

export const parsePrice = (priceString: string): number => {
  const match = priceString.match(/R\$\s*([\d,]+)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  return 0;
};

export const getAllMenuItems = (): MenuItem[] => {
  return menuSections.flatMap(section => section.items);
};
