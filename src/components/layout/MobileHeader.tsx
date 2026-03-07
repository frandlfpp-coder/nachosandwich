'use client';

import Link from 'next/link';
import { ShoppingCart, ChefHat, Boxes, CircleDollarSign, Settings, LogOut, GitBranch, Zap } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '../ui/button';
import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Ventas', icon: ShoppingCart },
  { href: '/kitchen', label: 'Cocina', icon: ChefHat },
  { href: '/stock',label: 'Stock', icon: Boxes },
  { href: '/finance',label: 'Caja', icon: CircleDollarSign },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function MobileHeader() {
  const { cartCount, logout, user, switchLocal } = useApp();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isSwitchLocalOpen, setSwitchLocalOpen] = useState(false);
  const pathname = usePathname();

  const currentLocal = useMemo(() => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '';
  }, [user]);

  const handleLocalChange = (value: string) => {
    if (value === 'nacho1' || value === 'nacho2') {
      switchLocal(value);
      setSwitchLocalOpen(false);
    }
  };

  return (
    <>
      <header className="md:hidden bg-white border-b px-6 py-4 flex justify-between items-center shrink-0 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg tracking-tighter text-primary font-black leading-none">NACHO+</span>
            {currentLocal && (
            <span className="text-[9px] text-muted-foreground font-bold leading-none normal-case" style={{ fontStyle: 'normal' }}>
                {currentLocal}
            </span>
            )}
          </div>
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
       <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-1 flex justify-around z-40">
        {navItems.map(item => (
           <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center text-center p-2 rounded-lg w-1/6 ${pathname === item.href ? 'text-primary' : 'text-gray-500'}`}>
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-[9px] non-italic font-semibold normal-case tracking-normal">{item.label}</span>
           </Link>
        ))}
         <button onClick={() => setSwitchLocalOpen(true)} className="flex flex-col items-center justify-center text-center p-2 rounded-lg w-1/6 text-gray-500">
          <GitBranch className="h-5 w-5 mb-1" />
          <span className="text-[9px] non-italic font-semibold normal-case tracking-normal">Cambiar</span>
        </button>
         <button onClick={() => { if (confirm('¿Cerrar sesión?')) logout(); }} className="flex flex-col items-center justify-center text-center p-2 rounded-lg w-1/6 text-gray-500">
          <LogOut className="h-5 w-5 mb-1" />
          <span className="text-[9px] non-italic font-semibold normal-case tracking-normal">Salir</span>
        </button>
      </nav>

      <Dialog open={isSwitchLocalOpen} onOpenChange={setSwitchLocalOpen}>
        <DialogContent className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">CAMBIAR DE LOCAL</DialogTitle></DialogHeader>
          <Select onValueChange={handleLocalChange} value={currentLocal}>
              <SelectTrigger className="w-full p-5 bg-slate-100 border-2 border-slate-200 rounded-2xl outline-none text-center text-sm focus:border-primary transition-all font-black h-auto">
                  <SelectValue placeholder="SELECCIONAR LOCAL" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="nacho1">NACHO1</SelectItem>
                  <SelectItem value="nacho2">NACHO2</SelectItem>
              </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </>
  );
}
