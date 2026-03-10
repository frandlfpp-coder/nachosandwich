'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Minus, X } from 'lucide-react';
import { Product, Order, Topping } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  const { products, toppings, cart, addToCart, updateCartQty, clearCart, cartTotal, cartCount, addTransaction, addOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [payMethod, setPayMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isDelivery, setIsDelivery] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  
  const [productToCustomize, setProductToCustomize] = useState<Product | null>(null);
  const [isCustomizeModalOpen, setCustomizeModalOpen] = useState(false);


  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCustomize = (product: Product) => {
    setProductToCustomize(product);
    setCustomizeModalOpen(true);
  };
  
  const handleConfirmSale = () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: "Carrito vacío" });
      return;
    }
    
    const parsedDeliveryFee = parseFloat(deliveryFee) || 0;
    if (isDelivery && !customerPhone) {
      toast({ variant: 'destructive', title: "Falta el teléfono para el delivery" });
      return;
    }
    if (isDelivery && parsedDeliveryFee <= 0) {
      toast({ variant: 'destructive', title: "Falta el costo del delivery" });
      return;
    }

    const name = customerName.trim().toUpperCase() || "SIN NOMBRE";
    const orderNumber = Math.floor(Math.random() * 9000) + 1000;
    
    const orderData: Partial<Order> = {
      customerName: name,
      items: cart,
      orderNumber: orderNumber,
      status: 'pending',
      isDelivery: isDelivery,
    };
    
    if (isDelivery) {
        orderData.customerPhone = customerPhone;
        orderData.deliveryFee = parsedDeliveryFee;
    }
    
    addOrder(orderData as Omit<Order, 'id' | 'createdAt' | 'localId'>);
    
    addTransaction({
      concept: `VENTA: ${name}`,
      amount: cartTotal,
      paymentMethod: payMethod,
      type: 'ingreso',
    });

    clearCart();
    setCheckoutOpen(false);
    setCustomerName('');
    setIsDelivery(false);
    setCustomerPhone('');
    setDeliveryFee('');
    toast({ title: '¡Comanda Enviada!' });
  };
  
  const CustomizeProductModal = () => {
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [notes, setNotes] = useState('');

    if (!productToCustomize) return null;

    const handleToppingToggle = (topping: Topping) => {
      setSelectedToppings(prev => 
        prev.find(t => t.id === topping.id) 
          ? prev.filter(t => t.id !== topping.id)
          : [...prev, topping]
      );
    };
    
    const calculatedPrice = productToCustomize.price + selectedToppings.reduce((sum, t) => sum + t.price, 0);

    const handleAddToCart = () => {
        addToCart(productToCustomize, { toppings: selectedToppings, notes });
        setCustomizeModalOpen(false);
        setProductToCustomize(null);
    };

    return (
        <Dialog open={isCustomizeModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setProductToCustomize(null);
            setCustomizeModalOpen(isOpen);
        }}>
            <DialogContent className="bg-card w-full max-w-lg rounded-3xl p-10 animate-pop">
                <DialogHeader>
                    <DialogTitle className="text-3xl tracking-tighter mb-4 text-center font-black">{productToCustomize.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    {toppings.length > 0 && (
                        <div>
                            <h4 className="font-bold mb-2">Añadir Toppings</h4>
                            <ScrollArea className="h-40 border rounded-2xl p-4">
                                <div className="space-y-3">
                                {toppings.map(topping => (
                                    <div key={topping.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                id={`topping-${topping.id}`}
                                                onCheckedChange={() => handleToppingToggle(topping)}
                                                checked={!!selectedToppings.find(t => t.id === topping.id)}
                                            />
                                            <Label htmlFor={`topping-${topping.id}`} className="font-semibold">{topping.name}</Label>
                                        </div>
                                        <span className="text-sm font-bold text-primary">+${topping.price}</span>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold mb-2">Notas para Cocina</h4>
                        <Textarea 
                            placeholder="Ej: sin cebolla, bien cocido..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="bg-slate-100 dark:bg-zinc-800"
                        />
                    </div>
                </div>
                <DialogFooter className="mt-8 sm:justify-between items-center">
                    <span className="text-2xl font-black">Total: ${calculatedPrice.toLocaleString('es-AR')}</span>
                    <Button onClick={handleAddToCart} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-lg shadow-xl font-black h-auto">
                        Añadir al Pedido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  };

  const CartComponent = () => (
    <div className="w-full lg:w-[400px] bg-card text-card-foreground rounded-3xl shadow-xl border flex flex-col overflow-hidden lg:h-full">
      <div className="p-8 bg-slate-100 dark:bg-zinc-800/50 border-b flex justify-between items-center">
        <h2 className="text-sm tracking-widest opacity-60 font-black">Tu Pedido</h2>
        <Button onClick={clearCart} variant="link" className="text-xs text-destructive underline font-black p-0 h-auto">Vaciar</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
          <div className="py-20 text-center opacity-20 text-xs font-black">Carrito Vacío</div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-slate-100 dark:bg-zinc-800 p-4 rounded-3xl animate-pop border">
              <div className="flex-1">
                <h4 className="text-sm leading-tight font-black">{item.product.name}</h4>
                {item.toppings.length > 0 && (
                  <p className="text-[10px] text-muted-foreground font-semibold">+ {item.toppings.map(t => t.name).join(', ')}</p>
                )}
                {item.notes && (
                  <p className="text-[10px] text-blue-600 font-semibold italic">Nota: {item.notes}</p>
                )}
                <span className="text-primary font-bold">${(item.finalPrice * item.qty).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center gap-3 bg-background px-3 py-1 rounded-xl border">
                <Button onClick={() => updateCartQty(item.id, -1)} variant="ghost" className="font-black px-2 text-destructive h-auto w-auto p-0 text-lg hover:bg-transparent">-</Button>
                <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                <Button onClick={() => updateCartQty(item.id, 1)} variant="ghost" className="font-black px-2 text-primary h-auto w-auto p-0 text-lg hover:bg-transparent">+</Button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-8 bg-card border-t space-y-6">
        <div className="flex justify-between items-end">
          <span className="text-[10px] opacity-40 font-black">Total</span>
          <span className="text-5xl tracking-tighter text-primary font-black">${cartTotal.toLocaleString('es-AR')}</span>
        </div>
        <Button onClick={() => cart.length > 0 ? setCheckoutOpen(true) : toast({ title: 'CARRITO VACÍO' })} className="w-full bg-primary text-primary-foreground py-6 rounded-3xl text-xl shadow-xl active:scale-95 transition-all font-black h-auto">
          Comandar
        </Button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <section id="tab-pos" className="flex flex-col lg:flex-row gap-8 h-full">
        <div className="flex-1 flex flex-col gap-6">
          <Input
            type="text"
            id="pos-search"
            placeholder="Buscar producto..."
            className="w-full p-5 rounded-3xl bg-card border-2 outline-none focus:border-primary transition-all font-black h-auto"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div id="pos-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => handleOpenCustomize(p)} className="product-card bg-card text-card-foreground p-6 rounded-3xl border flex flex-col items-center text-center cursor-pointer shadow-sm">
                <span className="text-4xl mb-3">{p.emoji}</span>
                <h3 className="text-sm leading-tight mb-2 font-black">{p.name}</h3>
                <p className="text-primary font-bold">${p.price.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
        {isMobile ? (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t lg:hidden z-30">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs opacity-60">{cartCount} items</span>
                    <span className="text-2xl font-black text-primary">${cartTotal.toLocaleString('es-AR')}</span>
                </div>
                <Button onClick={() => cart.length > 0 ? setCheckoutOpen(true) : toast({ title: 'CARRITO VACÍO' })} className="bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-lg shadow-xl active:scale-95 transition-all font-black h-auto">
                  Comandar
                </Button>
            </div>
          </div>
        ) : (
          <CartComponent />
        )}
      </section>
      
      <CustomizeProductModal />

      <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-card w-full max-w-md rounded-3xl p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-3xl tracking-tighter mb-8 text-center font-black">Confirmar Comanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 my-4 justify-center">
                <Switch id="delivery-mode" checked={isDelivery} onCheckedChange={setIsDelivery} />
                <Label htmlFor="delivery-mode" className="font-black text-sm">Es Delivery</Label>
            </div>
            {isDelivery && (
                <div className="space-y-3 animate-pop mb-4">
                    <Input id="check-phone" type="tel" placeholder="Número de Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
                    <Input id="check-delivery-fee" type="number" placeholder="Costo Envío" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
                </div>
            )}
            <Input id="check-name" type="text" placeholder="Nombre Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none font-black h-auto" />
            <div className="flex gap-2">
              <Button onClick={() => setPayMethod('Efectivo')} className={`flex-1 py-4 rounded-2xl border-2 font-black ${payMethod === 'Efectivo' ? 'bg-lime-100 border-primary' : 'bg-slate-100 dark:bg-zinc-800 border-transparent'}`}>💵 Efectivo</Button>
              <Button onClick={() => setPayMethod('Transferencia')} className={`flex-1 py-4 rounded-2xl border-2 font-black ${payMethod === 'Transferencia' ? 'bg-blue-100 border-blue-500' : 'bg-slate-100 dark:bg-zinc-800 border-transparent'}`}>📱 Transfe</Button>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setCheckoutOpen(false)} variant="ghost" className="w-full sm:w-auto order-last sm:order-first sm:flex-1 py-5 opacity-40 font-black">Atrás</Button>
              <Button onClick={handleConfirmSale} className="w-full sm:w-auto sm:flex-[2] bg-primary text-primary-foreground py-5 rounded-3xl text-xl shadow-xl font-black h-auto">Enviar a Cocina</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
