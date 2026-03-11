'use client';

import { useState, useEffect } from 'react';
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
import { Product, Topping, ProductCategory, NewOrderPayload, CartItem } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const productCategories: ProductCategory[] = ['Sandwich de Miga', 'Lomitos', 'Pebetes', 'Barroluco', 'Tostados', 'Baguette'];

// Sub-component for Customizing a Product
const CustomizeProductModal = ({ 
  isOpen, 
  onOpenChange, 
  product, 
  toppings, 
  onAddToCart 
} : {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: Product | null;
  toppings: Topping[];
  onAddToCart: (product: Product, options: { toppings: Topping[], notes?: string }) => void;
}) => {
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [notes, setNotes] = useState('');

  // Reset state when modal opens for a new product
  useEffect(() => {
    if (isOpen) {
      setSelectedToppings([]);
      setNotes('');
    }
  }, [isOpen, product]);

  if (!product) return null;

  const handleToppingToggle = (topping: Topping) => {
    setSelectedToppings(prev => 
      prev.find(t => t.id === topping.id) 
        ? prev.filter(t => t.id !== topping.id)
        : [...prev, topping]
    );
  };
  
  const calculatedPrice = product.price + selectedToppings.reduce((sum, t) => sum + t.price, 0);

  const handleConfirmAddToCart = () => {
      onAddToCart(product, { toppings: selectedToppings, notes });
  };

  return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="bg-card w-full max-w-lg rounded-2xl p-10 animate-pop">
              <DialogHeader>
                  <DialogTitle className="text-3xl tracking-tighter mb-4 text-center font-black uppercase">{product.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                  {toppings.length > 0 && (
                      <div>
                          <h4 className="font-bold mb-2">Añadir Toppings</h4>
                          <ScrollArea className="h-40 border rounded-xl p-4">
                              <div className="space-y-3">
                              {toppings.map(topping => (
                                  <div key={topping.id} className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <Checkbox 
                                              id={`topping-${topping.id}`}
                                              onCheckedChange={() => handleToppingToggle(topping)}
                                              checked={!!selectedToppings.find(t => t.id === topping.id)}
                                          />
                                          <Label htmlFor={`topping-${topping.id}`} className="font-semibold uppercase">{topping.name}</Label>
                                      </div>
                                      <span className="text-sm font-bold text-primary">+${topping.price.toLocaleString('es-AR')}</span>
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
                          className="bg-secondary"
                      />
                  </div>
              </div>
              <DialogFooter className="mt-8 sm:justify-between items-center">
                  <span className="text-2xl font-black">Total: ${calculatedPrice.toLocaleString('es-AR')}</span>
                  <Button onClick={handleConfirmAddToCart} className="w-full sm:w-auto bg-primary text-primary-foreground py-4 px-8 rounded-xl text-lg shadow-xl font-black h-auto">
                      Añadir al Pedido
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
  );
};


// Sub-component for the Cart
const CartComponent = ({
  cart,
  onClearCart,
  onUpdateQty,
  cartTotal,
  onCheckout
} : {
  cart: CartItem[];
  onClearCart: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  cartTotal: number;
  onCheckout: () => void;
}) => (
  <div className="w-full lg:w-[400px] bg-card text-card-foreground rounded-2xl shadow-xl border flex flex-col overflow-hidden lg:h-full">
    <div className="p-6 bg-card border-b flex justify-between items-center">
      <h2 className="text-lg tracking-tight font-black">Tu Pedido</h2>
      <Button onClick={onClearCart} variant="link" className="text-xs text-destructive hover:underline font-black p-0 h-auto">Vaciar</Button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {cart.length === 0 ? (
        <div className="py-20 text-center opacity-40 text-xs font-black">Carrito Vacio</div>
      ) : (
        cart.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-secondary p-4 rounded-lg animate-pop">
            <div className="flex-1">
              <h4 className="text-sm leading-tight font-black uppercase">{item.product?.name}</h4>
              {item.toppings.length > 0 && (
                <p className="text-[10px] text-muted-foreground font-semibold">+ {item.toppings.map(t => t.name).join(', ')}</p>
              )}
              {item.notes && (
                <p className="text-[10px] text-destructive font-semibold italic">Nota: {item.notes}</p>
              )}
              <span className="text-primary font-bold">${(item.finalPrice * item.qty).toLocaleString('es-AR')}</span>
            </div>
            <div className="flex items-center gap-3 bg-background px-3 py-1 rounded-xl border">
              <Button onClick={() => onUpdateQty(item.id, -1)} variant="ghost" className="font-black px-2 text-destructive h-auto w-auto p-0 text-lg hover:bg-transparent">-</Button>
              <span className="text-xs font-black w-4 text-center">{item.qty}</span>
              <Button onClick={() => onUpdateQty(item.id, 1)} variant="ghost" className="font-black px-2 text-primary h-auto w-auto p-0 text-lg hover:bg-transparent">+</Button>
            </div>
          </div>
        ))
      )}
    </div>
    <div className="p-6 bg-card border-t space-y-6">
      <div className="flex justify-between items-center">
        <span className="text-sm opacity-60 font-black">Total</span>
        <span className="text-4xl tracking-tighter text-foreground font-black">${cartTotal.toLocaleString('es-AR')}</span>
      </div>
      <Button onClick={onCheckout} className="w-full bg-primary text-primary-foreground py-6 rounded-xl text-xl shadow-lg active:scale-95 transition-all font-black h-auto">
        Comandar
      </Button>
    </div>
  </div>
);

// Main Page Component
export default function DashboardPage() {
  const { products, toppings, cart, addToCart, updateCartQty, clearCart, cartTotal, cartCount, addOrder } = useApp();
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
  
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

  const filteredProducts = products.filter(p =>
    (activeCategory === 'all' || p.category === activeCategory) &&
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
    
    const orderData: NewOrderPayload = {
      customerName: name,
      items: cart,
      isDelivery: isDelivery,
      paymentMethod: payMethod,
    };
    
    if (isDelivery) {
        orderData.customerPhone = customerPhone;
        orderData.deliveryFee = parsedDeliveryFee;
    }
    
    addOrder(orderData);
    
    clearCart();
    setCheckoutOpen(false);
    setCustomerName('');
    setIsDelivery(false);
    setCustomerPhone('');
    setDeliveryFee('');
    toast({ title: '¡Comanda Enviada!' });
  };

  const handleAddToCartAndCloseModal = (product: Product, options: { toppings: Topping[], notes?: string }) => {
    addToCart(product, options);
    setCustomizeModalOpen(false);
    setProductToCustomize(null);
  }

  const handleCheckout = () => {
    if (cart.length > 0) {
      setCheckoutOpen(true);
    } else {
      toast({ title: 'CARRITO VACÍO' });
    }
  }

  return (
    <AppShell>
      <section id="tab-pos" className="flex flex-col lg:flex-row gap-8 h-full">
        <div className="flex-1 flex flex-col gap-6">
          <Input
            type="text"
            id="pos-search"
            placeholder="Buscar producto..."
            className="w-full p-5 rounded-lg bg-card border outline-none focus:ring-2 focus:ring-primary transition-all font-black h-auto text-base"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
           <Tabs defaultValue="all" onValueChange={(value) => setActiveCategory(value as ProductCategory | 'all')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto bg-transparent p-0 gap-2">
                <TabsTrigger value="all" className="py-2 text-xs font-bold rounded-md data-[state=active]:bg-secondary data-[state=active]:text-foreground">Todos</TabsTrigger>
                {productCategories.map(category => (
                    <TabsTrigger key={category} value={category} className="py-2 text-xs font-bold rounded-md data-[state=active]:bg-secondary data-[state=active]:text-foreground">{category}</TabsTrigger>
                ))}
            </TabsList>
          </Tabs>

          <div id="pos-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => handleOpenCustomize(p)} className="bg-card text-card-foreground p-4 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                <span className="text-4xl mb-3">{p.emoji || '🥪'}</span>
                <h3 className="text-sm leading-tight mb-2 font-black uppercase">{p.name}</h3>
                <p className="text-primary font-bold text-lg">${p.price.toLocaleString('es-AR')}</p>
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
                <Button onClick={handleCheckout} className="bg-primary text-primary-foreground py-4 px-8 rounded-xl text-lg shadow-xl active:scale-95 transition-all font-black h-auto">
                  Comandar
                </Button>
            </div>
          </div>
        ) : (
          <CartComponent 
            cart={cart}
            onClearCart={clearCart}
            onUpdateQty={updateCartQty}
            cartTotal={cartTotal}
            onCheckout={handleCheckout}
          />
        )}
      </section>
      
      <CustomizeProductModal 
        isOpen={isCustomizeModalOpen}
        onOpenChange={(isOpen) => {
          if(!isOpen) setProductToCustomize(null);
          setCustomizeModalOpen(isOpen)
        }}
        product={productToCustomize}
        toppings={toppings}
        onAddToCart={handleAddToCartAndCloseModal}
      />

      <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-card w-full max-w-md rounded-2xl p-10 animate-pop">
          <DialogHeader>
            <DialogTitle className="text-3xl tracking-tighter mb-8 text-center font-black uppercase">Confirmar Comanda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2 my-4 justify-center">
                <Switch id="delivery-mode" checked={isDelivery} onCheckedChange={setIsDelivery} />
                <Label htmlFor="delivery-mode" className="font-black text-sm">Es Delivery</Label>
            </div>
            {isDelivery && (
                <div className="space-y-3 animate-pop mb-4">
                    <Input id="check-phone" type="tel" placeholder="Número de Teléfono" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full p-5 rounded-xl bg-secondary outline-none font-black h-auto" />
                    <Input id="check-delivery-fee" type="number" placeholder="Costo Envío" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="w-full p-5 rounded-xl bg-secondary outline-none font-black h-auto" />
                </div>
            )}
            <Input id="check-name" type="text" placeholder="Nombre Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full p-5 rounded-xl bg-secondary outline-none font-black h-auto" />
            <div className="flex gap-2">
              <Button onClick={() => setPayMethod('Efectivo')} className={`flex-1 py-4 rounded-xl border-2 font-black ${payMethod === 'Efectivo' ? 'bg-primary/20 border-primary' : 'bg-secondary border-transparent'}`}>💵 Efectivo</Button>
              <Button onClick={() => setPayMethod('Transferencia')} className={`flex-1 py-4 rounded-xl border-2 font-black ${payMethod === 'Transferencia' ? 'bg-blue-500/20 border-blue-500' : 'bg-secondary border-transparent'}`}>📱 Transfe</Button>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => setCheckoutOpen(false)} variant="ghost" className="w-full sm:w-auto order-last sm:order-first sm:flex-1 py-5 opacity-40 font-black">Atrás</Button>
              <Button onClick={handleConfirmSale} className="w-full sm:w-auto sm:flex-[2] bg-primary text-primary-foreground py-5 rounded-xl text-xl shadow-xl font-black h-auto">Enviar a Cocina</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
