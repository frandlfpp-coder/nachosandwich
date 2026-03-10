'use client';

import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Bike, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Transaction } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function FinancePage() {
  const { transactions, closures, addTransaction, closeDay, deleteTransaction } = useApp();
  const [mode, setMode] = useState('hoy');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const { isClient } = useTheme();

  // Calculations for the current open shift (based on open transactions)
  const cash = transactions.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
  const trans = transactions.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
  const total = cash + trans;

  const openFinanceModal = (type: 'ingreso' | 'egreso') => {
    setModalType(type);
    setConcept('');
    setAmount('');
    setPaymentMethod('Efectivo');
    setModalOpen(true);
  };
  
  const handleAddTransaction = () => {
    const parsedAmount = parseFloat(amount);
    if(concept && !isNaN(parsedAmount) && parsedAmount > 0) {
      addTransaction({
        concept: concept.toUpperCase(),
        amount: parsedAmount,
        paymentMethod: paymentMethod,
        type: modalType
      });
      setModalOpen(false);
    }
  };

  const handleCloseDay = () => {
    closeDay();
  };

  const confirmDeleteTransaction = () => {
    if (deleteTarget) {
      deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    }
  };
  
  const { weeklyIngresos, weeklyEgresos, weeklyDeliveryFees } = useMemo(() => {
    if (!closures) return { weeklyIngresos: 0, weeklyEgresos: 0, weeklyDeliveryFees: 0 };
    
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    
    const weeklyClosures = closures.filter(c => {
        return c.closureDate && isWithinInterval(c.closureDate, { start, end });
    });
    
    const weeklyIngresos = weeklyClosures.reduce((sum, c) => sum + (c.totalIngresos || 0), 0);
    const weeklyEgresos = weeklyClosures.reduce((sum, c) => sum + (c.totalEgresos || 0), 0);
    const weeklyDeliveryFees = weeklyClosures.reduce((sum, c) => sum + (c.totalDeliveryFees || 0), 0);
    
    return { weeklyIngresos, weeklyEgresos, weeklyDeliveryFees };
  }, [closures]);


  return (
    <AppShell>
      <section>
        <div className="flex gap-8 mb-8 border-b text-[10px] tracking-widest font-black uppercase">
          <button onClick={() => setMode('hoy')} className={cn('pb-4', mode === 'hoy' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>Turno Actual</button>
          <button onClick={() => setMode('semanal')} className={cn('pb-4', mode === 'semanal' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>Reporte Semanal</button>
          <button onClick={() => setMode('historial')} className={cn('pb-4', mode === 'historial' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>Historial</button>
        </div>

        {mode === 'hoy' && (
          <div id="finance-today">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black uppercase">Efectivo (Turno Actual)</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">${cash.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black uppercase">Transferencia (Turno Actual)</p>
                <h3 className="text-4xl tracking-tighter text-blue-600 font-black">${trans.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                <p className="text-[10px] text-primary mb-2 font-black uppercase">Neto (Turno Actual)</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">${total.toLocaleString('es-AR')}</h3>
              </div>
            </div>
            <div className="flex justify-end gap-4 mb-8">
              <Button onClick={() => openFinanceModal('ingreso')} className="bg-card border-2 px-6 py-3 rounded-2xl text-[10px] font-black h-auto uppercase">+ Entrada</Button>
              <Button onClick={() => openFinanceModal('egreso')} className="bg-card border-2 px-6 py-3 rounded-2xl text-[10px] text-destructive font-black h-auto uppercase">- Salida</Button>
              <Button onClick={handleCloseDay} className="bg-black text-primary px-8 py-3 rounded-2xl text-[10px] border border-primary font-black shadow-lg h-auto uppercase">Cerrar Caja</Button>
            </div>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-card rounded-2xl border text-[10px] animate-pop font-black">
                  <div className='flex flex-col'>
                    <span className="uppercase">{t.concept}</span>
                    <span className='text-[8px] opacity-50 font-normal'>{isClient ? t.createdAt?.toLocaleString('es-AR') : '...'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn('text-lg', t.type === 'ingreso' ? 'text-primary' : 'text-destructive')}>
                      {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString('es-AR')}
                    </span>
                    {!t.concept.startsWith('VENTA:') && (
                        <button onClick={() => setDeleteTarget(t)} className="text-destructive font-black text-lg p-1 rounded-full hover:bg-destructive/10">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                </div>
              ))}
               {transactions.length === 0 && (
                <p className="text-center text-xs opacity-50 font-black py-20 uppercase">No hay movimientos en el turno actual</p>
              )}
            </div>
          </div>
        )}
        
        {mode === 'semanal' && (
          <div id="finance-weekly">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black uppercase">Ingresos Totales (Semanal)</p>
                <h3 className="text-4xl tracking-tighter text-green-600 font-black">${weeklyIngresos.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black uppercase">Egresos Totales (Semanal)</p>
                <h3 className="text-4xl tracking-tighter text-destructive font-black">${weeklyEgresos.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black uppercase">Pagos Delivery (Semanal)</p>
                <h3 className="text-4xl tracking-tighter text-blue-600 font-black">${weeklyDeliveryFees.toLocaleString('es-AR')}</h3>
              </div>
             </div>
             <p className='text-center text-xs opacity-50 font-black mt-12'>Mostrando reportes para la semana actual. Los cierres pasados se pueden ver en "Historial".</p>
          </div>
        )}

        {mode === 'historial' && (
          <div className="space-y-4">
             {closures.map(c => (
              <div key={c.id} className="bg-card p-6 rounded-3xl border animate-pop">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] opacity-40 capitalize font-black">
                    {isClient ? c.closureDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }) : '...'}
                  </span>
                  <div className='text-right'>
                    <p className="text-[9px] opacity-60 font-black uppercase">Neto del Turno</p>
                    <p className="text-xl text-primary font-black">${(c.neto || 0).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[9px] text-center font-black mb-4 uppercase">
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>Ingresos</p>
                        <p className='text-green-600 dark:text-lime-500 text-sm'>${(c.totalIngresos || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>Egresos</p>
                        <p className='text-destructive text-sm'>${(c.totalEgresos || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>Transacciones</p>
                        <p className='text-blue-600 text-sm'>{c.totalTransacciones || 0}</p>
                    </div>
                </div>
                <div className="flex gap-4 text-[9px] opacity-60 font-black border-t pt-4 mt-4 flex-wrap uppercase">
                  <span className="font-bold">Balances Finales:</span>
                  <span>💵 Efectivo: ${(c.balanceEfectivo || 0).toLocaleString('es-AR')}</span>
                  <span>📱 Transfe: ${(c.balanceTransferencia || 0).toLocaleString('es-AR')}</span>
                </div>
                 <div className="flex gap-4 text-[9px] opacity-60 font-black border-t pt-2 mt-2 flex-wrap uppercase">
                    <span className="font-bold">A Pagar:</span>
                    <span className="text-blue-600 flex items-center gap-1">
                        <Bike className="w-3 h-3" /> 
                        Delivery: ${(c.totalDeliveryFees || 0).toLocaleString('es-AR')}
                    </span>
                </div>
              </div>
            ))}
             {closures.length === 0 && (
                <p className="text-center text-xs opacity-50 font-black py-20 uppercase">No hay cierres registrados</p>
              )}
          </div>
        )}
      </section>
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black uppercase">
              {modalType === 'ingreso' ? 'Nueva Entrada' : 'Nueva Salida'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concept" className="text-xs opacity-70">Concepto</Label>
              <Input id="concept" value={concept} onChange={e => setConcept(e.target.value)} placeholder="EJ: PAGO PROVEEDOR" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black mb-3 h-auto" />
            </div>
            <div>
              <Label htmlFor="amount" className="text-xs opacity-70">Monto</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
            </div>
             <div>
              <Label className="text-xs opacity-70">Método de Pago</Label>
              <div className="flex gap-2 mt-1">
                  <Button onClick={() => setPaymentMethod('Efectivo')} className={cn('flex-1 py-4 rounded-2xl border-2 font-black h-auto text-sm', paymentMethod === 'Efectivo' ? 'bg-lime-200 border-primary text-foreground dark:bg-lime-900 dark:text-white' : 'bg-slate-100 dark:bg-zinc-800 border-transparent text-foreground/60 hover:bg-slate-200 dark:hover:bg-zinc-700')}>💵 Efectivo</Button>
                  <Button onClick={() => setPaymentMethod('Transferencia')} className={cn('flex-1 py-4 rounded-2xl border-2 font-black h-auto text-sm', paymentMethod === 'Transferencia' ? 'bg-blue-100 border-blue-500 text-foreground dark:bg-blue-900 dark:text-white' : 'bg-slate-100 dark:bg-zinc-800 border-transparent text-foreground/60 hover:bg-slate-200 dark:hover:bg-zinc-700')}>📱 Transfe</Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 sm:justify-center flex-col sm:flex-row gap-2">
            <DialogClose asChild>
                <Button variant="ghost" className="w-full sm:w-auto py-4 opacity-40 font-black h-auto uppercase">Atrás</Button>
            </DialogClose>
            <Button onClick={handleAddTransaction} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto uppercase">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar Movimiento?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el movimiento: <br />
                    <span className="font-bold">{deleteTarget?.concept}</span> por <span className="font-bold">${deleteTarget?.amount.toLocaleString('es-AR')}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTransaction} className={buttonVariants({ variant: "destructive" })}>
                    Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
