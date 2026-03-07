'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { Plus, Minus, X } from 'lucide-react';
import { Product, Order } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function DashboardPage() {
  const { products, cart, addToCart, updateCartQty, clearCart, cartTotal, cartCount, addTransaction, addOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [payMethod, setPayMethod] = useState<'Efectivo' | 'Transferencia'>('Efectivo');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [isDelivery, setIsDelivery] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');


  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast({ title: `LISTO: ${product.name}` });
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
    toast({ title: '¡Venta Exitosa!' });
  };

  const CartComponent = () => (
    <div className="w-full lg:w-[400px] bg-card text-card-foreground rounded-[3rem] shadow-xl border flex flex-col overflow-hidden lg:h-full">
      <div className="p-8 bg-slate-100 dark:bg-zinc-800/50 border-b flex justify-between items-center">
        <h2 className="text-sm tracking-widest opacity-60 font-black uppercase">Tu Pedido</h2>
        <Button onClick={clearCart} variant="link" className="text-xs text-destructive underline font-black p-0 h-auto uppercase">Vaciar</Button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cart.length === 0 ? (
          <div className="py-20 text-center opacity-20 text-xs font-black uppercase">Carrito Vacío</div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-slate-100 dark:bg-zinc-800 p-4 rounded-3xl animate-pop border">
              <div className="flex-1">
                <h4 className="text-[10px] leading-tight font-black uppercase">{item.name}</h4>
                <span className="text-primary font-bold">${(item.price * item.qty).toLocaleString('es-AR')}</span>
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
          <span className="text-[10px] opacity-40 font-black uppercase">Total</span>
          <span className="text-5xl tracking-tighter text-primary font-black">${cartTotal.toLocaleString('es-AR')}</span>
        </div>
        <Button onClick={() => cart.length > 0 ? setCheckoutOpen(true) : toast({ title: 'CARRITO VACÍO' })} className="w-full bg-primary text-primary-foreground py-6 rounded-3xl text-xl shadow-xl active:scale-95 transition-all font-black h-auto uppercase">
          Cobrar
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
            placeholder="BUSCAR PRODUCTO..."
            className="w-full p-5 rounded-3xl bg-card border-2 outline-none focus:border-primary transition-all uppercase font-black h-auto"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div id="pos-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => handleAddToCart(p)} className="product-card bg-card text-card-foreground p-6 rounded-[2.5rem] border flex flex-col items-center text-center cursor-pointer shadow-sm">
                <span className="text-4xl mb-3">{p.emoji}</span>
                <h3 className="text-[10px] leading-tight mb-2 font-black uppercase">{p.name}</h3>
                <p className="text-primary font-bold">${p.price.toLocaleString('es-AR')}</p>
              </div>
            ))}
          </div>
        </div>
        {isMobile ? (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-sm border-t lg:hidden z-30">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs opacity-60 uppercase">{cartCount} items</span>
                    <span className="text-2xl font-black text-primary">${cartTotal.toLocaleString('es-AR')}</span>
                </div>
                <Button onClick={() => cart.length > 0 ? setCheckoutOpen(true) : toast({ title: 'CARRITO VACÍO' })} className="bg-primary text-primary-foreground py-4 px-8 rounded-2xl text-lg shadow-xl active:scale-95 transition-all font-black h-auto uppercase">
                  Cobrar
                </Button>
            </div>
          </div>
        ) : (
          <CartComponent />
        )}
      </section>

      <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-card w-full max-w-md rounded-[3.5rem] p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-3xl tracking-tighter mb-8 text-center font-black uppercase">Terminar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 my-4 justify-center">
                <Switch id="delivery-mode" checked={isDelivery} onCheckedChange={setIsDelivery} />
                <Label htmlFor="delivery-mode" className="font-black text-sm uppercase">Es Delivery</Label>
            </div>
            {isDelivery && (
                <div className="space-y-3 animate-pop mb-4">
                    <Input id="check-phone" type="tel" placeholder="Número de Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black h-auto" />
                    <Input id="check-delivery-fee" type="number" placeholder="Costo Envío" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black h-auto" />
                </div>
            )}
            <Input id="check-name" type="text" placeholder="Nombre Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 outline-none uppercase font-black h-auto" />
            <div className="flex gap-2">
              <Button onClick={() => setPayMethod('Efectivo')} className={`flex-1 py-4 rounded-2xl border-2 font-black uppercase ${payMethod === 'Efectivo' ? 'bg-lime-100 border-primary' : 'bg-slate-100 dark:bg-zinc-800 border-transparent'}`}>💵 Efectivo</Button>
              <Button onClick={() => setPayMethod('Transferencia')} className={`flex-1 py-4 rounded-2xl border-2 font-black uppercase ${payMethod === 'Transferencia' ? 'bg-blue-100 border-blue-500' : 'bg-slate-100 dark:bg-zinc-800 border-transparent'}`}>📱 Transfe</Button>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setCheckoutOpen(false)} variant="ghost" className="w-full sm:w-auto order-last sm:order-first sm:flex-1 py-5 opacity-40 font-black uppercase">Atrás</Button>
              <Button onClick={handleConfirmSale} className="w-full sm:w-auto sm:flex-[2] bg-primary text-primary-foreground py-5 rounded-3xl text-xl shadow-xl font-black h-auto uppercase">Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
