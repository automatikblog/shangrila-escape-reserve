import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Upload, Camera, FileImage, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem, categoryLabels } from '@/hooks/useMenuItems';

interface ParsedItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  ncm?: string;
  selected: boolean;
  linkedItemId?: string;
  createNew: boolean;
}

interface InvoiceImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: MenuItem[];
  categories: string[];
  onImportComplete: () => void;
}

export const InvoiceImporter: React.FC<InvoiceImporterProps> = ({
  open,
  onOpenChange,
  existingItems,
  categories,
  onImportComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await parseInvoice(base64);
    };
    reader.readAsDataURL(file);
  };

  const parseInvoice = async (imageBase64: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-invoice', {
        body: { image: imageBase64 }
      });

      if (error) throw error;

      if (!data.items || data.items.length === 0) {
        toast.error('Nenhum item identificado na nota');
        return;
      }

      // Try to match parsed items with existing items
      const itemsWithMatches: ParsedItem[] = data.items.map((item: any) => {
        const match = existingItems.find(existing => 
          existing.product_code === item.codigo ||
          existing.name.toLowerCase().includes(item.descricao.toLowerCase().split(' ')[0])
        );
        
        return {
          ...item,
          selected: true,
          linkedItemId: match?.id || undefined,
          createNew: !match
        };
      });

      setParsedItems(itemsWithMatches);
      setStep('review');
      toast.success(`${data.items.length} itens identificados`);
    } catch (err: any) {
      console.error('Error parsing invoice:', err);
      toast.error('Erro ao processar nota fiscal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast.error('Selecione ao menos um item');
      return;
    }

    setIsLoading(true);
    let imported = 0;

    try {
      for (const item of selectedItems) {
        if (item.linkedItemId) {
          // Update existing item stock
          const existingItem = existingItems.find(e => e.id === item.linkedItemId);
          if (existingItem) {
            if (existingItem.is_bottle) {
              // Add bottles to stock
              await supabase
                .from('menu_items')
                .update({
                  bottles_in_stock: (existingItem.bottles_in_stock || 0) + item.quantidade,
                  cost_price: item.valorUnitario
                })
                .eq('id', item.linkedItemId);
            } else {
              // Add units to stock
              await supabase
                .from('menu_items')
                .update({
                  stock_quantity: (existingItem.stock_quantity || 0) + item.quantidade,
                  cost_price: item.valorUnitario
                })
                .eq('id', item.linkedItemId);
            }
            imported++;
          }
        }
        // Note: Creating new items from invoice would need more info (category, price, etc.)
        // For now, we only update existing items
      }

      toast.success(`${imported} itens atualizados no estoque`);
      onImportComplete();
      handleClose();
    } catch (err: any) {
      console.error('Error importing items:', err);
      toast.error('Erro ao importar itens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedItems([]);
    onOpenChange(false);
  };

  const toggleItemSelection = (index: number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateItemLink = (index: number, linkedItemId: string | undefined) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, linkedItemId, createNew: !linkedItemId } : item
    ));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' ? 'Importar Nota Fiscal' : 'Revisar Itens'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="text-center text-muted-foreground text-sm mb-4">
              Envie uma foto ou arquivo da nota fiscal para identificar os produtos automaticamente
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-8 w-8" />
                    <span>Tirar Foto</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="h-32 flex flex-col gap-2"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <>
                    <FileImage className="h-8 w-8" />
                    <span>Escolher Arquivo</span>
                  </>
                )}
              </Button>
            </div>

            {isLoading && (
              <div className="text-center text-sm text-muted-foreground">
                Processando nota fiscal com IA...
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              {parsedItems.filter(i => i.selected).length} de {parsedItems.length} itens selecionados
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {parsedItems.map((item, index) => (
                <Card key={index} className={!item.selected ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleItemSelection(index)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.codigo}
                          </Badge>
                          <span className="font-medium text-sm">{item.descricao}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Qtd: {item.quantidade}</span>
                          <span>R$ {item.valorUnitario.toFixed(2).replace('.', ',')}/un</span>
                        </div>
                        
                        <div className="pt-2">
                          <Label className="text-xs">Vincular a item existente:</Label>
                          <Select
                            value={item.linkedItemId || '__none__'}
                            onValueChange={(val) => updateItemLink(index, val === '__none__' ? undefined : val)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                <span className="text-muted-foreground">Não vincular</span>
                              </SelectItem>
                              {existingItems.map(existing => (
                                <SelectItem key={existing.id} value={existing.id}>
                                  {existing.product_code && `[${existing.product_code}] `}
                                  {existing.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {item.linkedItemId && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>Será adicionado ao estoque existente</span>
                          </div>
                        )}
                        {!item.linkedItemId && item.selected && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Item não vinculado - não será importado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isLoading || parsedItems.filter(i => i.selected && i.linkedItemId).length === 0}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Importar Selecionados
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
