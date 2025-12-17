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
import { Loader2, Upload, Camera, FileImage, Check, AlertCircle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from '@/hooks/useMenuItems';

interface ParsedItem {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  ncm?: string;
  selected: boolean;
  linkedItemId?: string;
  createNew: boolean;
  // Pack detection
  unitsPerPack: number;
  totalUnits: number;
  editedTotalUnits: string; // Changed to string to allow empty field during editing
  isPack: boolean;
  // New item creation
  newItemName?: string;
  newItemCategory?: string;
}

interface InvoiceImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingItems: MenuItem[];
  categories: string[];
  onImportComplete: () => void;
}

// Detect pack pattern and extract units per pack
const detectPackInfo = (description: string): { isPack: boolean; unitsPerPack: number } => {
  // Match patterns like "12X269ML", "6X1L", "24 x 350ml", "12UN", "CX 12"
  const patterns = [
    /(\d+)\s*[xX×]\s*\d+/,           // 12X269ML, 6x1L
    /(\d+)\s*UN/i,                    // 12UN
    /CX\s*(\d+)/i,                    // CX 12
    /(\d+)\s*UNID/i,                  // 12 UNIDADES
    /PACK\s*(\d+)/i,                  // PACK 12
    /(\d+)\s*LATAS?/i,                // 12 LATAS
    /(\d+)\s*GARRAFAS?/i,             // 6 GARRAFAS
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const units = parseInt(match[1]);
      if (units > 1 && units <= 48) { // Reasonable pack size
        return { isPack: true, unitsPerPack: units };
      }
    }
  }
  
  return { isPack: false, unitsPerPack: 1 };
};

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
  const terms = normalized.split(' ').filter(term => term.length > 2);
  return terms;
};

// Score how well two items match
const calculateMatchScore = (invoiceDesc: string, invoiceCode: string, existingItem: MenuItem): number => {
  let score = 0;
  
  // Exact code match is highest priority (now checks array of codes)
  if (existingItem.product_code && existingItem.product_code.length > 0 && invoiceCode) {
    if (existingItem.product_code.includes(invoiceCode)) {
      return 100; // Exact match in codes array
    }
    // Check if any existing code partially matches
    const hasPartialMatch = existingItem.product_code.some(code => 
      code.includes(invoiceCode) || invoiceCode.includes(code)
    );
    if (hasPartialMatch) {
      score += 50;
    }
  }
  
  const invoiceTerms = extractKeyTerms(invoiceDesc);
  const itemTerms = extractKeyTerms(existingItem.name);
  
  // Check for brand matches
  const brandMatches = invoiceTerms.filter(term => itemTerms.includes(term));
  score += brandMatches.length * 15;
  
  // Check for size/volume matches (269ml, 600ml, etc)
  const sizePattern = /(\d+)\s*ml/i;
  const invoiceSizeMatch = invoiceDesc.match(sizePattern);
  const itemSizeMatch = existingItem.name.match(sizePattern);
  
  if (invoiceSizeMatch && itemSizeMatch && invoiceSizeMatch[1] === itemSizeMatch[1]) {
    score += 30;
  }
  
  // For individual items (latas, garrafas), prefer items without "balde" or "pack"
  const invoiceIsPack = detectPackInfo(invoiceDesc).isPack;
  const itemIsBalde = /balde|pack|caixa|fardo|\d+\s*unid/i.test(existingItem.name);
  
  // If invoice is a pack of individual items, prefer individual stock items
  if (invoiceIsPack && !itemIsBalde) {
    score += 20;
  }
  
  return Math.max(0, score);
};

// Find best matching item
const findBestMatch = (invoiceDesc: string, invoiceCode: string, existingItems: MenuItem[]): MenuItem | undefined => {
  let bestMatch: MenuItem | undefined;
  let bestScore = 0;
  
  for (const item of existingItems) {
    const score = calculateMatchScore(invoiceDesc, invoiceCode, item);
    if (score > bestScore && score >= 15) {
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

      // Process items - AI should return QTD.TRIB directly now
      const itemsWithMatches: ParsedItem[] = data.items.map((item: any) => {
        const packInfo = detectPackInfo(item.descricao);
        // AI now returns total units directly from QTD.TRIB, so no need to multiply
        const totalUnits = item.quantidade;
        const bestMatch = findBestMatch(item.descricao, item.codigo, existingItems);
        
        // Extract a clean name for new items (remove pack info like "CX C/8")
        const cleanName = item.descricao
          .replace(/\s*CX?\s*[Cc]?\/?(\d+)/g, '')
          .replace(/\s*FRIDGE\s*PACK/gi, '')
          .trim();
        
        return {
          ...item,
          selected: true,
          linkedItemId: bestMatch?.id || undefined,
          createNew: !bestMatch,
          unitsPerPack: packInfo.unitsPerPack,
          totalUnits: totalUnits,
          editedTotalUnits: String(totalUnits),
          isPack: packInfo.isPack,
          newItemName: cleanName,
          newItemCategory: 'estoque' // Default category for new ingredient items
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
    const linkedItems = parsedItems.filter(item => item.selected && item.linkedItemId);
    const newItems = parsedItems.filter(item => item.selected && item.createNew && item.newItemName);
    
    if (linkedItems.length === 0 && newItems.length === 0) {
      toast.error('Selecione ao menos um item para importar');
      return;
    }

    setIsLoading(true);
    let imported = 0;
    let created = 0;

    try {
      // Update existing items
      for (const item of linkedItems) {
        const existingItem = existingItems.find(e => e.id === item.linkedItemId);
        if (!existingItem) continue;

        const quantityToAdd = parseInt(item.editedTotalUnits) || 0;
        if (quantityToAdd <= 0) continue;
        
        const unitCost = item.valorUnitario / (item.isPack ? item.unitsPerPack : 1);

        const existingCodes = existingItem.product_code || [];
        const updatedCodes = existingCodes.includes(item.codigo) 
          ? existingCodes 
          : [...existingCodes, item.codigo];

        if (existingItem.is_bottle) {
          await supabase
            .from('menu_items')
            .update({
              bottles_in_stock: (existingItem.bottles_in_stock || 0) + quantityToAdd,
              cost_price: unitCost,
              product_code: updatedCodes
            })
            .eq('id', item.linkedItemId);
        } else {
          await supabase
            .from('menu_items')
            .update({
              stock_quantity: (existingItem.stock_quantity || 0) + quantityToAdd,
              cost_price: unitCost,
              product_code: updatedCodes
            })
            .eq('id', item.linkedItemId);
        }
        imported++;
      }

      // Create new items
      for (const item of newItems) {
        const quantityToAdd = parseInt(item.editedTotalUnits) || 0;
        if (quantityToAdd <= 0 || !item.newItemName) continue;
        
        const unitCost = item.valorUnitario / (item.isPack ? item.unitsPerPack : 1);

        await supabase
          .from('menu_items')
          .insert({
            name: item.newItemName,
            category: item.newItemCategory || 'estoque',
            price: 0, // Owner needs to set price in Cardápio
            stock_quantity: quantityToAdd,
            cost_price: unitCost,
            product_code: [item.codigo],
            is_available: true,
            is_sellable: false, // Ingredients are not sellable by default
            goes_to_kitchen: false
          });
        created++;
      }

      const messages = [];
      if (imported > 0) messages.push(`${imported} atualizados`);
      if (created > 0) messages.push(`${created} criados`);
      toast.success(`Itens: ${messages.join(', ')}`);
      
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

  const updateTotalUnits = (index: number, value: string) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, editedTotalUnits: value } : item
    ));
  };

  const updateNewItemName = (index: number, name: string) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, newItemName: name } : item
    ));
  };

  const updateNewItemCategory = (index: number, category: string) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, newItemCategory: category } : item
    ));
  };

  const toggleCreateNew = (index: number) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, createNew: !item.createNew, linkedItemId: undefined } : item
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
              Envie uma foto da nota fiscal. O sistema detecta automaticamente packs (ex: 12X269ML = 12 unidades)
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
                        
                        {/* Pack detection info */}
                        {item.isPack && (
                          <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 p-2 rounded">
                            <Package className="h-4 w-4" />
                            <span>
                              Pack detectado: {item.quantidade} caixas × {item.unitsPerPack} unidades = <strong>{item.totalUnits} unidades</strong>
                            </span>
                          </div>
                        )}
                        
                        {/* Quantity and price */}
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">Total unidades:</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={item.editedTotalUnits}
                              onChange={(e) => updateTotalUnits(index, e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-24 h-8"
                              placeholder="0"
                            />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            Custo: R$ {(item.valorUnitario / (item.isPack ? item.unitsPerPack : 1)).toFixed(2).replace('.', ',')}/un
                          </span>
                        </div>
                        
                        {/* Create new item checkbox */}
                        <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                          <Checkbox
                            id={`create-new-${index}`}
                            checked={item.createNew}
                            onCheckedChange={() => toggleCreateNew(index)}
                          />
                          <Label htmlFor={`create-new-${index}`} className="text-xs cursor-pointer">
                            Criar novo produto
                          </Label>
                        </div>

                        {/* New item fields */}
                        {item.createNew && (
                          <div className="space-y-2 p-3 border rounded bg-green-50 dark:bg-green-950/30">
                            <div>
                              <Label className="text-xs">Nome do produto:</Label>
                              <Input
                                value={item.newItemName || ''}
                                onChange={(e) => updateNewItemName(index, e.target.value)}
                                className="mt-1 h-8"
                                placeholder="Nome do produto"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Categoria:</Label>
                              <Select
                                value={item.newItemCategory || 'outros'}
                                onValueChange={(val) => updateNewItemCategory(index, val)}
                              >
                                <SelectTrigger className="mt-1 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Preço será definido como R$ 0,00 - edite depois
                            </p>
                          </div>
                        )}

                        {/* Existing item link */}
                        {!item.createNew && (
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
                                        {existing.product_code && existing.product_code.length > 0 && (
                                          <span className="text-xs text-muted-foreground font-mono">
                                            [{existing.product_code[0]}{existing.product_code.length > 1 ? `+${existing.product_code.length - 1}` : ''}]
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
                        )}

                        {/* Status messages */}
                        {item.linkedItemId && !item.createNew && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="h-3 w-3" />
                            <span>
                              +{item.editedTotalUnits || 0} unidades serão adicionadas ao estoque
                            </span>
                          </div>
                        )}
                        {item.createNew && item.newItemName && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Package className="h-3 w-3" />
                            <span>
                              Novo produto será criado com {item.editedTotalUnits || 0} unidades
                            </span>
                          </div>
                        )}
                        {!item.linkedItemId && !item.createNew && item.selected && (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Selecione um item ou marque "Criar novo"</span>
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
                disabled={isLoading || parsedItems.filter(i => i.selected && (i.linkedItemId || (i.createNew && i.newItemName))).length === 0}
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
