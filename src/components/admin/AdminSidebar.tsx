import React from 'react';
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
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { to: '/admin/mesas', icon: Table2, label: 'Mesas' },
  { to: '/admin/estoque', icon: UtensilsCrossed, label: 'Estoque' },
  { to: '/admin/atendimento', icon: ClipboardList, label: 'Atendimento' },
  { to: '/admin/cozinha', icon: ChefHat, label: 'Cozinha' },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={cn(
          "bg-card border-r border-border min-h-screen flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className={cn("p-4 border-b border-border flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <Menu className="h-6 w-6" />
                Admin Panel
              </h1>
              {user && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {user.email}
                </p>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 shrink-0"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-row items-center gap-3 px-3 py-3 rounded-lg transition-colors whitespace-nowrap',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full text-muted-foreground hover:text-destructive",
                  collapsed ? "justify-center px-0" : "justify-start"
                )}
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="ml-3">Sair</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                Sair
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
