import { useMemo } from 'react';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { usePublicMenuProducts, categoryLabels } from '@/hooks/useMenuProducts';

const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category;
};

const Menu = () => {
  const { items, isLoading } = usePublicMenuProducts();

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    
    items.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    // Sort items within each category
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    });

    return groups;
  }, [items]);

  // Sort categories by label
  const sortedCategories = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => 
      getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'pt-BR')
    );
  }, [groupedItems]);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

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
      <section className="py-16 bg-gradient-to-b from-emerald-900 to-emerald-500">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/80 text-lg">Nenhum produto disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => (
                <Card 
                  key={category} 
                  className="hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl text-secondary">
                      {getCategoryLabel(category)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupedItems[category].map((item) => (
                        <div key={item.id} className="flex justify-between items-start gap-2 pb-2 border-b border-border/50 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-foreground leading-tight">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-primary whitespace-nowrap text-sm">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Menu;
