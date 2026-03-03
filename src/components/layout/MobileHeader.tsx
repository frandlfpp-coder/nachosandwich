'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, Boxes, CircleDollarSign, Settings, LogOut } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '../ui/button';
import { Zap } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Ventas', icon: ShoppingCart },
  { href: '/kitchen', label: 'Cocina', icon: ChefHat },
  { href: '/stock',label: 'Stock', icon: Boxes },
  { href: '/finance',label: 'Caja', icon: CircleDollarSign },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function MobileHeader() {
  const { cartCount, logout, user } = useApp();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="md:hidden bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 sticky top-0 z-40">
        <Link href="/dashboard" className="text-xl tracking-tighter text-primary font-black flex items-center gap-2">
          <Zap /> NACHO+
        </Link>
        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="relative p-3 rounded-2xl h-auto">
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>TU PEDIDO</SheetTitle>
            </SheetHeader>
            {/* Cart content will be rendered on the dashboard page via a portal or separate logic */}
            <div className="py-20 text-center opacity-40 text-xs font-black">
              VE A LA PESTAÑA 'VENTAS' PARA GESTIONAR TU CARRITO.
            </div>
          </SheetContent>
        </Sheet>
      </header>
       <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-40">
        {navItems.map(item => (
           <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center text-center p-2 rounded-lg w-1/5 ${pathname === item.href ? 'text-primary' : 'text-gray-500'}`}>
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-[10px] non-italic font-semibold normal-case tracking-normal">{item.label}</span>
           </Link>
        ))}
         <button onClick={() => { if (confirm('¿Cerrar sesión?')) logout(); }} className="flex flex-col items-center justify-center text-center p-2 rounded-lg w-1/5 text-gray-500">
          <LogOut className="h-6 w-6 mb-1" />
          <span className="text-[10px] non-italic font-semibold normal-case tracking-normal">Salir</span>
        </button>
      </nav>
    </>
  );
}
