'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StockPage() {
  const { stockItems, updateStock } = useApp();

  return (
    <AppShell>
      <section>
        <div className="bg-card text-card-foreground rounded-[3rem] p-8 shadow-sm border">
          <h2 className="text-3xl tracking-tighter mb-8 font-black">NIVELES DE STOCK</h2>
          <div id="stock-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockItems.map(i => (
              <div key={i.id} className="flex items-center justify-between p-6 bg-slate-100 dark:bg-zinc-800 rounded-3xl border">
                <div>
                  <h4 className="text-xs font-black">{i.name}</h4>
                  <span className="text-[8px] opacity-40 font-black">{i.unit}</span>
                </div>
                <div className="flex items-center bg-background rounded-2xl border px-2 gap-4">
                  <Button onClick={() => updateStock(i.id, -1)} variant="ghost" className="text-destructive px-2 font-black text-xl h-auto hover:bg-transparent">-</Button>
                  <span className={cn("text-lg font-black w-8 text-center", i.stock < 5 ? 'text-destructive animate-pulse' : 'text-primary')}>
                    {i.stock}
                  </span>
                  <Button onClick={() => updateStock(i.id, 1)} variant="ghost" className="text-primary px-2 font-black text-xl h-auto hover:bg-transparent">+</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
