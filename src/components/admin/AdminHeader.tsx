import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Table2, 
  ChefHat, 
  LogOut,
  Menu,
  CalendarDays,
  UtensilsCrossed,
  ClipboardList,
  ShoppingBag,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { to: '/admin/mesas', icon: Table2, label: 'Mesas' },
  { to: '/admin/estoque', icon: UtensilsCrossed, label: 'Estoque' },
  { to: '/admin/cardapio', icon: ShoppingBag, label: 'Cardápio' },
  { to: '/admin/atendimento', icon: ClipboardList, label: 'Atendimento' },
  { to: '/admin/gastos', icon: Wallet, label: 'Gastos' },
  { to: '/admin/cozinha', icon: ChefHat, label: 'Cozinha' },
];

export const AdminHeader: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">Admin</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop Logout + User */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5 text-primary" />
                Admin Panel
              </SheetTitle>
              {user && (
                <p className="text-xs text-muted-foreground text-left">
                  {user.email}
                </p>
              )}
            </SheetHeader>
            
            <nav className="mt-6">
              <ul className="space-y-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-6 left-4 right-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
