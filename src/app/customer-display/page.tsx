'use client';

import { useApp } from '@/contexts/AppContext';
import { Order } from '@/lib/types';
import { useMemo } from 'react';

export default function CustomerDisplayPage() {
  const { orders: pendingOrders, completedOrders } = useApp();

  const completedForDisplay = useMemo(() => {
    return completedOrders.slice(0, 12);
  }, [completedOrders]);

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col font-body font-black uppercase antialiased">
      <header className="text-center py-6">
        <h1 className="text-6xl text-primary font-black tracking-tighter">NACHO+</h1>
      </header>
      <main className="flex-1 grid grid-cols-2 gap-px bg-zinc-800 overflow-hidden">
        <div className="bg-zinc-900 p-8 flex flex-col overflow-hidden">
          <h2 className="text-5xl text-center mb-8 text-white tracking-widest">EN PREPARACIÓN</h2>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-slate-50 text-zinc-900 rounded-3xl flex flex-col items-center justify-center p-4 animate-pop aspect-square">
                <span className="text-8xl font-black tracking-tighter">
                  {order.orderNumber}
                </span>
                <span className="text-2xl opacity-60">
                  {order.customerName}
                </span>
              </div>
            ))}
             {pendingOrders.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-full">
                    <p className="text-2xl text-white opacity-30">NINGÚN PEDIDO</p>
                </div>
            )}
          </div>
        </div>
        <div className="bg-zinc-900 p-8 flex flex-col overflow-hidden">
          <h2 className="text-5xl text-center mb-8 text-primary tracking-widest">LISTO PARA RETIRAR</h2>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto no-scrollbar">
             {completedForDisplay.map((order, index) => (
              <div key={order.id} className={`rounded-3xl flex flex-col items-center justify-center p-4 shadow-2xl aspect-square ${index === 0 ? 'bg-primary text-primary-foreground animate-pulse shadow-lime-500/30' : 'bg-zinc-800 text-white'}`}>
                <span className="text-8xl font-black tracking-tighter">
                  {order.orderNumber}
                </span>
                 <span className="text-2xl opacity-60">
                  {order.customerName}
                </span>
              </div>
            ))}
             {completedForDisplay.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-full">
                    <p className="text-2xl text-white opacity-30">NINGÚN PEDIDO LISTO</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
