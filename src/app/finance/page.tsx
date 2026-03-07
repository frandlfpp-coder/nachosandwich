'use client';

import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
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

export default function FinancePage() {
  const { transactions, closures, addTransaction, closeDay } = useApp();
  const [mode, setMode] = useState('hoy');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');

  // Calculations for the current open shift (based on open transactions)
  const cash = transactions.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
  const trans = transactions.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
  const total = cash + trans;

  const openFinanceModal = (type: 'ingreso' | 'egreso') => {
    setModalType(type);
    setConcept('');
    setAmount('');
    setModalOpen(true);
  };
  
  const handleAddTransaction = () => {
    const parsedAmount = parseFloat(amount);
    if(concept && !isNaN(parsedAmount) && parsedAmount > 0) {
      addTransaction({
        concept: concept.toUpperCase(),
        amount: parsedAmount,
        paymentMethod: 'Efectivo', // Manual transactions are cash for now
        type: modalType
      });
      setModalOpen(false);
    }
  };

  const handleCloseDay = () => {
    closeDay();
  };
  
  // Weekly report calculations
  const { weeklyClosures, weeklyIngresos, weeklyEgresos } = useMemo(() => {
    if (!closures) return { weeklyClosures: [], weeklyIngresos: 0, weeklyEgresos: 0 };
    
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    
    const weeklyClosures = closures.filter(c => {
        return c.closureDate && isWithinInterval(c.closureDate, { start, end });
    });
    
    const weeklyIngresos = weeklyClosures.reduce((sum, c) => sum + (c.totalIngresos || 0), 0);
    const weeklyEgresos = weeklyClosures.reduce((sum, c) => sum + (c.totalEgresos || 0), 0);
    
    return { weeklyClosures, weeklyIngresos, weeklyEgresos };
  }, [closures]);


  return (
    <AppShell>
      <section>
        <div className="flex gap-8 mb-8 border-b text-[10px] tracking-widest font-black">
          <button onClick={() => setMode('hoy')} className={cn('pb-4', mode === 'hoy' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>TURNO ACTUAL</button>
          <button onClick={() => setMode('semanal')} className={cn('pb-4', mode === 'semanal' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>REPORTE SEMANAL</button>
          <button onClick={() => setMode('historial')} className={cn('pb-4', mode === 'historial' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>HISTORIAL DE CIERRES</button>
        </div>

        {mode === 'hoy' && (
          <div id="finance-today">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black">EFECTIVO (TURNO ACTUAL)</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">${cash.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black">TRANSFERENCIA (TURNO ACTUAL)</p>
                <h3 className="text-4xl tracking-tighter text-blue-600 font-black">${trans.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                <p className="text-[10px] text-primary mb-2 font-black">NETO (TURNO ACTUAL)</p>
                <h3 className="text-4xl tracking-tighter text-primary font-black">${total.toLocaleString('es-AR')}</h3>
              </div>
            </div>
            <div className="flex justify-end gap-4 mb-8">
              <Button onClick={() => openFinanceModal('ingreso')} className="bg-card border-2 px-6 py-3 rounded-2xl text-[10px] font-black h-auto">+ ENTRADA</Button>
              <Button onClick={() => openFinanceModal('egreso')} className="bg-card border-2 px-6 py-3 rounded-2xl text-[10px] text-destructive font-black h-auto">- SALIDA</Button>
              <Button onClick={handleCloseDay} className="bg-black text-primary px-8 py-3 rounded-2xl text-[10px] border border-primary font-black shadow-lg h-auto">CERRAR CAJA</Button>
            </div>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between p-4 bg-card rounded-2xl border text-[10px] animate-pop font-black">
                  <div className='flex flex-col'>
                    <span>{t.concept}</span>
                    <span className='text-[8px] opacity-50 font-normal normal-case'>{t.createdAt?.toLocaleString('es-AR')}</span>
                  </div>
                  <span className={t.type === 'ingreso' ? 'text-primary' : 'text-destructive'}>
                    {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
               {transactions.length === 0 && (
                <p className="text-center text-xs opacity-50 font-black py-20">NO HAY MOVIMIENTOS EN EL TURNO ACTUAL</p>
              )}
            </div>
          </div>
        )}
        
        {mode === 'semanal' && (
          <div id="finance-weekly">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black">INGRESOS TOTALES (SEMANAL)</p>
                <h3 className="text-4xl tracking-tighter text-green-600 font-black">${weeklyIngresos.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-card text-card-foreground p-8 rounded-[2.5rem] border">
                <p className="text-[10px] opacity-40 mb-2 font-black">EGRESOS TOTALES (SEMANAL)</p>
                <h3 className="text-4xl tracking-tighter text-destructive font-black">${weeklyEgresos.toLocaleString('es-AR')}</h3>
              </div>
             </div>
             <p className='text-center text-xs opacity-50 font-black mt-12'>Mostrando reportes para la semana actual. Los cierres pasados se pueden ver en "Historial de Cierres".</p>
          </div>
        )}

        {mode === 'historial' && (
          <div className="space-y-4">
             {closures.map(c => (
              <div key={c.id} className="bg-card p-6 rounded-3xl border animate-pop">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] opacity-40 capitalize font-black">
                    {c.closureDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                  <div className='text-right'>
                    <p className="text-[9px] opacity-60 font-black">NETO DEL TURNO</p>
                    <p className="text-xl text-primary font-black">${(c.neto || 0).toLocaleString('es-AR')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-[9px] text-center font-black mb-4">
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>INGRESOS</p>
                        <p className='text-green-600 dark:text-lime-500 text-sm'>${(c.totalIngresos || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>EGRESOS</p>
                        <p className='text-destructive text-sm'>${(c.totalEgresos || 0).toLocaleString('es-AR')}</p>
                    </div>
                    <div className='bg-slate-100 dark:bg-zinc-800 p-2 rounded-lg'>
                        <p className='opacity-60'>TRANSACCIONES</p>
                        <p className='text-blue-600 text-sm'>{c.totalTransacciones || 0}</p>
                    </div>
                </div>
                <div className="flex gap-4 text-[9px] opacity-60 font-black border-t pt-4 mt-4">
                  <span>BALANCES FINALES:</span>
                  <span>💵 ${(c.balanceEfectivo || 0).toLocaleString('es-AR')}</span>
                  <span>📱 ${(c.balanceTransferencia || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
             {closures.length === 0 && (
                <p className="text-center text-xs opacity-50 font-black py-20">NO HAY CIERRES REGISTRADOS</p>
              )}
          </div>
        )}
      </section>
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">
              {modalType === 'ingreso' ? 'NUEVA ENTRADA' : 'NUEVA SALIDA'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concept" className="text-xs non-italic normal-case opacity-70">Concepto</Label>
              <Input id="concept" value={concept} onChange={e => setConcept(e.target.value)} placeholder="EJ: PAGO PROVEEDOR" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black mb-3 h-auto" />
            </div>
            <div>
              <Label htmlFor="amount" className="text-xs non-italic normal-case opacity-70">Monto</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
            </div>
          </div>
          <DialogFooter className="flex gap-4 pt-6">
            <DialogClose asChild>
                <Button variant="ghost" className="flex-1 py-4 opacity-40 font-black h-auto">ATRÁS</Button>
            </DialogClose>
            <Button onClick={handleAddTransaction} className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">GUARDAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
