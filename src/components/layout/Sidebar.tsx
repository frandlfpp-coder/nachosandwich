'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
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

const navItems = [
  { href: '/dashboard', label: 'Ventas' },
  { href: '/comandas', label: 'Comandas' },
  { href: '/delivery', label: 'Delivery' },
  { href: '/stock', label: 'Stock' },
  { href: '/finance', label: 'Caja' },
  { href: '/admin', label: 'Admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchLocal } = useApp();

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
    <aside className="hidden md:flex flex-col w-72 bg-background text-foreground p-6 shrink-0 border-r dark">
      <div className="mb-12 flex items-center gap-4">
        <div className="bg-primary p-2 rounded-lg text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xl tracking-tighter text-primary font-black uppercase">NACHO+</span>
          {currentLocal && (
            <span className="text-[8px] opacity-40 uppercase">
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
              'w-full justify-start p-4 rounded-lg text-base transition-all flex items-center gap-4 font-black uppercase text-left h-auto',
              pathname === item.href
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
              !user && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
      <div className="space-y-2">
         <Select onValueChange={handleLocalChange} value={currentLocal}>
            <SelectTrigger className="w-full bg-secondary border-border focus:ring-primary font-black uppercase">
                <SelectValue placeholder="SELECCIONAR LOCAL" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="nacho1" className="font-black uppercase">NACHO1</SelectItem>
                <SelectItem value="nacho2" className="font-black uppercase">NACHO2</SelectItem>
                <SelectItem value="prueba" className="font-black uppercase">PRUEBA</SelectItem>
            </SelectContent>
         </Select>
         <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (confirm('¿Cerrar sesión del local actual?')) logout();
              }}
              variant="outline"
              disabled={!user}
              className="w-full p-4 text-muted-foreground text-xs hover:text-destructive font-black h-auto disabled:opacity-50 disabled:hover:text-muted-foreground flex-1 uppercase"
            >
              Cerrar Sesión
            </Button>
        </div>
      </div>
    </aside>
  );
}
