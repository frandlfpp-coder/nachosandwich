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
import { Product, Topping, ProductCategory } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminPage() {
  const { 
    products, addProduct, deleteProduct, 
    stockItems, addStockItem, deleteStockItem, 
    completedOrders, pickupOrder, 
    resetData, updateProduct,
    toppings, addTopping, deleteTopping, updateTopping
  } = useApp();

  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductEmoji, setNewProductEmoji] = useState('');
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory | ''>('');

  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [newStockName, setNewStockName] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('');

  const [isToppingModalOpen, setToppingModalOpen] = useState(false);
  const [newToppingName, setNewToppingName] = useState('');
  const [newToppingPrice, setNewToppingPrice] = useState('');
  
  const [isEditProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editedProductPrice, setEditedProductPrice] = useState('');

  const [isEditToppingModalOpen, setEditToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [editedToppingPrice, setEditedToppingPrice] = useState('');

  const { toast } = useToast();

  const handleSaveProduct = () => {
    const price = parseFloat(newProductPrice);
    if (newProductName && !isNaN(price) && newProductEmoji && newProductCategory) {
      addProduct({ name: newProductName.toUpperCase(), price, emoji: newProductEmoji, category: newProductCategory });
      setNewProductName('');
      setNewProductPrice('');
      setNewProductEmoji('');
      setNewProductCategory('');
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
  
  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Seguro que quieres eliminar este producto?')) {
      deleteProduct(id);
    }
  };

  const handleDeleteStockItem = (id: string) => {
    if (confirm('¿Seguro que quieres eliminar este insumo?')) {
      deleteStockItem(id);
    }
  };

  const handleDeleteTopping = (id: string) => {
    if (confirm('¿Seguro que quieres eliminar este topping? También se quitará de los carritos de compra.')) {
      deleteTopping(id);
    }
  };

  const handleSaveTopping = () => {
    const price = parseFloat(newToppingPrice);
    if (newToppingName && !isNaN(price)) {
      addTopping({ name: newToppingName.toUpperCase(), price });
      setNewToppingName('');
      setNewToppingPrice('');
      setToppingModalOpen(false);
      toast({title: "Topping guardado"});
    } else {
      toast({variant: "destructive", title: "Datos inválidos"});
    }
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditedProductPrice(product.price.toString());
    setEditProductModalOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    const price = parseFloat(editedProductPrice);
    if (!isNaN(price) && price > 0) {
        updateProduct(editingProduct.id, price);
        setEditProductModalOpen(false);
        setEditingProduct(null);
        toast({ title: 'Precio de producto actualizado' });
    } else {
        toast({ variant: 'destructive', title: 'Precio inválido' });
    }
  };
  
  const openEditToppingModal = (topping: Topping) => {
    setEditingTopping(topping);
    setEditedToppingPrice(topping.price.toString());
    setEditToppingModalOpen(true);
  };

  const handleUpdateTopping = () => {
    if (!editingTopping) return;
    const price = parseFloat(editedToppingPrice);
    if (!isNaN(price)) { // Allow 0 for price
        updateTopping(editingTopping.id, price);
        setEditToppingModalOpen(false);
        setEditingTopping(null);
        toast({ title: 'Precio de topping actualizado' });
    } else {
        toast({ variant: 'destructive', title: 'Precio inválido' });
    }
  };

  return (
    <AppShell>
      <section className="space-y-8">
        <div className="bg-card text-card-foreground rounded-3xl p-8 border">
            <h2 className="text-2xl font-black mb-6">Modo TV</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild variant="outline" className="flex-1 h-auto py-4 text-xs font-black">
                    <Link href="/kitchen-display" target="_blank">
                        <Tv className="mr-2 h-4 w-4" />
                        TV Cocina
                    </Link>
                </Button>
                <Button asChild className="flex-1 h-auto py-4 text-xs font-black">
                    <Link href="/customer-display" target="_blank">
                        <Tv className="mr-2 h-4 w-4" />
                        TV Clientes
                    </Link>
                </Button>
            </div>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Listos para retirar</h2>
          </div>
          <div className="space-y-2">
            {completedOrders.length > 0 ? (
                completedOrders.map(o => (
                  <div key={o.id} className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-xs font-black animate-pop gap-2">
                    <span className="uppercase">#{o.orderNumber} - {o.customerName}</span>
                    <Button onClick={() => pickupOrder(o.id)} size="sm" className="bg-primary text-primary-foreground rounded-xl text-[10px] font-black h-auto px-4 py-2 w-full sm:w-auto">
                      <Check className="mr-2 h-3 w-3" />
                      Marcar Retirado
                    </Button>
                  </div>
                ))
            ) : (
              <p className="text-center text-xs opacity-50 font-black py-4">No hay pedidos listos para retirar</p>
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Productos</h2>
            <Button onClick={() => setProductModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ Nuevo</Button>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black">
                <span>{p.emoji} {p.name} - ${p.price} <span className="text-[9px] opacity-60">({p.category})</span></span>
                <div className="flex items-center gap-2">
                    <Button onClick={() => openEditProductModal(p)} size="icon" variant="ghost" className="h-auto w-auto p-1 text-muted-foreground hover:text-primary">
                        <Edit className="h-3 w-3" />
                    </Button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-destructive font-black">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Toppings</h2>
            <Button onClick={() => setToppingModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ Nuevo</Button>
          </div>
          <div className="space-y-2">
            {toppings.map(t => (
              <div key={t.id} className="flex justify-between items-center p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black">
                <span>{t.name} - ${t.price}</span>
                 <div className="flex items-center gap-2">
                    <Button onClick={() => openEditToppingModal(t)} size="icon" variant="ghost" className="h-auto w-auto p-1 text-muted-foreground hover:text-primary">
                        <Edit className="h-3 w-3" />
                    </Button>
                    <button onClick={() => handleDeleteTopping(t.id)} className="text-destructive font-black">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-3xl p-8 border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black">Insumos</h2>
            <Button onClick={() => setStockModalOpen(true)} className="bg-slate-100 dark:bg-zinc-800 text-foreground px-6 py-2 rounded-xl text-[10px] font-black h-auto">+ Nuevo</Button>
          </div>
          <div className="space-y-2">
            {stockItems.map(i => (
              <div key={i.id} className="flex justify-between p-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black">
                <span>{i.name} ({i.unit})</span>
                <button onClick={() => handleDeleteStockItem(i.id)} className="text-destructive font-black">✕</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-card rounded-3xl p-8 border-2 border-destructive/50 mt-8">
        <h2 className="text-2xl font-black mb-4 text-destructive">Zona Peligrosa</h2>
        <p className="text-xs opacity-70 font-black mb-6">
            Esta acción es irreversible. Al presionar el botón se borrarán todos los productos, pedidos, stock y datos financieros únicamente del local que tengas seleccionado.
        </p>
        <Button onClick={resetData} variant="destructive" className="w-full h-auto py-4 text-xs font-black">
            Borrar todos los datos de este local
        </Button>
      </div>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-3xl p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">Nuevo Producto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={newProductEmoji} onChange={e => setNewProductEmoji(e.target.value)} placeholder="Emoji" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
            <Input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Nombre" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
            <Select value={newProductCategory} onValueChange={(value) => setNewProductCategory(value as ProductCategory)}>
              <SelectTrigger className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto text-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sandwich de Miga">Sandwich de Miga</SelectItem>
                <SelectItem value="Lomitos">Lomitos</SelectItem>
                <SelectItem value="Pebetes">Pebetes</SelectItem>
                <SelectItem value="Barroluco">Barroluco</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="Precio $" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
          </div>
          <DialogFooter className="mt-6 sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setProductModalOpen(false)} className="w-full sm:w-auto py-4 opacity-40 font-black h-auto">Atrás</Button>
            <Button onClick={handleSaveProduct} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Stock Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-3xl p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">Nuevo Insumo</DialogTitle></DialogHeader>
          <Input value={newStockName} onChange={e => setNewStockName(e.target.value)} placeholder="Nombre" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-3 h-auto" />
          <Input value={newStockUnit} onChange={e => setNewStockUnit(e.target.value)} placeholder="Unidad (KG, UNID)" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setStockModalOpen(false)} className="w-full sm:w-auto py-4 opacity-40 font-black h-auto">Atrás</Button>
            <Button onClick={handleSaveStockItem} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Topping Modal */}
      <Dialog open={isToppingModalOpen} onOpenChange={setToppingModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-3xl p-10 animate-pop">
          <DialogHeader><DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">Nuevo Topping</DialogTitle></DialogHeader>
          <Input value={newToppingName} onChange={e => setNewToppingName(e.target.value)} placeholder="Nombre (Ej: Cheddar)" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-3 h-auto" />
          <Input type="number" value={newToppingPrice} onChange={e => setNewToppingPrice(e.target.value)} placeholder="Precio $" className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" />
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setToppingModalOpen(false)} className="w-full sm:w-auto py-4 opacity-40 font-black h-auto">Atrás</Button>
            <Button onClick={handleSaveTopping} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditProductModalOpen} onOpenChange={setEditProductModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-3xl p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">Editar Precio</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="text-center mb-4">
                <p className="text-2xl">{editingProduct.emoji}</p>
                <p className="font-black">{editingProduct.name}</p>
            </div>
          )}
          <Input 
            type="number" 
            value={editedProductPrice} 
            onChange={e => setEditedProductPrice(e.target.value)} 
            placeholder="Nuevo Precio $" 
            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" 
          />
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditProductModalOpen(false)} className="w-full sm:w-auto py-4 opacity-40 font-black h-auto">Cancelar</Button>
            <Button onClick={handleUpdateProduct} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topping Modal */}
      <Dialog open={isEditToppingModalOpen} onOpenChange={setEditToppingModalOpen}>
        <DialogContent className="bg-card w-full max-w-sm rounded-3xl p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tighter mb-6 text-center font-black">Editar Precio de Topping</DialogTitle>
          </DialogHeader>
          {editingTopping && (
            <div className="text-center mb-4">
                <p className="font-black">{editingTopping.name}</p>
            </div>
          )}
          <Input 
            type="number" 
            value={editedToppingPrice} 
            onChange={e => setEditedToppingPrice(e.target.value)} 
            placeholder="Nuevo Precio $" 
            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 outline-none font-black mb-6 h-auto" 
          />
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditToppingModalOpen(false)} className="w-full sm:w-auto py-4 opacity-40 font-black h-auto">Cancelar</Button>
            <Button onClick={handleUpdateTopping} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 rounded-2xl font-black h-auto">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
