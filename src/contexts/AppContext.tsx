'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Product, CartItem, Order, StockItem, Transaction, Closure } from '@/lib/types';
import { useFirebase, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, increment } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type AppUser = {
  local: string;
};

type AppContextType = {
  user: AppUser | null;
  logout: () => void;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'localId'>) => void,
  completeOrder: (orderId: string) => void;
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[];
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => void;
  closeDay: () => void;
  addProduct: (product: Omit<Product, 'id' | 'emoji' | 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteProduct: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'| 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteStockItem: (id: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { firestore, auth, user: firebaseUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [user, setUser] = useState<AppUser | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const localDocRef = useMemoFirebase(() => firebaseUser ? doc(firestore, 'locals', firebaseUser.uid) : null, [firestore, firebaseUser]);
  const { data: localData } = useDoc<{email: string}>(localDocRef);

  useEffect(() => {
    if (isUserLoading) return;
    if (!firebaseUser) {
      setUser(null);
      if (pathname !== '/') {
        router.push('/');
      }
    } else if (localData) {
      const localName = localData.email.split('@')[0];
      setUser({ local: localName });
    }
  }, [firebaseUser, isUserLoading, localData, pathname, router]);

  const logout = () => {
    signOut(auth).then(() => {
      router.push('/');
    });
  };

  // Data fetching
  const productsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'products') : null, [firestore, firebaseUser]);
  const { data: products } = useCollection<Product>(productsQuery);

  const stockItemsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'stockItems') : null, [firestore, firebaseUser]);
  const { data: stockItems } = useCollection<StockItem>(stockItemsQuery);
  
  const ordersQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'orders') : null, [firestore, firebaseUser]);
  const { data: rawOrders } = useCollection<Order>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders
      .filter(o => o.status === 'pending')
      .map(o => ({
        ...o,
        createdAt: o.createdAt?.toDate(),
      })).sort((a,b) => a.createdAt - b.createdAt);
  }, [rawOrders]);

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'transactions') : null, [firestore, firebaseUser]);
  const { data: rawTransactions } = useCollection<Transaction>(transactionsQuery);
  
  const transactions = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions.map(t => ({...t, createdAt: t.createdAt?.toDate()})).sort((a,b) => b.createdAt - a.createdAt);
  }, [rawTransactions]);

  const closuresQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'closures') : null, [firestore, firebaseUser]);
  const { data: rawClosures } = useCollection<Closure>(closuresQuery);

  const closures = useMemo(() => {
    if (!rawClosures) return [];
    return rawClosures.map(c => ({...c, closureDate: c.closureDate?.toDate()})).sort((a,b) => b.closureDate - a.closureDate);
  }, [rawClosures]);


  // Cart logic
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === productId);
      if (itemToUpdate && itemToUpdate.qty + delta > 0) {
        return prevCart.map(item =>
          item.id === productId ? { ...item, qty: item.qty + delta } : item
        );
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  const clearCart = () => setCart([]);
  
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Data mutations
  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'localId'>) => {
    if (!firebaseUser) return;
    const newOrder = {
      ...orderData,
      localId: firebaseUser.uid,
      createdAt: serverTimestamp(),
      status: 'pending',
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'orders'), newOrder);
  };

  const completeOrder = (orderId: string) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId), { status: 'completed' });
  };

  const updateStock = (itemId: string, delta: number) => {
    if (!firebaseUser) return;
    const item = stockItems?.find(i => i.id === itemId);
    if(item && item.stock + delta < 0) {
        toast({variant: 'destructive', title: 'Stock no puede ser negativo'});
        return;
    }
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'stockItems', itemId), { stock: increment(delta), updatedAt: serverTimestamp() });
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => {
    if (!firebaseUser) return;
    const newTransaction = {
        ...transaction,
        localId: firebaseUser.uid,
        createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'transactions'), newTransaction);
  };

  const closeDay = () => {
    if (!firebaseUser || transactions.length === 0) {
      toast({ title: 'No hay transacciones para cerrar.'});
      return;
    }
    const cashTotal = transactions.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
    const transferTotal = transactions.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
    const newClosure = {
        localId: firebaseUser.uid,
        closureDate: serverTimestamp(),
        cashTotal,
        transferTotal,
        netTotal: cashTotal + transferTotal,
        transactionCount: transactions.filter(t => t.type === 'ingreso').length,
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'closures'), newClosure);
    // Ideally, we'd mark transactions as part of a closure instead of assuming they all get wiped.
    // For this app, we will filter transactions on client side by day or other period.
    // We are not deleting transactions.
    toast({title: "Caja cerrada con éxito"});
  };

  const addProduct = (product: Omit<Product, 'id' | 'emoji' | 'localId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) return;
    const newProduct = {
      ...product,
      localId: firebaseUser.uid,
      emoji: '🍔', // Default emoji
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'products'), newProduct);
  };

  const deleteProduct = (id: string) => {
    if (!firebaseUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'products', id));
  };

  const addStockItem = (item: Omit<StockItem, 'id' | 'stock'|'localId'|'createdAt'|'updatedAt'>) => {
    if (!firebaseUser) return;
    const newStockItem = {
      ...item,
      localId: firebaseUser.uid,
      stock: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'stockItems'), newStockItem);
  };

  const deleteStockItem = (id: string) => {
    if (!firebaseUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'stockItems', id));
  };

  const value = {
    user,
    logout,
    products: products || [],
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    cartTotal,
    cartCount,
    orders: orders || [],
    addOrder,
    completeOrder,
    stockItems: stockItems || [],
    updateStock,
    transactions: transactions || [],
    closures: closures || [],
    addTransaction,
    closeDay,
    addProduct,
    deleteProduct,
    addStockItem,
    deleteStockItem,
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
