'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Sun, Moon } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { href: '/dashboard', label: 'Ventas' },
  { href: '/kitchen', label: 'Cocina' },
  { href: '/delivery', label: 'Delivery' },
  { href: '/stock', label: 'Stock' },
  { href: '/finance', label: 'Caja' },
  { href: '/admin', label: 'Admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchLocal } = useApp();
  const { theme, toggleTheme } = useTheme();

  const currentLocal = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  }, [user]);

  const handleLocalChange = (value: string) => {
    if (value === 'nacho1' || value === 'nacho2' || value === 'prueba') {
      switchLocal(value as 'nacho1' | 'nacho2' | 'prueba');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-72 bg-zinc-950 text-white p-8 shrink-0">
      <div className="mb-12 flex items-center gap-4">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xl tracking-tighter text-primary">NACHO+</span>
          {currentLocal && (
            <span className="text-[8px] opacity-40 uppercase" style={{ fontStyle: 'normal' }}>
              {currentLocal}
            </span>
          )}
        </div>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map(item => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            disabled={!user}
            className={cn(
              'w-full justify-start p-4 rounded-2xl text-base transition-all flex items-center gap-4',
              pathname === item.href
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-zinc-900',
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
      <div className="space-y-2">
         <Select onValueChange={handleLocalChange} value={currentLocal}>
            <SelectTrigger className="w-full bg-zinc-900 border-zinc-800 focus:ring-primary">
                <SelectValue placeholder="SELECCIONAR LOCAL" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="nacho1">NACHO1</SelectItem>
                <SelectItem value="nacho2">NACHO2</SelectItem>
                <SelectItem value="prueba">PRUEBA</SelectItem>
            </SelectContent>
         </Select>
         <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              className="w-full justify-center p-4 text-zinc-500 text-xs hover:text-white font-black h-auto flex-1"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span className="sr-only">Cambiar tema</span>
            </Button>
            <Button
              onClick={() => {
                if (confirm('¿Cerrar sesión del local actual?')) logout();
              }}
              variant="ghost"
              disabled={!user}
              className="w-full p-4 text-zinc-500 text-xs hover:text-red-400 font-black h-auto disabled:opacity-50 disabled:hover:text-zinc-500 flex-1"
            >
              Cerrar Sesión
            </Button>
        </div>
      </div>
    </aside>
  );
}
