import React, { useState, useMemo } from 'react';
import { useMenuProducts, MenuProduct, MenuProductInput, categoryLabels } from '@/hooks/useMenuProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Loader2, Package, AlertCircle, ChefHat, ShoppingBag, FlaskConical } from 'lucide-react';
import { CategoryEditor } from '@/components/admin/CategoryEditor';
import { ProductRecipeModal } from '@/components/admin/ProductRecipeModal';

const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category;
};

const CardapioPage: React.FC = () => {
  const { items, categories, isLoading, createItem, updateItem, deleteItem, fetchItems } = useMenuProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuProduct | null>(null);
  const [recipeProduct, setRecipeProduct] = useState<MenuProduct | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const [formData, setFormData] = useState<MenuProductInput>({
    name: '',
    price: 0,
    description: '',
    category: '',
    is_available: true,
    goes_to_kitchen: true,
    is_customizable: false
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuProduct[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    Object.keys(groups).forEach(cat => {
      groups[cat].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    });
    return groups;
  }, [filteredItems]);

  const sortedCategories = useMemo(() => {
    return [...new Set(items.map(i => i.category))].sort((a, b) => 
      getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'pt-BR')
    );
  }, [items]);

  const openNewItemDialog = () => {
    setEditingItem(null);
    setIsNewCategory(false);
    setNewCategoryLabel('');
    setFormData({
      name: '',
      price: 0,
      description: '',
      category: sortedCategories[0] || '',
      is_available: true,
      goes_to_kitchen: true,
      is_customizable: false
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuProduct) => {
    setEditingItem(item);
    setIsNewCategory(false);
    setNewCategoryLabel('');
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || '',
      category: item.category,
      is_available: item.is_available,
      goes_to_kitchen: item.goes_to_kitchen,
      is_customizable: item.is_customizable
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const finalCategory = isNewCategory ? newCategoryLabel.trim() : formData.category;
    
    if (!formData.name || !finalCategory || formData.price <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (isNewCategory && !newCategoryLabel.trim()) {
      toast.error('Informe o nome da nova categoria');
      return;
    }

    const dataToSave = { 
      ...formData, 
      category: finalCategory,
      is_available: true 
    };

    setIsSaving(true);

    if (editingItem) {
      const { error } = await updateItem(editingItem.id, dataToSave);
      if (error) {
        toast.error('Erro ao atualizar produto');
      } else {
        toast.success('Produto atualizado com sucesso');
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await createItem(dataToSave);
      if (error) {
        toast.error('Erro ao criar produto');
      } else {
        toast.success('Produto criado com sucesso');
        setIsDialogOpen(false);
      }
    }

    setIsSaving(false);
  };

  const handleDeleteFromMenu = async (item: MenuProduct) => {
    const { error } = await deleteItem(item.id);
    if (error) {
      toast.error('Erro ao excluir do cardápio');
    } else {
      toast.success('Produto excluído do cardápio');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Cardápio
          </h1>
          <p className="text-muted-foreground">{items.length} produtos no cardápio</p>
        </div>
        <Button onClick={openNewItemDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {sortedCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {Object.keys(groupedItems).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione produtos clicando em "Novo Produto"
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {getCategoryLabel(category)}
                <CategoryEditor
                  category={category}
                  categoryLabel={getCategoryLabel(category)}
                  onCategoryRenamed={fetchItems}
                  tableName="menu_products"
                />
                <Badge variant="outline" className="ml-2">{categoryItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {categoryItems.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.goes_to_kitchen && (
                          <span title="Vai para cozinha">
                            <ChefHat className="h-4 w-4 text-orange-500" />
                          </span>
                        )}
                        <span className={`font-medium truncate ${!item.is_available ? 'text-muted-foreground line-through' : ''}`}>
                          {item.name}
                        </span>
                        {!item.is_available && (
                          <Badge variant="outline" className="text-xs">Indisponível</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-medium text-primary">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Montar receita"
                          onClick={() => {
                            setRecipeProduct(item);
                            setIsRecipeModalOpen(true);
                          }}
                        >
                          <FlaskConical className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir do cardápio">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir do Cardápio</AlertDialogTitle>
                              <AlertDialogDescription>
                                Excluir "{item.name}" do cardápio? Esta ação não afeta o estoque.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteFromMenu(item)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <Label htmlFor="price">Preço de Venda (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price || ''}
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              {!isNewCategory ? (
                <div className="space-y-2">
                  <Select
                    value={formData.category}
                    onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryLabel(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova categoria
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nome da categoria (ex: Sobremesas)"
                    value={newCategoryLabel}
                    onChange={e => setNewCategoryLabel(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNewCategory(false)}
                  >
                    Usar categoria existente
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-orange-500" />
                <Label htmlFor="goes_to_kitchen" className="cursor-pointer">Vai para cozinha</Label>
              </div>
              <Switch
                id="goes_to_kitchen"
                checked={formData.goes_to_kitchen ?? true}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, goes_to_kitchen: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Modal */}
      <ProductRecipeModal 
        open={isRecipeModalOpen} 
        onOpenChange={setIsRecipeModalOpen} 
        product={recipeProduct} 
      />
    </div>
  );
};

export default CardapioPage;
