'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { Order } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Bike, Phone, CheckCircle2, Package } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function DeliveryPage() {
  const { orders, completeOrder, completedDeliveriesThisShift, cancelOrder } = useApp();
  const { isClient } = useTheme();
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const deliveryOrders = useMemo(() => {
    return orders.filter(o => o.isDelivery && o.status === 'pending');
  }, [orders]);

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((total, item) => total + item.finalPrice * item.qty, 0);
  }

  const totalToPayDriver = useMemo(() => {
    return completedDeliveriesThisShift.reduce((total, order) => total + (order.deliveryFee || 0), 0);
  }, [completedDeliveriesThisShift]);

  return (
    <AppShell>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-card text-card-foreground p-8 rounded-3xl border">
                <p className="text-[10px] opacity-40 mb-2 font-black">Deliveries Pendientes</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">{deliveryOrders.length}</h3>
            </div>
            <div className="bg-card text-card-foreground p-8 rounded-3xl border">
                <p className="text-[10px] opacity-40 mb-2 font-black">Entregados Hoy</p>
                <h3 className="text-4xl tracking-tighter text-blue-600 font-black">{completedDeliveriesThisShift.length}</h3>
            </div>
            <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl">
                <p className="text-[10px] text-primary mb-2 font-black">A Pagar al Repartidor</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">${totalToPayDriver.toLocaleString('es-AR')}</h3>
            </div>
        </div>
        
        <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl tracking-tighter font-black flex items-center gap-3"><Bike /> Pendientes de Entrega</h2>
            </div>
            
            {deliveryOrders.length === 0 ? (
               <div className="text-center py-12 opacity-40">
                 <Bike className="w-12 h-12 mx-auto mb-4" />
                 <h3 className="text-md font-black">Sin Deliveries Pendientes</h3>
               </div>
            ) : (
              <div id="delivery-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deliveryOrders.map(o => (
                  <div key={o.id} className="bg-card text-card-foreground rounded-3xl p-8 border shadow-xl animate-pop flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-black">{o.customerName}</h3>
                        {o.customerPhone && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
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
                        <p className="text-[10px] opacity-40 mb-1 font-black">Items</p>
                        <ul className="text-sm space-y-2 font-black border-l-4 border-slate-100 dark:border-zinc-800 pl-3">
                            {o.items.map(i => (
                              i.product ? (
                                <li key={i.id}>
                                  <span>{i.qty}x {i.product.name}</span>
                                  {i.toppings.length > 0 && (
                                      <ul className="pl-4 text-[10px] opacity-70 font-semibold normal-case">
                                          {i.toppings.map(t => <li key={t.id}>+ {t.name}</li>)}
                                      </ul>
                                  )}
                                  {i.notes && (
                                      <p className="pl-4 text-[10px] text-blue-500 font-semibold normal-case italic">Nota: {i.notes}</p>
                                  )}
                                </li>
                              ) : null
                            ))}
                        </ul>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8 text-center">
                        <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] opacity-40 font-black">Cobrar al Cliente</p>
                            <p className="text-lg font-black text-primary">${(calculateOrderTotal(o) + (o.deliveryFee || 0)).toLocaleString('es-AR')}</p>
                        </div>
                         <div className="bg-slate-100 dark:bg-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] opacity-40 font-black">Pago al Delivery</p>
                            <p className="text-lg font-black text-blue-600">${(o.deliveryFee || 0).toLocaleString('es-AR')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Button variant="outline" onClick={() => setCancelTarget(o)} className="w-full py-4 rounded-2xl text-[10px] font-black h-auto text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                          Cancelar
                      </Button>
                      <Button onClick={() => completeOrder(o.id)} className="w-full bg-zinc-950 text-white dark:text-zinc-950 dark:bg-white py-4 rounded-2xl text-[10px] font-black h-auto hover:bg-zinc-800 dark:hover:bg-zinc-200">
                        Marcar como Entregado
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div>
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl tracking-tighter font-black flex items-center gap-3"><CheckCircle2 /> Entregados en este Turno</h2>
          </div>
            {completedDeliveriesThisShift.length === 0 ? (
                 <div className="text-center py-12 opacity-40">
                    <Package className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-md font-black">Ningún Delivery Entregado Aún</h3>
                    <p className="text-xs font-semibold">Este registro se reinicia al cerrar la caja.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {completedDeliveriesThisShift.map(o => (
                  <div key={o.id} className="flex justify-between items-center p-4 bg-card rounded-2xl border text-[10px] animate-pop font-black">
                    <div className='flex items-center gap-4'>
                        <span className="bg-slate-100 dark:bg-zinc-800 text-primary font-black text-lg px-4 py-2 rounded-xl">#{o.orderNumber}</span>
                        <div>
                            <span>{o.customerName}</span>
                            <span className='text-[8px] opacity-50 font-normal block'>{isClient ? o.updatedAt?.toLocaleTimeString('es-AR') : '...'}</span>
                        </div>
                    </div>
                    <span className={'text-blue-600'}>
                        Pago Delivery: ${(o.deliveryFee || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </section>
      <AlertDialog open={!!cancelTarget} onOpenChange={(isOpen) => !isOpen && setCancelTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar Pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. El pedido de delivery #{cancelTarget?.orderNumber} para{' '}
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
