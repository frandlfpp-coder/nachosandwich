'use client';

import { useApp } from '@/contexts/AppContext';
import { Bike } from 'lucide-react';

export default function KitchenDisplayPage() {
  const { orders } = useApp(); // These are pending orders

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-8">
      <h1 className="text-6xl font-black text-center mb-12 text-primary tracking-tighter">
        PEDIDOS PENDIENTES
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {orders.map(order => (
          <div key={order.id} className="bg-card text-card-foreground rounded-3xl p-8 flex flex-col animate-pop shadow-2xl">
            <div className="flex justify-between items-center border-b-2 pb-4 mb-4">
              <span className="text-5xl font-black">#{order.orderNumber}</span>
              <div className="text-right">
                <span className="text-lg font-bold block">{order.customerName}</span>
                 {order.isDelivery && (
                    <div className="flex items-center justify-end gap-2 mt-1 text-sm font-bold text-blue-600 normal-case">
                        <Bike className="w-4 h-4" />
                        <span>Delivery</span>
                    </div>
                )}
              </div>
            </div>
            <ul className="space-y-3 flex-1 text-lg">
              {order.items.map(item => (
                <li key={item.id} className="font-bold">
                  <span>{item.qty}x {item.product.name}</span>
                  {item.toppings.length > 0 && (
                      <ul className="pl-5 text-sm opacity-80 font-semibold">
                          {item.toppings.map(t => <li key={t.id}>+ {t.name}</li>)}
                      </ul>
                  )}
                  {item.notes && (
                      <p className="pl-5 text-sm text-blue-400 font-semibold italic">Nota: {item.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
         {orders.length === 0 && (
          <div className="col-span-full text-center py-20">
            <p className="text-4xl font-bold opacity-30">No hay pedidos pendientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
