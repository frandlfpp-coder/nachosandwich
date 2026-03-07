'use client';

import AppShell from '@/components/layout/AppShell';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tv, Check, Edit } from 'lucide-react';
import { Product } from '@/lib/types';

export default function AdminPage() {
  const { products, addProduct, deleteProduct, stockItems, addStockItem, deleteStockItem, completedOrders, pickupOrder, resetData, updateProduct } = useApp();

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductEmoji, setNewProductEmoji] = useState('');

  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('');
  
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedPrice, setEditedPrice] = useState('');

  const { toast } = useToast();

  const handleSaveProduct = () => {
    const price = parseFloat(newProductPrice);
    if (newProductName && !isNaN(price) && newProductEmoji) {
      addProduct({ name: newProductName.toUpperCase(), price, emoji: newProductEmoji });
      setNewProductName('');
      setNewProductPrice('');
      setNewProductEmoji('');
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

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditedPrice(product.price.toString());
    setEditModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    const price = parseFloat(editedPrice);
    if (!isNaN(price) && price > 0) {
        updateProduct(editingProduct.id, price);
        setEditModalOpen(false);
        setEditingProduct(null);
        toast({ title: 'Precio actualizado' });
    } else {
        toast({ variant: 'destructive', title: 'Precio inválido' });
    }
  };

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="bg-card text-card-foreground rounded-[3rem] p-8 border">
            <h2 className="text-2xl font-black mb-6">MODO TV</h2>
            <div className="flex gap-4">
                <Button asChild variant="outline" className="flex-1 h-auto py-4 text-xs font-black">
                    <Link href="/kitchen-display" target="_blank">
                        <Tv className="mr-2 h-4 w-4" />
                        TV COCINA
                    </Link>
                </Button>
                <Button asChild className="flex-1 h-auto py-4 text-xs font-black">
                    <Link href="/customer-display" target="_blank">
                        <Tv className="mr-2 h-4 w-4" />
                        TV CLIENTES
                    </Link>
                </Button>
            </div>
        </div>

        <div className="bg-card text-card-foreground rounded-[3rem] p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">LISTOS PARA RETIRAR</h2>
          </div>
          <div className="space-y-2">
            {completedOrders.length > 0 ? (
                completedOrders.map(o => (
                  <div key={o.id} className="flex justify-between items-center p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-xs font-black animate-pop">
                    <span>#{o.orderNumber} - {o.customerName}</span>
                    <Button onClick={() => pickupOrder(o.id)} size="sm" className="bg-primary text-primary-foreground rounded-xl text-[10px] font-black h-auto px-4 py-2">
                      <Check className="mr-2 h-3 w-3" />
                      MARCAR RETIRADO
                    </Button>
                  </div>
                ))
            ) : (
              <p className="text-center text-xs opacity-50 font-black py-4">NO HAY PEDIDOS LISTOS PARA RETIRAR</p>
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-[3rem] p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">PRODUCTOS</h2>
            <Button onClick={() => setProductModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ NUEVO</Button>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black">
                <span>{p.emoji} {p.name} - ${p.price}</span>
                <div className="flex items-center gap-2">
                    <Button onClick={() => openEditModal(p)} size="icon" variant="ghost" className="h-auto w-auto p-1 text-muted-foreground hover:text-primary">
                        <Edit className="h-3 w-3" />
                    </Button>
                    <button onClick={() => deleteProduct(p.id)} className="text-destructive font-black">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-[3rem] p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">INSUMOS</h2>
            <Button onClick={() => setStockModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ NUEVO</Button>
          </div>
          <div className="space-y-2">
            {stockItems.map(i => (
              <div key={i.id} className="flex justify-between p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black">
                <span>{i.name} ({i.unit})</span>
                <button onClick={() => deleteStockItem(i.id)} className="text-destructive font-black">✕</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-card rounded-[3rem] p-8 border-2 border-destructive/50 mt-8">
        <h2 className="text-2xl font-black mb-4 text-destructive">ZONA PELIGROSA</h2>
        <p className="text-xs opacity-70 font-black mb-6 normal-case" style={{fontStyle: 'normal'}}>
            Esta acción es irreversible. Al presionar el botón se borrarán todos los productos, pedidos, stock y datos financieros únicamente del local que tengas seleccionado.
        </p>
        <Button onClick={resetData} variant="destructive" className="w-full h-auto py-4 text-xs font-black">
            BORRAR TODOS LOS DATOS DE ESTE LOCAL
        </Button>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">NUEVO PRODUCTO</DialogTitle></DialogHeader>
          <Input value={newProductEmoji} onChange={e => setNewProductEmoji(e.target.value)} placeholder="EMOJI" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-3 h-auto" />
          <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="NOMBRE" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black mb-3 h-auto" />
          <Input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="PRECIO $" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setProductModalOpen(false)} className="flex-1 py-4 opacity-40 font-black h-auto">ATRÁS</Button>
            <Button onClick={handleSaveProduct} className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">GUARDAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Stock Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">NUEVO INSUMO</DialogTitle></DialogHeader>
          <Input value={newStockName} onChange={e => setNewStockName(e.target.value)} placeholder="NOMBRE" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black mb-3 h-auto" />
          <Input value={newStockUnit} onChange={e => setNewStockUnit(e.target.value)} placeholder="UNIDAD (KG, UNID)" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setStockModalOpen(false)} className="flex-1 py-4 opacity-40 font-black h-auto">ATRÁS</Button>
            <Button onClick={handleSaveStockItem} className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">CREAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">EDITAR PRECIO</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="text-center mb-4">
                <p className="text-2xl">{editingProduct.emoji}</p>
                <p className="font-black">{editingProduct.name}</p>
            </div>
          )}
          <Input 
            type="number" 
            value={editedPrice} 
            onChange={e => setEditedPrice(e.target.value)} 
            placeholder="NUEVO PRECIO $" 
            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" 
          />
          <DialogFooter className="flex gap-4">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)} className="flex-1 py-4 opacity-40 font-black h-auto">CANCELAR</Button>
            <Button onClick={handleUpdateProduct} className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">GUARDAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
