'use client';

import { useState } from 'react';
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

export default function FinancePage() {
  const { transactions, closures, addTransaction, closeDay } = useApp();
  const [mode, setMode] = useState('hoy');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ingreso' | 'egreso'>('ingreso');
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');

  // Note: This calculation is now for ALL transactions in the history for the current local.
  // A real app might filter this by date (e.g., today's transactions).
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
    if (transactions.length === 0) {
        alert("SIN TRANSACCIONES PARA CERRAR");
        return;
    }
    if(!confirm("¿CERRAR JORNADA? Esto creará un reporte de cierre con las transacciones actuales.")) return;
    closeDay();
  };

  return (
    <AppShell>
      <section>
        <div className="flex gap-8 mb-8 border-b text-[10px] tracking-widest font-black">
          <button onClick={() => setMode('hoy')} className={cn('pb-4', mode === 'hoy' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>MOVIMIENTOS</button>
          <button onClick={() => setMode('historial')} className={cn('pb-4', mode === 'historial' ? 'border-b-4 border-primary text-primary' : 'opacity-40')}>HISTORIAL DE CIERRES</button>
        </div>

        {mode === 'hoy' && (
          <div id="finance-today">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] opacity-40 mb-2 font-black">EFECTIVO (HISTÓRICO)</p>
                <h3 className="text-4xl tracking-tighter text-green-600 font-black">${cash.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] opacity-40 mb-2 font-black">TRANSFERENCIA (HISTÓRICO)</p>
                <h3 className="text-4xl tracking-tighter text-blue-600 font-black">${trans.toLocaleString('es-AR')}</h3>
              </div>
              <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                <p className="text-[10px] text-lime-400 mb-2 font-black">NETO TOTAL (HISTÓRICO)</p>
                <h3 className="text-4xl tracking-tighter text-lime-500 font-black">${total.toLocaleString('es-AR')}</h3>
              </div>
            </div>
            <div className="flex justify-end gap-4 mb-8">
              <Button onClick={() => openFinanceModal('ingreso')} className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl text-[10px] font-black h-auto">+ ENTRADA</Button>
              <Button onClick={() => openFinanceModal('egreso')} className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl text-[10px] text-red-500 font-black h-auto">- SALIDA</Button>
              <Button onClick={handleCloseDay} className="bg-black text-lime-400 px-8 py-3 rounded-2xl text-[10px] border border-lime-500 font-black shadow-lg h-auto">CERRAR CAJA</Button>
            </div>
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t.id} className="flex justify-between p-4 bg-white rounded-2xl border text-[10px] animate-pop font-black">
                  <div className='flex flex-col'>
                    <span>{t.concept}</span>
                    <span className='text-[8px] opacity-50 font-normal normal-case'>{t.createdAt?.toLocaleString('es-AR')}</span>
                  </div>
                  <span className={t.type === 'ingreso' ? 'text-lime-600' : 'text-red-600'}>
                    {t.type === 'ingreso' ? '+' : '-'}${t.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'historial' && (
          <div className="space-y-4">
             {closures.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-100 animate-pop">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] opacity-40 capitalize font-black">
                    {c.closureDate?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xl text-lime-600 font-black">${c.netTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex gap-4 text-[9px] opacity-60 font-black">
                  <span>VENTAS: {c.transactionCount}</span>
                  <span>💵 ${c.cashTotal.toLocaleString('es-AR')}</span>
                  <span>📱 ${c.transferTotal.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">
              {modalType === 'ingreso' ? 'NUEVA ENTRADA' : 'NUEVA SALIDA'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="concept" className="text-xs non-italic normal-case opacity-70">Concepto</Label>
              <Input id="concept" value={concept} onChange={e => setConcept(e.target.value)} placeholder="EJ: PAGO PROVEEDOR" className="w-full p-4 rounded-xl bg-slate-50 outline-none uppercase font-black mb-3 h-auto" />
            </div>
            <div>
              <Label htmlFor="amount" className="text-xs non-italic normal-case opacity-70">Monto</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="$" className="w-full p-4 rounded-xl bg-slate-50 outline-none font-black h-auto" />
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
