'use client';

import { useApp } from '@/contexts/AppContext';

export default function KitchenDisplayPage() {
  const { orders } = useApp(); // These are pending orders

  return (
    <div className="bg-zinc-900 min-h-screen text-white p-8">
      <h1 className="text-6xl font-black text-center mb-12 text-lime-400 tracking-tighter">
        PEDIDOS PENDIENTES
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {orders.map(order => (
          <div key={order.id} className="bg-white text-zinc-900 rounded-3xl p-8 flex flex-col animate-pop shadow-2xl">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-4">
              <span className="text-5xl font-black">#{order.orderNumber}</span>
              <span className="text-lg font-bold">{order.customerName}</span>
            </div>
            <ul className="space-y-2 flex-1">
              {order.items.map(item => (
                <li key={item.id} className="flex justify-between text-xl font-bold">
                  <span>{item.qty}x</span>
                  <span className="flex-1 text-left ml-4">{item.name}</span>
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
