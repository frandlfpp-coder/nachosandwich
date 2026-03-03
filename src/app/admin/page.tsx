'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const { products, addProduct, deleteProduct, stockItems, addStockItem, deleteStockItem } = useApp();

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  
  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('');
  
  const { toast } = useToast();

  const handleSaveProduct = () => {
    const price = parseFloat(newProductPrice);
    if (newProductName && !isNaN(price)) {
      addProduct({ name: newProductName.toUpperCase(), price });
      setNewProductName('');
      setNewProductPrice('');
      setProductModalOpen(false);
      toast({title: "Producto guardado"});
    } else {
      toast({variant: "destructive", title: "Datos inválidos"});
    }
  };
  
  const handleSaveStockItem = () => {
    if (newStockName && newStockUnit) {
      addStockItem({ name: newStockName.toUpperCase(), unit: newStockUnit.toUpperCase() });
      setNewStockName('');
      setNewStockUnit('');
      setStockModalOpen(false);
      toast({title: "Insumo creado"});
    } else {
      toast({variant: "destructive", title: "Datos inválidos"});
    }
  };

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">PRODUCTOS</h2>
            <Button onClick={() => setProductModalOpen(true)} className="bg-slate-100 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ NUEVO</Button>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl text-[10px] font-black">
                <span>{p.name} - ${p.price}</span>
                <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-black">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">INSUMOS</h2>
            <Button onClick={() => setStockModalOpen(true)} className="bg-slate-100 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ NUEVO</Button>
          </div>
          <div className="space-y-2">
            {stockItems.map(i => (
              <div key={i.id} className="flex justify-between p-4 bg-slate-50 rounded-2xl text-[10px] font-black">
                <span>{i.name} ({i.unit})</span>
                <button onClick={() => deleteStockItem(i.id)} className="text-red-500 font-black">✕</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">NUEVO PRODUCTO</DialogTitle></DialogHeader>
          <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="NOMBRE" className="w-full p-4 rounded-xl bg-slate-50 outline-none uppercase font-black mb-3 h-auto" />
          <Input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="PRECIO $" className="w-full p-4 rounded-xl bg-slate-50 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setProductModalOpen(false)} className="flex-1 py-4 opacity-40 font-black h-auto">ATRÁS</Button>
            <Button onClick={handleSaveProduct} className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">GUARDAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Stock Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">NUEVO INSUMO</DialogTitle></DialogHeader>
          <Input value={newStockName} onChange={e => setNewStockName(e.target.value)} placeholder="NOMBRE" className="w-full p-4 rounded-xl bg-slate-50 outline-none uppercase font-black mb-3 h-auto" />
          <Input value={newStockUnit} onChange={e => setNewStockUnit(e.target.value)} placeholder="UNIDAD (KG, UNID)" className="w-full p-4 rounded-xl bg-slate-50 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setStockModalOpen(false)} className="flex-1 py-4 opacity-40 font-black h-auto">ATRÁS</Button>
            <Button onClick={handleSaveStockItem} className="flex-1 bg-zinc-950 text-lime-400 py-4 rounded-2xl font-black h-auto">CREAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
