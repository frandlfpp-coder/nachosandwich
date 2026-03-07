'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, Order, StockItem, Transaction, Closure } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, increment, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type AppContextType = {
  user: User | null;
  isUserLoading: boolean;
  logout: () => void;
  switchLocal: (local: 'nacho1' | 'nacho2') => Promise<void>;
  isSwitchingLocal: boolean;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orders: Order[];
  completedOrders: Order[];
  addOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'localId'>) => void,
  completeOrder: (orderId: string) => void;
  pickupOrder: (orderId: string) => void;
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[];
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => void;
  closeDay: () => void;
  addProduct: (product: Omit<Product, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteProduct: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'| 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteStockItem: (id: string) => void;
  resetData: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { firestore, auth, user: firebaseUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isSwitchingLocal, setIsSwitchingLocal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const switchLocal = async (local: 'nacho1' | 'nacho2') => {
    if (!auth || !firestore) return;
    if (firebaseUser?.email?.startsWith(local)) return;

    setIsSwitchingLocal(true);

    const requiredPasswords: { [key: string]: string } = {
      nacho1: 'ignacio369',
      nacho2: 'ignacio369',
    };
    const password = requiredPasswords[local];
    const email = `${local}@local.com`;

    try {
      await signOut(auth);
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: `Cambiado a ${local.toUpperCase()}` });
    } catch (signInError: any) {
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password') {
        try {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(firestore, 'locals', newUser.uid), {
              id: newUser.uid,
              email: email,
              createdAt: serverTimestamp(),
          });
          toast({ title: `¡Bienvenido a ${local.toUpperCase()}!`, description: 'Hemos creado una nueva cuenta para tu local.' });
        } catch (signUpError: any) {
            toast({ variant: "destructive", title: 'Error al Registrar', description: signUpError.message });
        }
      } else {
        toast({ variant: "destructive", title: 'Error de Autenticación', description: signInError.message });
      }
    } finally {
        setIsSwitchingLocal(false);
    }
  };
  
  const logout = () => {
    signOut(auth);
  };

  useEffect(() => {
    if (!firebaseUser) {
        clearCart();
    }
  }, [firebaseUser])

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
      })).sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
  }, [rawOrders]);

  const completedOrders = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders
      .filter(o => o.status === 'completed')
      .map(o => ({
        ...o,
        updatedAt: o.updatedAt?.toDate(),
        createdAt: o.createdAt?.toDate(),
      }))
      .sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
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
    const newOrder: any = {
      localId: firebaseUser.uid,
      createdAt: serverTimestamp(),
      status: 'pending',
      customerName: orderData.customerName,
      items: orderData.items,
      orderNumber: orderData.orderNumber,
      isDelivery: orderData.isDelivery,
    };

    if (orderData.isDelivery) {
        newOrder.customerPhone = orderData.customerPhone;
        newOrder.deliveryFee = orderData.deliveryFee;
    }

    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'orders'), newOrder);
  };

  const completeOrder = (orderId: string) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId), { status: 'completed', updatedAt: serverTimestamp() });
  };
  
  const pickupOrder = (orderId: string) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId), { status: 'picked-up', updatedAt: serverTimestamp() });
    toast({title: "Pedido marcado como retirado"});
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

  const addProduct = (product: Omit<Product, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) return;
    const newProduct = {
      ...product,
      localId: firebaseUser.uid,
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

  const resetData = async () => {
    if (!firebaseUser || !firestore) {
        toast({ variant: "destructive", title: "No estás autenticado." });
        return;
    }

    if (!confirm("¿ESTÁS SEGURO? Esta acción borrará TODOS los productos, insumos, pedidos, transacciones y cierres del local actual. Esta acción no se puede deshacer.")) {
        return;
    }

    setIsSwitchingLocal(true); // Reuse loading state to show a spinner
    toast({ title: "Borrando datos, por favor espera..." });

    const localId = firebaseUser.uid;
    const collectionsToDelete = ['products', 'stockItems', 'orders', 'transactions', 'closures'];

    try {
        for (const collectionName of collectionsToDelete) {
            const collectionRef = collection(firestore, 'locals', localId, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) continue;

            const batch = writeBatch(firestore);
            snapshot.docs.forEach(docSnapshot => {
                batch.delete(docSnapshot.ref);
            });
            await batch.commit();
        }
        toast({ title: "¡Datos de prueba borrados con éxito!" });
    } catch (error: any) {
        console.error("Error al borrar datos:", error);
        toast({ variant: "destructive", title: "Error al borrar los datos", description: error.message });
    } finally {
        setIsSwitchingLocal(false);
    }
  };

  const value = {
    user: firebaseUser,
    isUserLoading,
    logout,
    switchLocal,
    isSwitchingLocal,
    products: products || [],
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    cartTotal,
    cartCount,
    orders: orders || [],
    completedOrders: completedOrders || [],
    addOrder,
    completeOrder,
    pickupOrder,
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
    resetData,
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
