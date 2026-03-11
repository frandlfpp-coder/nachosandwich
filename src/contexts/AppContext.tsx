'use client';

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Product, CartItem, Order, StockItem, Transaction, Closure, Topping, RankedProduct, RankedCustomer, NewOrderPayload } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useAuth, 
  useFirestore, 
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  commitBatchNonBlocking
} from '@/firebase';
import { collection, doc, serverTimestamp, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const APP_ID = 'nacho-plus-pos';

type AppContextType = {
  user: any | null; // Firebase User
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
  addOrder: (orderData: NewOrderPayload) => void,
  completeOrder: (orderId: string) => void;
  pickupOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[]; // Represents OPEN transactions for the current shift
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'closureId'>) => void;
  deleteTransaction: (id: string) => void;
  closeDay: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'| 'userId' | 'createdAt' | 'updatedAt'>) => void;
  deleteStockItem: (id: string) => void;
  addTopping: (topping: Omit<Topping, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  deleteTopping: (id: string) => void;
  updateTopping: (id: string, price: number) => void;
  deleteAllLocalData: () => Promise<void>;
  clearFinancialHistory: () => Promise<void>;
  topProducts: RankedProduct[];
  topCustomers: RankedCustomer[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [isSwitchingLocal, setIsSwitchingLocal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const userPath = (collectionName: string) => user ? `/artifacts/${APP_ID}/users/${user.uid}/${collectionName}` : null;

  const productsQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('products')!)) : null, [user, firestore]);
  const { data: products = [] } = useCollection<Product>(productsQuery);

  const toppingsQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('toppings')!)) : null, [user, firestore]);
  const { data: toppings = [] } = useCollection<Topping>(toppingsQuery);

  const stockItemsQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('stockItems')!)) : null, [user, firestore]);
  const { data: stockItems = [] } = useCollection<StockItem>(stockItemsQuery);

  const ordersQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('orders')!), where('status', '==', 'pending')) : null, [user, firestore]);
  const { data: ordersData = [] } = useCollection<Order>(ordersQuery);
  
  const completedOrdersQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('orders')!), where('status', '==', 'completed'), where('closureId', '==', null)) : null, [user, firestore]);
  const { data: completedOrdersData = [] } = useCollection<Order>(completedOrdersQuery);
  
  const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('transactions')!), where('closureId', '==', null)) : null, [user, firestore]);
  const { data: transactionsData = [] } = useCollection<Transaction>(transactionsQuery);

  const closuresQuery = useMemoFirebase(() => user ? query(collection(firestore, userPath('closures')!)) : null, [user, firestore]);
  const { data: closuresData = [] } = useCollection<Closure>(closuresQuery);

  const orders = useMemo(() => ordersData?.map(o => ({...o, createdAt: (o.createdAt as Timestamp)?.toDate(), updatedAt: (o.updatedAt as Timestamp)?.toDate() })) || [], [ordersData]);
  const completedOrders = useMemo(() => completedOrdersData?.map(o => ({...o, createdAt: (o.createdAt as Timestamp)?.toDate(), updatedAt: (o.updatedAt as Timestamp)?.toDate() })) || [], [completedOrdersData]);
  const transactions = useMemo(() => transactionsData?.map(t => ({...t, createdAt: (t.createdAt as Timestamp)?.toDate() })) || [], [transactionsData]);

  const closures = useMemo(() => {
    // Helper to safely convert different timestamp formats to a JS Date
    const toDateSafe = (value: any): Date | null => {
        if (!value) return null;
        if (value instanceof Timestamp) return value.toDate();
        if (value instanceof Date) return value;
        if (typeof value === 'object' && typeof value.seconds === 'number') {
            return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
        }
        return null;
    }

    return closuresData?.map(c => ({
        ...c,
        closureDate: toDateSafe(c.closureDate),
        orders: (c.orders || []).map(o => ({
            ...o,
            createdAt: toDateSafe(o.createdAt),
            updatedAt: toDateSafe(o.updatedAt),
        })),
        transactions: (c.transactions || []).map(t => ({
            ...t,
            createdAt: toDateSafe(t.createdAt),
        })),
    })) || [];
  }, [closuresData]);

  const { topProducts, topCustomers } = useMemo(() => {
    if (!closures) return { topProducts: [], topCustomers: [] };

    const productCounts: { [key: string]: { name: string; emoji?: string; count: number } } = {};
    const customerSpending: { [key: string]: { name: string; totalSpent: number; orderCount: number } } = {};

    closures.forEach((closure: Closure) => {
        (closure.orders || []).forEach((order: Order) => {
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
        })
    });

    const sortedProducts: RankedProduct[] = Object.entries(productCounts).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.count - a.count).slice(0, 5);
    const sortedCustomers: RankedCustomer[] = Object.values(customerSpending).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return { topProducts: sortedProducts, topCustomers: sortedCustomers };
  }, [closures]);
  
  const completedDeliveriesThisShift = useMemo(() => {
    return completedOrders
      .filter(o => o.isDelivery)
      .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }, [completedOrders]);

  const switchLocal = async (local: 'nacho1' | 'nacho2' | 'prueba') => {
    const email = `${local}@local.app`;
    if (user?.email === email) {
      return;
    }

    setIsSwitchingLocal(true);
    setCart([]);

    if (auth.currentUser) {
      await signOut(auth);
    }

    const password = 'password';

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: `Bienvenido. Cuenta creada para ${local.toUpperCase()}` });
    } catch (creationError: any) {
      if (creationError.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          toast({ title: `Sesión iniciada como ${local.toUpperCase()}` });
        } catch (signInError: any) {
          console.error('CRITICAL: Sign-in failed for existing user:', signInError);
          toast({
            variant: 'destructive',
            title: 'Error de Autenticación',
            description: 'La contraseña del local es incorrecta. No se puede iniciar sesión.',
          });
        }
      } else {
        console.error('Error creating user:', creationError);
        toast({
          variant: 'destructive',
          title: 'Error al Crear Cuenta',
          description: creationError.message,
        });
      }
    } finally {
      setIsSwitchingLocal(false);
    }
  };

  const logout = async () => {
    setCart([]);
    await signOut(auth);
  };
  
  const addOrder = (orderData: NewOrderPayload) => {
    if (!user || !firestore) return;
    
    const allHistoricalOrders = closures.flatMap(c => c.orders || []);
    const lastOrderNumber = allHistoricalOrders.reduce((max, order) => Math.max(max, order.orderNumber || 0), 0);
    const lastOpenOrderNumber = [...orders, ...completedOrders].reduce((max, order) => Math.max(max, order.orderNumber || 0), 0);

    const newOrder: Omit<Order, 'id'> = {
      ...orderData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending',
      orderNumber: Math.max(lastOrderNumber, lastOpenOrderNumber) + 1,
      closureId: null,
    };
    addDocumentNonBlocking(collection(firestore, userPath('orders')!), newOrder);
  };
  
  const completeOrder = (orderId: string) => {
    if (!user || !firestore) return;
    const order = [...orders, ...completedOrders].find(o => o.id === orderId);
    if (!order) return;

    const orderTotal = order.items.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
    addTransaction({
      concept: `VENTA: ${order.customerName}`,
      amount: orderTotal,
      paymentMethod: order.paymentMethod || 'Efectivo',
      type: 'ingreso',
    });

    const orderRef = doc(firestore, userPath('orders')!, orderId);
    updateDocumentNonBlocking(orderRef, { status: 'completed', updatedAt: serverTimestamp() });
    toast({ title: "Pedido completado y listo para retirar" });
  };
  
  const pickupOrder = (orderId: string) => {
    if (!user || !firestore) return;
    const orderRef = doc(firestore, userPath('orders')!, orderId);
    updateDocumentNonBlocking(orderRef, { status: 'picked-up', updatedAt: serverTimestamp() });
    toast({title: "Pedido marcado como retirado"});
  };

  const cancelOrder = (orderId: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, userPath('orders')!, orderId));
    toast({ title: 'Pedido Cancelado' });
  };
  
  const updateStock = (itemId: string, delta: number) => {
    if (!user || !firestore) return;
    const item = stockItems.find(i => i.id === itemId);
    if (!item) return;

    const newStock = item.stock + delta;
    if(newStock < 0) {
        toast({variant: 'destructive', title: 'Stock no puede ser negativo'});
        return;
    }
    const itemRef = doc(firestore, userPath('stockItems')!, itemId);
    updateDocumentNonBlocking(itemRef, { stock: newStock, updatedAt: serverTimestamp() });
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'userId' | 'closureId'>) => {
    if (!user || !firestore) return;
    const newTransaction = {
      ...transaction,
      userId: user.uid,
      createdAt: serverTimestamp(),
      closureId: null,
    };
    addDocumentNonBlocking(collection(firestore, userPath('transactions')!), newTransaction);
  };

  const deleteTransaction = (id: string) => {
    if (!user || !firestore) return;
    const transaction = transactions.find(t => t.id === id);
    if (transaction && transaction.concept.startsWith('VENTA:')) {
        toast({ variant: "destructive", title: "Acción no permitida" });
        return;
    }
    deleteDocumentNonBlocking(doc(firestore, userPath('transactions')!, id));
    toast({ title: 'Movimiento eliminado' });
  };

  const closeDay = async () => {
    if (!user || !firestore) return;
    
    const rawOrdersToClose = [...ordersData, ...completedOrdersData].filter(o => o.status === 'completed' || o.status === 'picked-up');
    const rawTransactionsToClose = transactionsData;

    if (rawTransactionsToClose.length === 0 && rawOrdersToClose.length === 0) {
      toast({ title: 'No hay movimientos para cerrar.' });
      return;
    }
    
    const batch = writeBatch(firestore);
    
    const totalDeliveryFees = rawOrdersToClose.filter(o => o.isDelivery && o.deliveryFee).reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
    const totalIngresos = rawTransactionsToClose.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalEgresos = rawTransactionsToClose.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);

    const newClosureDoc = {
      userId: user.uid,
      closureDate: serverTimestamp(),
      totalIngresos,
      totalEgresos,
      neto: totalIngresos - totalEgresos,
      balanceEfectivo: rawTransactionsToClose.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0),
      balanceTransferencia: rawTransactionsToClose.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0),
      totalTransacciones: rawTransactionsToClose.length,
      totalDeliveryFees,
      orders: rawOrdersToClose,
      transactions: rawTransactionsToClose,
    };
    
    const closureRef = doc(collection(firestore, userPath('closures')!));
    batch.set(closureRef, newClosureDoc);
    
    rawOrdersToClose.forEach(order => {
        const orderRef = doc(firestore, userPath('orders')!, order.id);
        batch.update(orderRef, { closureId: closureRef.id });
    });
    
    rawTransactionsToClose.forEach(transaction => {
        const transactionRef = doc(firestore, userPath('transactions')!, transaction.id);
        batch.update(transactionRef, { closureId: closureRef.id });
    });

    commitBatchNonBlocking(batch);
    toast({ title: "Caja cerrada con éxito" });
  };
  
  const addProduct = (product: Omit<Product, 'id'|'userId'|'createdAt'|'updatedAt'>) => {
    if (!user || !firestore) return;
    const newProduct = {
      ...product,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, userPath('products')!), newProduct);
  };
  
  const deleteProduct = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, userPath('products')!, id));
  };
  
  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>) => {
    if (!user || !firestore) return;
    const productRef = doc(firestore, userPath('products')!, id);
    updateDocumentNonBlocking(productRef, { ...updates, updatedAt: serverTimestamp() });
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'stock'|'userId'|'createdAt'|'updatedAt'>) => {
    if (!user || !firestore) return;
    const newStockItem = {
      ...item,
      userId: user.uid,
      stock: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, userPath('stockItems')!), newStockItem);
  };

  const deleteStockItem = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, userPath('stockItems')!, id));
  };
  
  const addTopping = (topping: Omit<Topping, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !firestore) return;
    const newTopping = {
      ...topping,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, userPath('toppings')!), newTopping);
  };

  const deleteTopping = (id: string) => {
    if (!user || !firestore) return;
    deleteDocumentNonBlocking(doc(firestore, userPath('toppings')!, id));
  };

  const updateTopping = (id: string, price: number) => {
    if (!user || !firestore) return;
    const toppingRef = doc(firestore, userPath('toppings')!, id);
    updateDocumentNonBlocking(toppingRef, { price: price, updatedAt: serverTimestamp() });
  };
  
  // NOTE: These functions are highly destructive and should be used with caution.
  // They are not implemented with Firestore for safety. They can be implemented
  // with a cloud function if this functionality is truly desired.
  const deleteAllLocalData = async () => {
    toast({ variant: 'destructive', title: "Función no implementada", description: "El borrado masivo debe hacerse desde la consola de Firebase." });
  };

  const clearFinancialHistory = async () => {
    toast({ variant: 'destructive', title: "Función no implementada", description: "El borrado masivo debe hacerse desde la consola de Firebase." });
  };
  
  const addToCart = (product: Product, options: { toppings: Topping[], notes?: string }) => {
    const calculatedPrice = product.price + options.toppings.reduce((sum, t) => sum + t.price, 0);
    
    // Create a unique ID based on product and toppings to group similar items
    const toppingIds = options.toppings.map(t => t.id).sort().join('-');
    const notesIdentifier = options.notes || '';
    const cartItemId = `${product.id}-${toppingIds}-${notesIdentifier}`;

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === cartItemId);
      if (existingItem) {
        return currentCart.map(item => 
          item.id === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          id: cartItemId,
          product: product,
          qty: 1,
          toppings: options.toppings,
          notes: options.notes,
          finalPrice: calculatedPrice
        };
        return [...currentCart, newItem];
      }
    });
    toast({ title: 'Añadido al pedido' });
  };
  
  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(currentCart => {
      const item = currentCart.find(i => i.id === cartItemId);
      if (!item) return currentCart;

      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return currentCart.filter(i => i.id !== cartItemId);
      } else {
        return currentCart.map(i => i.id === cartItemId ? { ...i, qty: newQty } : i);
      }
    });
  };
  
  const clearCart = () => setCart([]);

  const { cartTotal, cartCount } = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        acc.cartTotal += item.finalPrice * item.qty;
        acc.cartCount += item.qty;
        return acc;
      },
      { cartTotal: 0, cartCount: 0 }
    );
  }, [cart]);
  
  const value: AppContextType = {
    user, isUserLoading, logout, switchLocal, isSwitchingLocal, 
    products: products || [], 
    toppings: toppings || [], 
    cart, addToCart,
    updateCartQty, clearCart, cartTotal, cartCount, 
    orders, 
    completedOrders,
    completedDeliveriesThisShift,
    addOrder, completeOrder, pickupOrder, cancelOrder, 
    stockItems: stockItems || [], 
    updateStock, 
    transactions,
    closures, addTransaction, deleteTransaction, closeDay, addProduct, deleteProduct, updateProduct,
    addStockItem, deleteStockItem, addTopping, deleteTopping, updateTopping, deleteAllLocalData,
    clearFinancialHistory,
    topProducts, topCustomers,
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
