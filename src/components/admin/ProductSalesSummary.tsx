import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ShoppingBag, Package } from 'lucide-react';
import { useProductSalesSummary } from '@/hooks/useProductSalesSummary';

const ProductSalesSummary: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { sales, isLoading, totalRevenue, totalItems, fetchSales } = useProductSalesSummary();

  useEffect(() => {
    fetchSales(startDate, endDate);
  }, [startDate, endDate, fetchSales]);

  const setQuickFilter = (days: number) => {
    if (days === 0) {
      // Today
      setStartDate(new Date());
      setEndDate(new Date());
    } else if (days === -1) {
      // Yesterday
      const yesterday = subDays(new Date(), 1);
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else {
      setStartDate(subDays(new Date(), days));
      setEndDate(new Date());
    }
  };

  // Group sales by category for better organization
  const salesByCategory = sales.reduce((acc, sale) => {
    if (!acc[sale.category]) {
      acc[sale.category] = [];
    }
    acc[sale.category].push(sale);
    return acc;
  }, {} as Record<string, typeof sales>);

  const categoryOrder = ['servicos', 'lanches', 'bebidas', 'drinks', 'porcoes', 'sobremesas'];
  const sortedCategories = Object.keys(salesByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      servicos: 'Serviços',
      lanches: 'Lanches',
      bebidas: 'Bebidas',
      drinks: 'Drinks',
      porcoes: 'Porções',
      sobremesas: 'Sobremesas',
    };
    return labels[category] || category;
  };

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <ShoppingBag className="h-5 w-5 text-blue-500" />
        <CardTitle>Resumo de Vendas por Produto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal h-8",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-3 w-3" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => d && setStartDate(d)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal h-8",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-3 w-3" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => d && setEndDate(d)}
                  disabled={(date) => date > new Date() || date < startDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickFilter(0)}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickFilter(-1)}>
              Ontem
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickFilter(7)}>
              7 dias
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setQuickFilter(30)}>
              30 dias
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Total Vendido</p>
            <p className="text-xl font-bold text-blue-600">
              {isLoading ? '...' : `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`}
            </p>
          </div>
          <div className="bg-background p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Itens Vendidos</p>
            <p className="text-xl font-bold">
              {isLoading ? '...' : totalItems}
            </p>
          </div>
        </div>

        {/* Sales List by Category */}
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Carregando...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Nenhuma venda no período selecionado
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-blue-500/5 py-1">
                  {getCategoryLabel(category)}
                </h4>
                <div className="space-y-1">
                  {salesByCategory[category].map((sale) => (
                    <div
                      key={sale.item_name}
                      className="flex items-center justify-between p-2 bg-background rounded-lg border text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Badge variant="secondary" className="shrink-0 text-xs font-bold w-8 justify-center">
                          {sale.total_quantity}x
                        </Badge>
                        <span className="truncate">{sale.item_name}</span>
                      </div>
                      <span className="font-medium text-primary shrink-0 ml-2">
                        R$ {sale.total_revenue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductSalesSummary;
