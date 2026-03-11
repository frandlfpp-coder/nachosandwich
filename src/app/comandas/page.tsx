'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Order } from '@/lib/types';
import { Bike } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ComandasPage() {
  const { orders: pending, completedOrders, completeOrder, cancelOrder } = useApp();
  const { isClient } = useTheme();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  return (
    <AppShell>
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl tracking-tighter font-black">Comandas</h2>
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-black">
            {pending.length} Pendientes
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Pendientes</h3>
            <div id="kitchen-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pending.length > 0 ? pending.map(o => (
                <div key={o.id} className="bg-card text-card-foreground rounded-2xl p-6 border shadow-xl animate-pop flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black">{o.customerName}</h3>
                      <p className="text-xs text-muted-foreground font-semibold">{isClient ? o.createdAt?.toLocaleTimeString('es-AR') : '...'}</p>
                      {o.isDelivery && (
                        <div className="flex items-center gap-2 mt-1 text-sm font-bold text-destructive">
                            <Bike className="w-4 h-4" />
                            <span>Delivery</span>
                        </div>
                      )}
                    </div>
                    <span className="bg-primary text-primary-foreground text-3xl px-6 py-2 rounded-xl font-black">
                      #{o.orderNumber}
                    </span>
                  </div>
                  {o.isDelivery && o.customerPhone && (
                    <div className="text-xs mb-4 font-semibold text-muted-foreground">
                        Teléfono: {o.customerPhone}
                    </div>
                  )}
                  <ul className="text-sm space-y-3 mb-8 border-l-4 border-primary pl-4 font-black flex-1">
                    {(o.items || []).map(i => (
                      i.product ? (
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
                      ) : null
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button variant="outline" onClick={() => setCancelTarget(o)} className="w-full py-4 rounded-xl text-[10px] font-black h-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                        Cancelar
                    </Button>
                    <Button onClick={() => completeOrder(o.id)} className="w-full bg-zinc-950 text-white dark:text-zinc-950 dark:bg-white py-4 rounded-xl text-[10px] font-black h-auto hover:bg-zinc-800 dark:hover:bg-zinc-200">
                        Marcar como Listo
                    </Button>
                  </div>
                </div>
              )) : <p className="text-center text-xs opacity-50 font-black py-20 uppercase col-span-full">No hay comandas pendientes</p>}
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">Listas para Retirar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {completedOrders.length > 0 ? completedOrders.map(o => (
                 <div key={o.id} className="bg-card text-card-foreground rounded-2xl p-6 border animate-pop">
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
                        <span className="bg-secondary text-3xl px-6 py-2 rounded-xl font-black">
                        #{o.orderNumber}
                        </span>
                    </div>
                     <p className="text-xs opacity-60">Listo a las: {isClient ? (o.updatedAt ? o.updatedAt.toLocaleTimeString() : '') : '...'}</p>
                 </div>
              )) : <p className="text-center text-xs opacity-50 font-black py-20 uppercase col-span-full">No hay comandas listas</p>}
            </div>
          </div>
        </div>
      </section>
      <AlertDialog open={!!cancelTarget} onOpenChange={(isOpen) => !isOpen && setCancelTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar Pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El pedido #{cancelTarget?.orderNumber} para{' '}
                    <span className="font-bold">{cancelTarget?.customerName}</span> se eliminará permanentemente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCancelTarget(null)}>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                    if (cancelTarget) {
                        cancelOrder(cancelTarget.id);
                    }
                    setCancelTarget(null);
                }} className={buttonVariants({ variant: "destructive" })}>
                    Confirmar Cancelación
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
