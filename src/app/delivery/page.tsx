'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/types';
import { useMemo } from 'react';
import { Bike, Phone } from 'lucide-react';

export default function DeliveryPage() {
  const { orders, completeOrder } = useApp();

  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.isDelivery && o.status === 'pending');
  }, [orders]);

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + item.price * item.qty, 0);
  }

  return (
    <AppShell>
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl tracking-tighter font-black">DELIVERIES</h2>
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black">
            {deliveryOrders.length} PENDIENTES
          </div>
        </div>
        
        {deliveryOrders.length === 0 ? (
           <div className="text-center py-20 opacity-40">
             <Bike className="w-16 h-16 mx-auto mb-4" />
             <h3 className="text-lg font-black">SIN DELIVERIES PENDIENTES</h3>
           </div>
        ) : (
          <div id="delivery-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {deliveryOrders.map(o => (
              <div key={o.id} className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-xl animate-pop">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black">{o.customerName}</h3>
                    {o.customerPhone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold normal-case">
                        <Phone className="w-3 h-3" />
                        <span>{o.customerPhone}</span>
                      </div>
                    )}
                  </div>
                  <span className="bg-primary text-primary-foreground text-3xl px-6 py-2 rounded-2xl font-black">
                    #{o.orderNumber}
                  </span>
                </div>

                <div className="mb-6">
                    <p className="text-[10px] opacity-40 mb-1 font-black">ITEMS</p>
                    <ul className="text-xs space-y-1 font-black border-l-4 border-slate-100 pl-3">
                        {o.items.map(i => <li key={i.id}>{i.qty}x {i.name}</li>)}
                    </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[10px] opacity-40 font-black">COBRAR AL CLIENTE</p>
                        <p className="text-lg font-black text-lime-600">${calculateOrderTotal(o).toLocaleString('es-AR')}</p>
                    </div>
                     <div className="bg-slate-50 p-4 rounded-2xl">
                        <p className="text-[10px] opacity-40 font-black">PAGAR AL DELIVERY</p>
                        <p className="text-lg font-black text-red-500">${o.deliveryFee?.toLocaleString('es-AR') || 0}</p>
                    </div>
                </div>

                <Button onClick={() => completeOrder(o.id)} className="w-full bg-zinc-950 text-white py-4 rounded-2xl text-[10px] font-black h-auto hover:bg-zinc-800">
                  MARCAR COMO ENTREGADO
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
