'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, Order, StockItem, Transaction, Closure, Topping } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, increment, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type AppContextType = {
  user: User | null;
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
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[]; // Represents OPEN transactions for the current shift
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'localId'>) => void;
  closeDay: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteProduct: (id: string) => void;
  updateProduct: (id: string, price: number) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'| 'localId' | 'createdAt' | 'updatedAt'>) => void;
  deleteStockItem: (id: string) => void;
  addTopping: (topping: Omit<Topping, 'id' | 'localId' | 'createdAt'>) => void;
  deleteTopping: (id: string) => void;
  resetData: () => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { firestore, auth, user: firebaseUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isSwitchingLocal, setIsSwitchingLocal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const switchLocal = async (local: 'nacho1' | 'nacho2' | 'prueba') => {
    if (!auth || !firestore) return;
    if (firebaseUser?.email?.startsWith(local)) return;

    setIsSwitchingLocal(true);

    const requiredPasswords: { [key: string]: string } = {
      nacho1: 'ignacio369',
      nacho2: 'ignacio369',
      prueba: 'ignacio369',
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
  
  const toppingsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'toppings') : null, [firestore, firebaseUser]);
  const { data: toppings } = useCollection<Topping>(toppingsQuery);

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
  
  const completedDeliveriesThisShift = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders
      .filter(o => o.isDelivery && o.status === 'completed' && !o.closureId)
      .map(o => ({
        ...o,
        updatedAt: o.updatedAt?.toDate(),
      }))
      .sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [rawOrders]);

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'transactions') : null, [firestore, firebaseUser]);
  const { data: rawTransactions } = useCollection<Transaction>(transactionsQuery);
  
  const openTransactions = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions
      .filter(t => !t.closureId) // Filter for transactions not yet part of a closure
      .map(t => ({...t, createdAt: t.createdAt?.toDate()}))
      .sort((a,b) => b.createdAt - a.createdAt);
  }, [rawTransactions]);

  const closuresQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'closures') : null, [firestore, firebaseUser]);
  const { data: rawClosures } = useCollection<Closure>(closuresQuery);

  const closures = useMemo(() => {
    if (!rawClosures) return [];
    return rawClosures.map(c => ({...c, closureDate: c.closureDate?.toDate()})).sort((a,b) => b.closureDate - a.closureDate);
  }, [rawClosures]);


  // Cart logic
  const addToCart = (product: Product, options: {toppings: Topping[], notes?: string}) => {
    const finalPrice = product.price + options.toppings.reduce((total, t) => total + t.price, 0);
    const newCartItem: CartItem = {
      id: `${Date.now()}-${Math.random()}`, // Simple unique ID
      product,
      qty: 1,
      toppings: options.toppings,
      notes: options.notes,
      finalPrice,
    };
    setCart(prevCart => [...prevCart, newCartItem]);
    toast({ title: `Añadido: ${product.name}` });
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    setCart(prevCart => {
      const itemToUpdate = prevCart.find(item => item.id === cartItemId);
      if (itemToUpdate && itemToUpdate.qty + delta > 0) {
        return prevCart.map(item =>
          item.id === cartItemId ? { ...item, qty: item.qty + delta } : item
        );
      }
      return prevCart.filter(item => item.id !== cartItemId);
    });
  };

  const clearCart = () => setCart([]);
  
  const cartTotal = cart.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
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

  const closeDay = async () => {
    if (!firebaseUser || !firestore) {
      toast({ variant: 'destructive', title: 'Error de autenticación' });
      return;
    }
    if (openTransactions.length === 0 && completedDeliveriesThisShift.length === 0) {
      toast({ title: 'No hay movimientos para cerrar.' });
      return;
    }
    if (!confirm('¿CERRAR JORNADA? Esto creará un reporte y reiniciará los movimientos actuales.')) {
      return;
    }

    const ordersToClose = (rawOrders || []).filter(
      o => (o.status === 'completed' || o.status === 'picked-up') && !o.closureId
    );
    
    const totalDeliveryFees = ordersToClose
      .filter(o => o.isDelivery && o.deliveryFee)
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    const totalIngresos = openTransactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amount, 0);
    const totalEgresos = openTransactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amount, 0);
    const neto = totalIngresos - totalEgresos;
    const balanceEfectivo = openTransactions.filter(t => t.paymentMethod === 'Efectivo').reduce((sum, t) => sum + (t.type === 'ingreso' ? t.amount : -t.amount), 0);
    const balanceTransferencia = openTransactions.filter(t => t.paymentMethod === 'Transferencia').reduce((sum, t) => sum + (t.type === 'ingreso' ? t.amount : -t.amount), 0);

    const newClosureData: Omit<Closure, 'id'> = {
      localId: firebaseUser.uid,
      closureDate: serverTimestamp(),
      totalIngresos,
      totalEgresos,
      neto,
      balanceEfectivo,
      balanceTransferencia,
      totalTransacciones: openTransactions.length,
      totalDeliveryFees,
    };

    try {
      const batch = writeBatch(firestore);
      const closureRef = doc(collection(firestore, 'locals', firebaseUser.uid, 'closures'));
      
      batch.set(closureRef, newClosureData);

      openTransactions.forEach(t => {
        const transRef = doc(firestore, 'locals', firebaseUser.uid, 'transactions', t.id);
        batch.update(transRef, { closureId: closureRef.id });
      });

      ordersToClose.forEach(o => {
        const orderRef = doc(firestore, 'locals', firebaseUser.uid, 'orders', o.id);
        batch.update(orderRef, { closureId: closureRef.id });
      });
      
      await batch.commit();
      
      toast({ title: "Caja cerrada con éxito" });
    } catch (error: any) {
      console.error("Error al cerrar la caja:", error);
      toast({ variant: "destructive", title: "Error al cerrar la caja", description: error.message });
    }
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
  
  const updateProduct = (id: string, price: number) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'products', id), { price, updatedAt: serverTimestamp() });
  }

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
  
  const addTopping = (topping: Omit<Topping, 'id' | 'localId' | 'createdAt'>) => {
    if (!firebaseUser) return;
    const newTopping = {
      ...topping,
      localId: firebaseUser.uid,
      createdAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'toppings'), newTopping);
  };

  const deleteTopping = (id: string) => {
    if (!firebaseUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'toppings', id));
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
    const collectionsToDelete = ['products', 'stockItems', 'orders', 'transactions', 'closures', 'toppings'];

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
    toppings: toppings || [],
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    cartTotal,
    cartCount,
    orders: orders || [],
    completedOrders: completedOrders || [],
    completedDeliveriesThisShift,
    addOrder,
    completeOrder,
    pickupOrder,
    stockItems: stockItems || [],
    updateStock,
    transactions: openTransactions || [],
    closures: closures || [],
    addTransaction,
    closeDay,
    addProduct,
    deleteProduct,
    updateProduct,
    addStockItem,
    deleteStockItem,
    addTopping,
    deleteTopping,
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
