'use client';

import { useApp } from '@/contexts/AppContext';
import { Order } from '@/lib/types';
import { useMemo } from 'react';

export default function CustomerDisplayPage() {
  const { orders: allPending, completedOrders: allCompleted } = useApp();

  const pendingOrders = useMemo(() => {
    return allPending.filter(o => !o.isDelivery);
  }, [allPending]);

  const completedForDisplay = useMemo(() => {
    // Show more completed orders
    return allCompleted.filter(o => !o.isDelivery).slice(0, 25);
  }, [allCompleted]);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col font-body font-black uppercase antialiased">
      <header className="text-center py-4 md:py-6 shrink-0">
        <h1 className="text-5xl md:text-6xl text-primary font-black tracking-tighter">NACHO+</h1>
      </header>
      <main className="flex-1 grid grid-cols-2 gap-px bg-zinc-800 overflow-hidden">
        <div className="bg-zinc-900 p-4 md:p-8 flex flex-col overflow-hidden">
          <h2 className="text-3xl md:text-5xl text-center mb-6 md:mb-8 text-white tracking-widest">EN PREPARACIÓN</h2>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 overflow-y-auto no-scrollbar">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-slate-50 text-zinc-900 rounded-3xl flex flex-col items-center justify-center p-4 animate-pop aspect-square">
                <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none">
                  {order.orderNumber}
                </span>
                <span className="text-xl md:text-2xl opacity-60 mt-2 text-center">
                  {order.customerName}
                </span>
              </div>
            ))}
             {pendingOrders.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-full">
                    <p className="text-xl md:text-2xl text-white opacity-30">NINGÚN PEDIDO</p>
                </div>
            )}
          </div>
        </div>
        <div className="bg-zinc-900 p-4 md:p-8 flex flex-col overflow-hidden">
          <h2 className="text-3xl md:text-5xl text-center mb-6 md:mb-8 text-primary tracking-widest">LISTO PARA RETIRAR</h2>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 overflow-y-auto no-scrollbar">
             {completedForDisplay.map((order) => (
              <div key={order.id} className="bg-primary text-primary-foreground rounded-3xl flex flex-col items-center justify-center p-4 shadow-2xl aspect-square animate-ready-pulse">
                <span className="text-7xl md:text-8xl font-black tracking-tighter leading-none [text-shadow:2px_2px_4px_rgba(0,0,0,0.2)]">
                  {order.orderNumber}
                </span>
                 <span className="text-xl md:text-2xl opacity-60 mt-2 text-center">
                  {order.customerName}
                </span>
              </div>
            ))}
             {completedForDisplay.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-full">
                    <p className="text-xl md:text-2xl text-white opacity-30">NINGÚN PEDIDO LISTO</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
