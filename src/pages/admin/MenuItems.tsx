import React, { useState, useMemo } from 'react';
import { useMenuItems, MenuItem, MenuItemInput, categoryLabels } from '@/hooks/useMenuItems';
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
import { Plus, Search, Edit, Trash2, Loader2, Package, AlertCircle, Wine, FileImage } from 'lucide-react';
import { InvoiceImporter } from '@/components/admin/InvoiceImporter';

// Dynamic category labels that can be extended at runtime
const dynamicCategoryLabels: Record<string, string> = { ...categoryLabels };

const getCategoryLabel = (category: string): string => {
  return dynamicCategoryLabels[category] || categoryLabels[category] || category;
};

const MenuItemsPage: React.FC = () => {
  const { items, categories, isLoading, createItem, updateItem, deleteItem, fetchItems, getAvailableDoses } = useMenuItems();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryKey, setNewCategoryKey] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  const [formData, setFormData] = useState<MenuItemInput>({
    name: '',
    price: 0,
    description: '',
    category: '',
    is_available: true,
    stock_quantity: null,
    product_code: null,
    is_bottle: false,
    bottle_ml: null,
    dose_ml: null,
    bottles_in_stock: 0,
    current_bottle_ml: 0,
    cost_price: null
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.product_code && item.product_code.some(code => code.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
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

  const allCategories = useMemo(() => {
    const fromItems = new Set(items.map(i => i.category));
    const fromLabels = new Set(Object.keys(categoryLabels));
    const fromDynamic = new Set(Object.keys(dynamicCategoryLabels));
    return [...new Set([...fromItems, ...fromLabels, ...fromDynamic])].sort((a, b) => 
      getCategoryLabel(a).localeCompare(getCategoryLabel(b), 'pt-BR')
    );
  }, [items]);

  const openNewItemDialog = () => {
    setEditingItem(null);
    setIsNewCategory(false);
    setNewCategoryKey('');
    setNewCategoryLabel('');
    setFormData({
      name: '',
      price: 0,
      description: '',
      category: categories[0] || '',
      is_available: true,
      stock_quantity: null,
      product_code: null,
      is_bottle: false,
      bottle_ml: null,
      dose_ml: null,
      bottles_in_stock: 0,
      current_bottle_ml: 0,
      cost_price: null
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setIsNewCategory(false);
    setNewCategoryKey('');
    setNewCategoryLabel('');
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description || '',
      category: item.category,
      is_available: item.is_available,
      stock_quantity: item.stock_quantity,
      product_code: item.product_code,
      is_bottle: item.is_bottle,
      bottle_ml: item.bottle_ml,
      dose_ml: item.dose_ml,
      bottles_in_stock: item.bottles_in_stock,
      current_bottle_ml: item.current_bottle_ml,
      cost_price: item.cost_price
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const finalCategory = isNewCategory ? newCategoryKey.toLowerCase().replace(/\s+/g, '-') : formData.category;
    
    if (!formData.name || !finalCategory || formData.price <= 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (isNewCategory && !newCategoryLabel) {
      toast.error('Informe o nome da nova categoria');
      return;
    }

    // Determine availability based on stock type
    let isAvailable = true;
    if (formData.is_bottle) {
      // For bottles, available if there's any ml available
      const totalMl = ((formData.bottles_in_stock || 0) * (formData.bottle_ml || 0)) + (formData.current_bottle_ml || 0);
      isAvailable = totalMl > 0 || formData.bottles_in_stock === null;
    } else {
      // For regular items, available if stock > 0 or no stock control
      isAvailable = formData.stock_quantity === null || formData.stock_quantity > 0;
    }

    const dataToSave = { ...formData, category: finalCategory, is_available: isAvailable };
    
    if (isNewCategory && newCategoryKey && newCategoryLabel) {
      dynamicCategoryLabels[finalCategory] = newCategoryLabel;
    }

    setIsSaving(true);

    if (editingItem) {
      const { error } = await updateItem(editingItem.id, dataToSave);
      if (error) {
        toast.error('Erro ao atualizar item');
      } else {
        toast.success('Item atualizado com sucesso');
        setIsDialogOpen(false);
      }
    } else {
      const { error } = await createItem(dataToSave);
      if (error) {
        toast.error('Erro ao criar item');
      } else {
        toast.success('Item criado com sucesso');
        setIsDialogOpen(false);
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (item: MenuItem) => {
    const { error } = await deleteItem(item.id);
    if (error) {
      toast.error('Erro ao excluir item');
    } else {
      toast.success('Item excluído com sucesso');
    }
  };

  const getStockDisplay = (item: MenuItem) => {
    if (item.is_bottle && item.dose_ml) {
      const bottles = item.bottles_in_stock || 0;
      const currentMl = item.current_bottle_ml || 0;
      const doses = getAvailableDoses(item);
      
      if (bottles === 0 && currentMl === 0) {
        return <Badge variant="destructive" className="text-xs">Esgotado</Badge>;
      }
      
      const dosesPerBottle = item.bottle_ml ? Math.floor(item.bottle_ml / item.dose_ml) : 0;
      
      return (
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="text-xs">
            {bottles} gf{bottles !== 1 ? 's' : ''} + {currentMl}ml
          </Badge>
          <span className="text-xs text-muted-foreground">
            ≈{doses} doses ({dosesPerBottle}/gf)
          </span>
        </div>
      );
    }

    if (item.stock_quantity === null) {
      return <Badge variant="outline" className="text-xs">Sem controle</Badge>;
    }
    if (item.stock_quantity <= 0) {
      return <Badge variant="destructive" className="text-xs">Esgotado</Badge>;
    }
    if (item.stock_quantity <= 5) {
      return <Badge className="bg-yellow-500 text-xs">{item.stock_quantity} un</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{item.stock_quantity} un</Badge>;
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
          <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">{items.length} itens cadastrados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImporterOpen(true)}>
            <FileImage className="h-4 w-4 mr-2" />
            Importar Nota
          </Button>
          <Button onClick={openNewItemDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
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
                {categories.map(cat => (
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
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {getCategoryLabel(category)}
                <Badge variant="outline" className="ml-2">{categoryItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {categoryItems.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.product_code && item.product_code.length > 0 && (
                          <Badge variant="outline" className="font-mono text-xs" title={item.product_code.join(', ')}>
                            {item.product_code[0]}
                            {item.product_code.length > 1 && ` +${item.product_code.length - 1}`}
                          </Badge>
                        )}
                        {item.is_bottle && (
                          <Wine className="h-4 w-4 text-purple-500" />
                        )}
                        <span className={`font-medium truncate ${!item.is_available ? 'text-muted-foreground line-through' : ''}`}>
                          {item.name}
                        </span>
                        {item.is_bottle && item.bottle_ml && (
                          <span className="text-xs text-muted-foreground">
                            ({item.bottle_ml}ml)
                          </span>
                        )}
                        {!item.is_available && (
                          <Badge variant="outline" className="text-xs">Indisponível</Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      )}
                      {item.is_bottle && item.dose_ml && (
                        <p className="text-xs text-muted-foreground">
                          Dose: {item.dose_ml}ml
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {getStockDisplay(item)}
                      <span className="font-medium text-primary">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                        {item.is_bottle && <span className="text-xs text-muted-foreground">/dose</span>}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir "{item.name}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item)}>
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
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_code">Códigos do Produto (separados por vírgula)</Label>
              <Input
                id="product_code"
                value={formData.product_code?.join(', ') || ''}
                onChange={e => {
                  const value = e.target.value;
                  const codes = value ? value.split(',').map(c => c.trim()).filter(c => c) : null;
                  setFormData(prev => ({ ...prev, product_code: codes && codes.length > 0 ? codes : null }));
                }}
                placeholder="Ex: 0000001715, 7891149100118"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Códigos de diferentes fornecedores
              </p>
            </div>

            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do item"
              />
            </div>

            <div>
              <Label htmlFor="price">Preço de Venda (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price ?? ''}
                onChange={e => setFormData(prev => ({ 
                  ...prev, 
                  cost_price: e.target.value === '' ? null : parseFloat(e.target.value) 
                }))}
                placeholder="Opcional"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria *</Label>
              {!isNewCategory ? (
                <div className="space-y-2">
                  <Select 
                    value={formData.category} 
                    onValueChange={val => {
                      if (val === '__new__') {
                        setIsNewCategory(true);
                        setFormData(prev => ({ ...prev, category: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, category: val }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__new__" className="text-primary font-medium border-b border-border mb-1 pb-2">
                        + Criar nova categoria
                      </SelectItem>
                      {allCategories.map(key => (
                        <SelectItem key={key} value={key}>{getCategoryLabel(key)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Nome da categoria (ex: Sobremesas)"
                    value={newCategoryLabel}
                    onChange={e => {
                      setNewCategoryLabel(e.target.value);
                      setNewCategoryKey(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsNewCategory(false)}
                  >
                    Cancelar nova categoria
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value || null }))}
                placeholder="Descrição opcional"
              />
            </div>

            {/* Bottle toggle */}
            <div className="flex items-center justify-between py-2 border-t border-b">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 text-purple-500" />
                <Label htmlFor="is_bottle" className="cursor-pointer">Vendido por dose (garrafa)</Label>
              </div>
              <Switch
                id="is_bottle"
                checked={formData.is_bottle}
                onCheckedChange={checked => setFormData(prev => ({ 
                  ...prev, 
                  is_bottle: checked,
                  stock_quantity: checked ? null : prev.stock_quantity
                }))}
              />
            </div>

            {formData.is_bottle ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bottle_ml">mL da Garrafa</Label>
                    <Input
                      id="bottle_ml"
                      type="number"
                      min="0"
                      value={formData.bottle_ml ?? ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        bottle_ml: e.target.value === '' ? null : parseInt(e.target.value) 
                      }))}
                      placeholder="Ex: 700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dose_ml">mL da Dose</Label>
                    <Input
                      id="dose_ml"
                      type="number"
                      min="0"
                      value={formData.dose_ml ?? ''}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        dose_ml: e.target.value === '' ? null : parseInt(e.target.value) 
                      }))}
                      placeholder="Ex: 50"
                    />
                  </div>
                </div>
                
                {formData.bottle_ml && formData.dose_ml && (
                  <p className="text-xs text-muted-foreground">
                    = {Math.floor(formData.bottle_ml / formData.dose_ml)} doses por garrafa
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bottles_in_stock">Garrafas Fechadas</Label>
                    <Input
                      id="bottles_in_stock"
                      type="number"
                      min="0"
                      value={formData.bottles_in_stock ?? 0}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        bottles_in_stock: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="current_bottle_ml">mL na Garrafa Aberta</Label>
                    <Input
                      id="current_bottle_ml"
                      type="number"
                      min="0"
                      max={formData.bottle_ml || undefined}
                      value={formData.current_bottle_ml ?? 0}
                      onChange={e => setFormData(prev => ({ 
                        ...prev, 
                        current_bottle_ml: parseInt(e.target.value) || 0 
                      }))}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="stock">Estoque (unidades)</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock_quantity ?? ''}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    stock_quantity: e.target.value === '' ? null : parseInt(e.target.value) 
                  }))}
                  placeholder="Vazio = sem controle"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe vazio para sem controle de estoque
                </p>
              </div>
            )}
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

      {/* Invoice Importer */}
      <InvoiceImporter
        open={isImporterOpen}
        onOpenChange={setIsImporterOpen}
        existingItems={items}
        categories={categories}
        onImportComplete={fetchItems}
      />
    </div>
  );
};

export default MenuItemsPage;
