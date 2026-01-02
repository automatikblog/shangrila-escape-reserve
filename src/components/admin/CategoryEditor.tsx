import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CategoryEditorProps {
  category: string;
  categoryLabel: string;
  onCategoryRenamed: () => void;
}

export const CategoryEditor: React.FC<CategoryEditorProps> = ({
  category,
  categoryLabel,
  onCategoryRenamed
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState(categoryLabel);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!newName.trim()) {
      toast.error('Informe o nome da categoria');
      return;
    }

    // Generate new category key from the new name
    const newCategoryKey = newName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    if (!newCategoryKey) {
      toast.error('Nome de categoria inválido');
      return;
    }

    setIsLoading(true);

    try {
      // Update all items with this category to the new category key
      const { error } = await supabase
        .from('menu_items')
        .update({ category: newCategoryKey })
        .eq('category', category);

      if (error) throw error;

      toast.success(`Categoria renomeada para "${newName}"`);
      setIsOpen(false);
      onCategoryRenamed();
    } catch (err: any) {
      console.error('Error renaming category:', err);
      toast.error('Erro ao renomear categoria');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={(e) => {
          e.stopPropagation();
          setNewName(categoryLabel);
          setIsOpen(true);
        }}
        title="Editar nome da categoria"
      >
        <Edit className="h-3 w-3" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renomear Categoria</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nome da Categoria</Label>
              <Input
                id="categoryName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Bebidas Geladas"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Todos os itens desta categoria serão atualizados
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
