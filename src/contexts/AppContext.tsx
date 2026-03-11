'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { Product, CartItem, Order, StockItem, Transaction, Closure, Topping, RankedProduct, RankedCustomer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Mock User type, since we are removing Firebase
export type MockUser = {
  uid: string;
  email: string;
};

type AppContextType = {
  user: MockUser | null;
  isUserLoading: boolean;
  logout: () => void;
  switchLocal: (local: 'nacho1' | 'nacho2' | 'prueba') => Promise<void>;
  isSwitchingLocal: boolean;
  products: Product[];
  toppings: Topping[];
  cart: CartItem[];
  addToCart: (product: Product, options: { toppings: Topping[], notes?: string }) => void;
  updateCartQty: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orders: Order[];
  completedOrders: Order[];
  completedDeliveriesThisShift: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'localId'>) => void,
  completeOrder: (orderId: string) => void;
  pickupOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[]; // Represents OPEN transactions for the current shift
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => void;
  deleteTransaction: (id: string) => void;
  closeDay: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'localId' | 'createdAt'>>) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'| 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteStockItem: (id: string) => void;
  addTopping: (topping: Omit<Topping, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteTopping: (id: string) => void;
  updateTopping: (id: string, price: number) => void;
  deleteAllLocalData: () => Promise<void>;
  clearFinancialHistory: () => Promise<void>;
  topProducts: RankedProduct[];
  topCustomers: RankedCustomer[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

const createInitialData = () => ({
  products: [
    { id: 'p1', localId: '', name: 'LOMITO COMPLETO', price: 5800, category: 'Lomitos', emoji: '🥩', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p2', localId: '', name: 'JAMON Y QUESO', price: 2000, category: 'Sandwich de Miga', emoji: '🥪', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p3', localId: '', name: 'SALAME Y QUESO', price: 2200, category: 'Sandwich de Miga', emoji: '🥪', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p4', localId: '', name: 'BARROLUCO', price: 6500, category: 'Barroluco', emoji: '🍔', createdAt: new Date(), updatedAt: new Date() },
    { id: 'p5', localId: '', name: 'PEBETE ESPECIAL', price: 3500, category: 'Pebetes', emoji: '🥖', createdAt: new Date(), updatedAt: new Date() },
  ] as Product[],
  toppings: [
    { id: 't1', localId: '', name: 'CHEDDAR', price: 500, createdAt: new Date(), updatedAt: new Date() },
    { id: 't2', localId: '', name: 'BACON', price: 700, createdAt: new Date(), updatedAt: new Date() },
    { id: 't3', localId: '', name: 'HUEVO FRITO', price: 400, createdAt: new Date(), updatedAt: new Date() },
  ] as Topping[],
  stockItems: [
    { id: 's1', localId: '', name: 'PAN DE LOMITO', unit: 'UNID', stock: 100, createdAt: new Date(), updatedAt: new Date() },
    { id: 's2', localId: '', name: 'CARNE LOMO', unit: 'KG', stock: 20, createdAt: new Date(), updatedAt: new Date() },
    { id: 's3', localId: '', name: 'PAPAS CONGELADAS', unit: 'KG', stock: 50, createdAt: new Date(), updatedAt: new Date() },
  ] as StockItem[],
  orders: [] as Order[],
  transactions: [] as Transaction[],
  closures: [] as Closure[],
});

type LocalData = ReturnType<typeof createInitialData>;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<MockUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isSwitchingLocal, setIsSwitchingLocal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [data, setData] = useState<Record<string, LocalData>>({
    nacho1: createInitialData(),
    nacho2: createInitialData(),
    prueba: createInitialData(),
  });

  useEffect(() => {
    setTimeout(() => setIsUserLoading(false), 500);
  }, []);

  const currentLocalData = user ? data[user.uid] : null;
  
  const setCurrentLocalData = (getNewData: (d: LocalData) => LocalData) => {
    if (user) {
      setData(prevData => ({ ...prevData, [user.uid]: getNewData(prevData[user.uid]) }));
    }
  };

  const switchLocal = async (local: 'nacho1' | 'nacho2' | 'prueba') => {
    if (user?.uid === local) return;
    setIsSwitchingLocal(true);
    setCart([]);
    // Simulate network delay
    setTimeout(() => {
      setUser({ uid: local, email: `${local}@local.com` });
      setIsSwitchingLocal(false);
      toast({ title: `Cambiado a ${local.toUpperCase()}` });
    }, 300);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  const products = currentLocalData?.products || [];
  const toppings = currentLocalData?.toppings || [];
  const stockItems = currentLocalData?.stockItems || [];
  const orders = currentLocalData?.orders.filter(o => o.status === 'pending').sort((a,b) => (new Date(a.createdAt).getTime() || 0) - (new Date(b.createdAt).getTime() || 0)) || [];
  const completedOrders = currentLocalData?.orders.filter(o => o.status === 'completed' && !o.closureId).sort((a, b) => (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0)) || [];
  const completedDeliveriesThisShift = currentLocalData?.orders.filter(o => o.isDelivery && (o.status === 'completed' || o.status === 'picked-up') && !o.closureId).sort((a,b) => (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0)) || [];
  const transactions = currentLocalData?.transactions.filter(t => !t.closureId).sort((a,b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)) || [];
  const closures = currentLocalData?.closures.sort((a,b) => (new Date(b.closureDate).getTime() || 0) - (new Date(a.closureDate).getTime() || 0)) || [];

  const { topProducts, topCustomers } = useMemo(() => {
    if (!currentLocalData) return { topProducts: [], topCustomers: [] };

    const allOrders = [...currentLocalData.orders, ...currentLocalData.closures.flatMap((c: any) => c.orders || [])];

    const productCounts: { [key: string]: { name: string; emoji?: string; count: number } } = {};
    const customerSpending: { [key: string]: { name: string; totalSpent: number; orderCount: number } } = {};

    allOrders.forEach(order => {
        if (order.status === 'completed' || order.status === 'picked-up') {
            const customerName = order.customerName.trim().toUpperCase();
            if (customerName !== 'SIN NOMBRE' && customerName.trim() !== '') {
                if (!customerSpending[customerName]) {
                    customerSpending[customerName] = { name: customerName, totalSpent: 0, orderCount: 0 };
                }
                const orderTotal = order.items.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
                customerSpending[customerName].totalSpent += orderTotal;
                customerSpending[customerName].orderCount += 1;
            }
            order.items.forEach(item => {
                if (item.product) {
                    if (!productCounts[item.product.id]) {
                        productCounts[item.product.id] = { name: item.product.name, emoji: item.product.emoji, count: 0 };
                    }
                    productCounts[item.product.id].count += item.qty;
                }
            });
        }
    });

    const sortedProducts: RankedProduct[] = Object.entries(productCounts).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.count - a.count).slice(0, 5);
    const sortedCustomers: RankedCustomer[] = Object.values(customerSpending).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return { topProducts: sortedProducts, topCustomers: sortedCustomers };
  }, [currentLocalData]);

  const addToCart = (product: Product, options: {toppings: Topping[], notes?: string}) => {
    const sortedToppingIds = options.toppings.map(t => t.id).sort().join(',');
    const uniqueItemId = `${product.id}|${sortedToppingIds}|${(options.notes || '').trim()}`;
    const existingItem = cart.find(item => item.id === uniqueItemId);

    if (existingItem) {
        updateCartQty(uniqueItemId, 1);
    } else {
        const finalPrice = product.price + options.toppings.reduce((total, t) => total + t.price, 0);
        const newCartItem: CartItem = {
            id: uniqueItemId, product, qty: 1, toppings: options.toppings, notes: options.notes, finalPrice,
        };
        setCart(prevCart => [...prevCart, newCartItem]);
    }
    toast({ title: `Añadido: ${product.name}` });
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === cartItemId);
      if (itemToUpdate && itemToUpdate.qty + delta > 0) {
        return prevCart.map(item => item.id === cartItemId ? { ...item, qty: item.qty + delta } : item);
      }
      return prevCart.filter(item => item.id !== cartItemId);
    });
  };

  const clearCart = () => setCart([]);
  
  const cartTotal = cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'localId'>) => {
    if (!user || !currentLocalData) return;
    const allHistoricalOrders = [...currentLocalData.orders, ...currentLocalData.closures.flatMap((c: any) => c.orders || [])];
    const lastOrderNumber = allHistoricalOrders.reduce((max, order) => order.orderNumber > max ? order.orderNumber : max, 0);
    const orderNumber = lastOrderNumber + 1;

    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}`,
      localId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      orderNumber,
    };
    setCurrentLocalData(d => ({ ...d, orders: [...d.orders, newOrder] }));
  };

  const completeOrder = (orderId: string) => {
    if (!user || !currentLocalData) return;
    const order = currentLocalData.orders.find(o => o.id === orderId);
    if (!order) return;

    const orderTotal = order.items.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
    addTransaction({
      concept: `VENTA: ${order.customerName}`,
      amount: orderTotal,
      paymentMethod: order.paymentMethod || 'Efectivo',
      type: 'ingreso',
    });

    setCurrentLocalData(d => ({
        ...d,
        orders: d.orders.map(o => o.id === orderId ? { ...o, status: 'completed', updatedAt: new Date() } : o)
    }));
    toast({ title: "Pedido completado y listo para retirar" });
  };
  
  const pickupOrder = (orderId: string) => {
    setCurrentLocalData(d => ({
        ...d,
        orders: d.orders.map(o => o.id === orderId ? { ...o, status: 'picked-up', updatedAt: new Date() } : o)
    }));
    toast({title: "Pedido marcado como retirado"});
  };

  const cancelOrder = (orderId: string) => {
    setCurrentLocalData(d => ({ ...d, orders: d.orders.filter(o => o.id !== orderId) }));
    toast({ title: 'Pedido Cancelado' });
  };

  const updateStock = (itemId: string, delta: number) => {
    if (!currentLocalData) return;
    const item = currentLocalData.stockItems.find(i => i.id === itemId);
    if(item && item.stock + delta < 0) {
        toast({variant: 'destructive', title: 'Stock no puede ser negativo'});
        return;
    }
    setCurrentLocalData(d => ({
        ...d,
        stockItems: d.stockItems.map(i => i.id === itemId ? { ...i, stock: i.stock + delta, updatedAt: new Date() } : i)
    }));
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => {
    if (!user) return;
    const newTransaction: Transaction = {
      ...transaction,
      id: `t${Date.now()}`,
      localId: user.uid,
      createdAt: new Date(),
    };
    setCurrentLocalData(d => ({ ...d, transactions: [newTransaction, ...d.transactions] }));
  };

  const deleteTransaction = (id: string) => {
    if (!currentLocalData) return;
    const transaction = currentLocalData.transactions.find(t => t.id === id);
    if (transaction && transaction.concept.startsWith('VENTA:')) {
        toast({ variant: "destructive", title: "Acción no permitida" });
        return;
    }
    setCurrentLocalData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
    toast({ title: 'Movimiento eliminado' });
  };

  const closeDay = async () => {
    if (!user || !currentLocalData) return;
    if (transactions.length === 0 && completedDeliveriesThisShift.length === 0) {
      toast({ title: 'No hay movimientos para cerrar.' });
      return;
    }
    
    const ordersToClose = currentLocalData.orders.filter(o => (o.status === 'completed' || o.status === 'picked-up') && !o.closureId);
    const transactionsToClose = currentLocalData.transactions.filter(t => !t.closureId);
    
    const closureId = `c${Date.now()}`;

    const totalDeliveryFees = ordersToClose.filter(o => o.isDelivery && o.deliveryFee).reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const totalIngresos = transactionsToClose.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalEgresos = transactionsToClose.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
    
    const newClosure: any = { // Using any to attach orders/transactions for mock purposes
      id: closureId,
      localId: user.uid,
      closureDate: new Date(),
      totalIngresos,
      totalEgresos,
      neto: totalIngresos - totalEgresos,
      balanceEfectivo: transactionsToClose.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0),
      balanceTransferencia: transactionsToClose.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0),
      totalTransacciones: transactionsToClose.length,
      totalDeliveryFees,
      orders: ordersToClose.map(o => ({...o, closureId})),
      transactions: transactionsToClose.map(t => ({...t, closureId})),
    };

    setCurrentLocalData(d => ({
      ...d,
      closures: [newClosure, ...d.closures],
      orders: d.orders.map(o => ordersToClose.find(co => co.id === o.id) ? { ...o, closureId } : o),
      transactions: d.transactions.map(t => transactionsToClose.find(ct => ct.id === t.id) ? { ...t, closureId } : t),
    }));
      
    toast({ title: "Caja cerrada con éxito" });
  };

  const addProduct = (product: Omit<Product, 'id'|'localId'|'createdAt'|'updatedAt'>) => {
    if (!user) return;
    const newProduct: Product = {
      ...product,
      id: `p${Date.now()}`,
      localId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentLocalData(d => ({ ...d, products: [...d.products, newProduct] }));
  };

  const deleteProduct = (id: string) => {
    setCurrentLocalData(d => ({ ...d, products: d.products.filter(p => p.id !== id) }));
  };
  
  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id' | 'localId' | 'createdAt'>>) => {
    setCurrentLocalData(d => ({
        ...d,
        products: d.products.map(p => p.id === id ? {...p, ...updates, updatedAt: new Date()} : p)
    }));
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'stock'|'localId'|'createdAt'|'updatedAt'>) => {
    if (!user) return;
    const newStockItem: StockItem = {
      ...item,
      id: `s${Date.now()}`,
      localId: user.uid,
      stock: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentLocalData(d => ({ ...d, stockItems: [...d.stockItems, newStockItem] }));
  };

  const deleteStockItem = (id: string) => {
    setCurrentLocalData(d => ({ ...d, stockItems: d.stockItems.filter(i => i.id !== id) }));
  };
  
  const addTopping = (topping: Omit<Topping, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    const newTopping: Topping = {
      ...topping,
      id: `t${Date.now()}`,
      localId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCurrentLocalData(d => ({ ...d, toppings: [...d.toppings, newTopping] }));
  };

  const deleteTopping = (id: string) => {
    setCurrentLocalData(d => ({ ...d, toppings: d.toppings.filter(t => t.id !== id) }));
  };

  const updateTopping = (id: string, price: number) => {
    setCurrentLocalData(d => ({
        ...d,
        toppings: d.toppings.map(t => t.id === id ? {...t, price, updatedAt: new Date()} : t)
    }));
  };

  const deleteAllLocalData = async () => {
    if (!user) return;
    setIsSwitchingLocal(true);
    setTimeout(() => {
        setCurrentLocalData(() => createInitialData());
        toast({ title: "¡Todos los datos del local han sido borrados!" });
        setIsSwitchingLocal(false);
    }, 500);
  };

  const clearFinancialHistory = async () => {
    if (!user) return;
    setIsSwitchingLocal(true);
    setTimeout(() => {
        setCurrentLocalData(d => ({ ...d, orders: [], transactions: [], closures: [] }));
        toast({ title: '¡Historial financiero borrado con éxito!' });
        setIsSwitchingLocal(false);
    }, 500);
  };

  const value: AppContextType = {
    user, isUserLoading, logout, switchLocal, isSwitchingLocal, products, toppings, cart, addToCart,
    updateCartQty, clearCart, cartTotal, cartCount, orders, completedOrders, completedDeliveriesThisShift,
    addOrder, completeOrder, pickupOrder, cancelOrder, stockItems, updateStock, transactions,
    closures, addTransaction, deleteTransaction, closeDay, addProduct, deleteProduct, updateProduct,
    addStockItem, deleteStockItem, addTopping, deleteTopping, updateTopping, deleteAllLocalData,
    clearFinancialHistory, topProducts, topCustomers,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
