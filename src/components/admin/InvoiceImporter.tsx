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
import { Loader2, Upload, Camera, FileImage, Check, AlertCircle, Edit2 } from 'lucide-react';
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
  editedQuantity?: number;
}

interface InvoiceImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: MenuItem[];
  categories: string[];
  onImportComplete: () => void;
}

// Helper function to normalize strings for matching
const normalizeForMatch = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper function to extract key terms from product description
const extractKeyTerms = (description: string): string[] => {
  const normalized = normalizeForMatch(description);
  // Common brand names and product types to match
  const terms = normalized.split(' ').filter(term => term.length > 2);
  return terms;
};

// Score how well two items match
const calculateMatchScore = (invoiceDesc: string, invoiceCode: string, existingItem: MenuItem): number => {
  let score = 0;
  
  // Exact code match is highest priority
  if (existingItem.product_code && invoiceCode) {
    if (existingItem.product_code === invoiceCode) {
      return 100;
    }
    if (existingItem.product_code.includes(invoiceCode) || invoiceCode.includes(existingItem.product_code)) {
      score += 50;
    }
  }
  
  const invoiceTerms = extractKeyTerms(invoiceDesc);
  const itemTerms = extractKeyTerms(existingItem.name);
  
  // Check for brand matches (important terms like AMSTEL, HEINEKEN, etc)
  const brandMatches = invoiceTerms.filter(term => itemTerms.includes(term));
  score += brandMatches.length * 15;
  
  // Check for size/volume matches (269ml, 600ml, etc)
  const sizePattern = /(\d+)\s*ml/i;
  const invoiceSizeMatch = invoiceDesc.match(sizePattern);
  const itemSizeMatch = existingItem.name.match(sizePattern);
  
  if (invoiceSizeMatch && itemSizeMatch && invoiceSizeMatch[1] === itemSizeMatch[1]) {
    score += 30;
  }
  
  // Penalize if description suggests pack vs single item mismatch
  const invoiceIsPack = /\d+\s*x\s*\d+|pack|caixa|fardo|engradado/i.test(invoiceDesc);
  const itemIsPack = /balde|pack|caixa|fardo|\d+\s*unid/i.test(existingItem.name);
  
  if (invoiceIsPack !== itemIsPack) {
    score -= 20;
  }
  
  return Math.max(0, score);
};

// Find best matching item
const findBestMatch = (invoiceDesc: string, invoiceCode: string, existingItems: MenuItem[]): MenuItem | undefined => {
  let bestMatch: MenuItem | undefined;
  let bestScore = 0;
  
  for (const item of existingItems) {
    const score = calculateMatchScore(invoiceDesc, invoiceCode, item);
    if (score > bestScore && score >= 15) { // Minimum threshold
      bestScore = score;
      bestMatch = item;
    }
  }
  
  return bestMatch;
};

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

      // Try to match parsed items with existing items using smart matching
      const itemsWithMatches: ParsedItem[] = data.items.map((item: any) => {
        const bestMatch = findBestMatch(item.descricao, item.codigo, existingItems);
        
        return {
          ...item,
          selected: true,
          linkedItemId: bestMatch?.id || undefined,
          createNew: !bestMatch,
          editedQuantity: item.quantidade
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
    const selectedItems = parsedItems.filter(item => item.selected && item.linkedItemId);
    if (selectedItems.length === 0) {
      toast.error('Selecione ao menos um item vinculado');
      return;
    }

    setIsLoading(true);
    let imported = 0;

    try {
      for (const item of selectedItems) {
        const existingItem = existingItems.find(e => e.id === item.linkedItemId);
        if (!existingItem) continue;

        const quantityToAdd = item.editedQuantity ?? item.quantidade;

        if (existingItem.is_bottle) {
          // Add bottles to stock
          await supabase
            .from('menu_items')
            .update({
              bottles_in_stock: (existingItem.bottles_in_stock || 0) + quantityToAdd,
              cost_price: item.valorUnitario,
              product_code: existingItem.product_code || item.codigo
            })
            .eq('id', item.linkedItemId);
        } else {
          // Add units to stock
          await supabase
            .from('menu_items')
            .update({
              stock_quantity: (existingItem.stock_quantity || 0) + quantityToAdd,
              cost_price: item.valorUnitario,
              product_code: existingItem.product_code || item.codigo
            })
            .eq('id', item.linkedItemId);
        }
        imported++;
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

  const updateItemQuantity = (index: number, quantity: number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, editedQuantity: quantity } : item
    ));
  };

  // Sort existing items to show best matches first
  const getSortedExistingItems = (invoiceItem: ParsedItem) => {
    return [...existingItems].sort((a, b) => {
      const scoreA = calculateMatchScore(invoiceItem.descricao, invoiceItem.codigo, a);
      const scoreB = calculateMatchScore(invoiceItem.descricao, invoiceItem.codigo, b);
      return scoreB - scoreA;
    });
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
              {parsedItems.filter(i => i.selected && i.linkedItemId).length} de {parsedItems.length} itens prontos para importar
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
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.codigo}
                          </Badge>
                          <span className="font-medium text-sm">{item.descricao}</span>
                        </div>
                        
                        {/* Editable quantity and price */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.editedQuantity ?? item.quantidade}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20 h-8"
                            />
                          </div>
                          <span className="text-muted-foreground">
                            R$ {item.valorUnitario.toFixed(2).replace('.', ',')}/un
                          </span>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Vincular a item do estoque:</Label>
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
                              {getSortedExistingItems(item).map(existing => {
                                const matchScore = calculateMatchScore(item.descricao, item.codigo, existing);
                                return (
                                  <SelectItem key={existing.id} value={existing.id}>
                                    <div className="flex items-center gap-2">
                                      {matchScore >= 30 && (
                                        <Badge variant="secondary" className="text-[10px] px-1">
                                          Sugerido
                                        </Badge>
                                      )}
                                      {existing.product_code && (
                                        <span className="text-xs text-muted-foreground font-mono">
                                          [{existing.product_code}]
                                        </span>
                                      )}
                                      <span>{existing.name}</span>
                                      {existing.is_bottle && (
                                        <span className="text-xs text-muted-foreground">
                                          ({existing.bottles_in_stock || 0} gfs)
                                        </span>
                                      )}
                                      {!existing.is_bottle && existing.stock_quantity !== null && (
                                        <span className="text-xs text-muted-foreground">
                                          ({existing.stock_quantity} un)
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {item.linkedItemId && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>
                              +{item.editedQuantity ?? item.quantidade} será adicionado ao estoque
                            </span>
                          </div>
                        )}
                        {!item.linkedItemId && item.selected && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Selecione um item do estoque para vincular</span>
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
