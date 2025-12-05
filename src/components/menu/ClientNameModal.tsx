import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';

interface ClientNameModalProps {
  open: boolean;
  onSubmit: (name: string) => Promise<boolean>;
  tableName?: string;
}

export const ClientNameModal: React.FC<ClientNameModalProps> = ({
  open,
  onSubmit,
  tableName
}) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Por favor, insira seu nome');
      return;
    }

    if (name.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    const success = await onSubmit(name.trim());
    
    if (!success) {
      setError('Erro ao registrar. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Bem-vindo ao Shangri-La!
          </DialogTitle>
          <DialogDescription>
            {tableName && <span className="block font-medium text-foreground mb-1">{tableName}</span>}
            Por favor, informe seu nome para identificar seu pedido.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Seu nome</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: João"
              autoFocus
              disabled={isSubmitting}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Continuar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
