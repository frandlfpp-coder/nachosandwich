'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Ventas' },
  { href: '/kitchen', label: 'Cocina' },
  { href: '/stock', label: 'Stock' },
  { href: '/finance', label: 'Caja' },
  { href: '/admin', label: 'Admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useApp();

  return (
    <aside className="hidden md:flex flex-col w-72 bg-zinc-950 text-white p-8 shrink-0">
      <div className="mb-12 flex items-center gap-4">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xl tracking-tighter text-primary">NACHO+</span>
          <span className="text-[8px] opacity-40 truncate" style={{ fontStyle: 'normal' }}>
            {user?.local}
          </span>
        </div>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map(item => (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className={cn(
              'w-full justify-start p-4 rounded-2xl text-base transition-all flex items-center gap-4',
              pathname === item.href
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-zinc-900'
            )}
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </nav>
      <Button
        onClick={() => {
          if (confirm('¿Cerrar sesión?')) logout();
        }}
        variant="ghost"
        className="mt-auto p-4 text-zinc-500 text-xs hover:text-red-400 font-black h-auto"
      >
        Cerrar Sesión
      </Button>
    </aside>
  );
}
