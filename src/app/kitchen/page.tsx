'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Bike } from 'lucide-react';

export default function KitchenPage() {
  const { orders, completeOrder } = useApp();

  return (
    <AppShell>
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl tracking-tighter font-black">Comandas</h2>
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-black">
            {orders.length} Pendientes
          </div>
        </div>
        <div id="kitchen-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(o => (
            <div key={o.id} className="bg-card text-card-foreground rounded-3xl p-8 border shadow-xl animate-pop">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black">{o.customerName}</h3>
                   {o.isDelivery && (
                    <div className="flex items-center gap-2 mt-1 text-sm font-bold text-destructive">
                        <Bike className="w-4 h-4" />
                        <span>Delivery</span>
                    </div>
                  )}
                </div>
                <span className="bg-primary text-primary-foreground text-3xl px-6 py-2 rounded-2xl font-black">
                  #{o.orderNumber}
                </span>
              </div>
              {o.isDelivery && o.customerPhone && (
                <div className="text-xs mb-4 font-semibold text-muted-foreground">
                    Teléfono: {o.customerPhone}
                </div>
              )}
              <ul className="text-sm space-y-3 mb-8 border-l-4 border-primary pl-4 font-black">
                {o.items.map(i => (
                  <li key={i.id}>
                    <span>{i.qty}x {i.product.name}</span>
                    {i.toppings.length > 0 && (
                        <ul className="pl-4 text-[10px] opacity-70 font-semibold normal-case">
                            {i.toppings.map(t => <li key={t.id}>+ {t.name}</li>)}
                        </ul>
                    )}
                    {i.notes && (
                        <p className="pl-4 text-[10px] text-destructive font-semibold normal-case italic">Nota: {i.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
              <Button onClick={() => completeOrder(o.id)} className="w-full bg-zinc-950 text-white dark:text-zinc-950 dark:bg-white py-4 rounded-2xl text-[10px] font-black h-auto hover:bg-zinc-800 dark:hover:bg-zinc-200">
                Marcar como Listo
              </Button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
