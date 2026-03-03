'use client';

import { useApp } from "@/contexts/AppContext";
import { X } from "lucide-react";

interface KitchenMonitorProps {
  onClose: () => void;
}

export default function KitchenMonitor({ onClose }: KitchenMonitorProps) {
  const { orders } = useApp();

  return (
    <div id="monitor-overlay" className="fixed inset-0 z-50 bg-black p-10 overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center mb-12 border-b-8 border-primary pb-8">
        <h2 className="text-5xl md:text-8xl text-primary tracking-tighter font-black">ORDENES EN CURSO</h2>
        <button onClick={onClose} className="bg-red-600 text-white p-4 md:p-6 rounded-full shadow-2xl">
          <X className="h-8 w-8 md:h-12 md:w-12" strokeWidth={4} />
        </button>
      </div>
      <div id="monitor-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {orders.map(o => (
          <div key={o.id} className="bg-[#111] border-4 md:border-8 border-primary rounded-[3rem] p-6 md:p-10 text-white shadow-[0_0_50px_rgba(132,204,22,0.15)] animate-pop">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-4xl md:text-7xl font-black">{o.name}</h3>
              <span className="text-6xl md:text-9xl text-primary font-black">#{o.caller}</span>
            </div>
            <div className="text-3xl md:text-5xl space-y-4 font-black">
              {o.items.map(i => <div key={i.id}>{i.qty}x {i.name}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
