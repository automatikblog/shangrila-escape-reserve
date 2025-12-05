import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAdminTables } from '@/hooks/useAdminTables';
import { QRCodeGenerator } from '@/components/admin/QRCodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, QrCode, Loader2 } from 'lucide-react';

const AdminTables: React.FC = () => {
  const { tables, isLoading, createTable, updateTable, deleteTable } = useAdminTables();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTable = async () => {
    if (!newTableNumber || !newTableName) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    const { error } = await createTable(parseInt(newTableNumber), newTableName);
    setIsCreating(false);

    if (error) {
      toast({
        title: 'Erro ao criar mesa',
        description: error,
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Mesa criada com sucesso!' });
      setNewTableNumber('');
      setNewTableName('');
      setIsDialogOpen(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await updateTable(id, { is_active: !currentStatus });
    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mesa?')) return;
    
    const { error } = await deleteTable(id);
    if (error) {
      toast({
        title: 'Erro ao excluir',
        description: error,
        variant: 'destructive'
      });
    } else {
      toast({ title: 'Mesa excluída' });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mesas</h1>
          <p className="text-muted-foreground">Gerencie as mesas e QR Codes</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Mesa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="table-number">Número da Mesa</Label>
                <Input
                  id="table-number"
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-name">Nome/Descrição</Label>
                <Input
                  id="table-name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Área Externa"
                />
              </div>
              <Button onClick={handleCreateTable} className="w-full" disabled={isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Mesa'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma mesa cadastrada ainda.<br />
              Clique em "Nova Mesa" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <Card key={table.id} className={!table.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Mesa {table.number}</CardTitle>
                    <p className="text-muted-foreground">{table.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={table.is_active}
                      onCheckedChange={() => handleToggleActive(table.id, table.is_active)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(table.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator
                  tableId={table.id}
                  tableName={table.name}
                  tableNumber={table.number}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTables;
