'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Product, CartItem, Order, StockItem, Transaction, Closure, Topping, TopSale } from '@/lib/types';
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
  resetRankings: () => Promise<void>;
  topProducts: TopSale[];
  topCustomers: TopSale[];
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
      })).sort((a,b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
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
      .sort((a,b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }, [rawOrders]);
  
  const completedDeliveriesThisShift = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders
      .filter(o => o.isDelivery && (o.status === 'completed' || o.status === 'picked-up') && !o.closureId)
      .map(o => ({
        ...o,
        updatedAt: o.updatedAt?.toDate(),
      }))
      .sort((a,b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0));
  }, [rawOrders]);

  const transactionsQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'transactions') : null, [firestore, firebaseUser]);
  const { data: rawTransactions } = useCollection<Transaction>(transactionsQuery);
  
  const openTransactions = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions
      .filter(t => !t.closureId) // Filter for transactions not yet part of a closure
      .map(t => ({...t, createdAt: t.createdAt?.toDate()}))
      .sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }, [rawTransactions]);

  const closuresQuery = useMemoFirebase(() => firebaseUser ? collection(firestore, 'locals', firebaseUser.uid, 'closures') : null, [firestore, firebaseUser]);
  const { data: rawClosures } = useCollection<Closure>(closuresQuery);

  const closures = useMemo(() => {
    if (!rawClosures) return [];
    return rawClosures.map(c => ({...c, closureDate: c.closureDate?.toDate()})).sort((a,b) => (b.closureDate?.getTime() || 0) - (a.closureDate?.getTime() || 0));
  }, [rawClosures]);
  
  const { topProducts, topCustomers } = useMemo(() => {
    if (!rawOrders) return { topProducts: [], topCustomers: [] };

    const ordersForRanking = rawOrders.filter(o => !o.archivedForRanking);

    const productCounts: { [key: string]: { name: string, count: number, emoji?: string } } = {};
    const customerCounts: { [key: string]: { name: string, count: number } } = {};

    ordersForRanking.forEach(order => {
      // Count products
      order.items.forEach(item => {
        if (item.product) {
          const name = item.product.name;
          if (!productCounts[name]) {
            productCounts[name] = { name, count: 0, emoji: item.product.emoji };
          }
          productCounts[name].count += item.qty;
        }
      });

      // Count customers
      const customerName = order.customerName.trim();
      if (customerName && customerName !== 'SIN NOMBRE') {
        if (!customerCounts[customerName]) {
          customerCounts[customerName] = { name: customerName, count: 0 };
        }
        customerCounts[customerName].count += 1;
      }
    });

    const sortedProducts: TopSale[] = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    const sortedCustomers: TopSale[] = Object.values(customerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    return { topProducts: sortedProducts, topCustomers: sortedCustomers };
  }, [rawOrders]);


  // Cart logic
  const addToCart = (product: Product, options: {toppings: Topping[], notes?: string}) => {
    const sortedToppingIds = options.toppings.map(t => t.id).sort().join(',');
    const uniqueItemId = `${product.id}|${sortedToppingIds}|${(options.notes || '').trim()}`;

    const existingItem = cart.find(item => item.id === uniqueItemId);

    if (existingItem) {
        updateCartQty(uniqueItemId, 1);
    } else {
        const finalPrice = product.price + options.toppings.reduce((total, t) => total + t.price, 0);
        const newCartItem: CartItem = {
            id: uniqueItemId,
            product,
            qty: 1,
            toppings: options.toppings,
            notes: options.notes,
            finalPrice,
        };
        setCart(prevCart => [...prevCart, newCartItem]);
    }
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
      paymentMethod: orderData.paymentMethod || 'Efectivo',
    };
    
    if (orderData.isDelivery) {
        newOrder.customerPhone = orderData.customerPhone;
        newOrder.deliveryFee = orderData.deliveryFee;
    }
    
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'orders'), newOrder);
  };

  const completeOrder = (orderId: string) => {
    if (!firebaseUser || !rawOrders) return;
    
    const orderToComplete = rawOrders.find(o => o.id === orderId);

    if (!orderToComplete) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el pedido.' });
      return;
    }

    const orderTotal = orderToComplete.items.reduce((sum, item) => sum + item.finalPrice * item.qty, 0);
    
    // Create the income transaction
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'localId'> = {
      concept: `VENTA: ${orderToComplete.customerName}`,
      amount: orderTotal,
      paymentMethod: orderToComplete.paymentMethod || 'Efectivo',
      type: 'ingreso',
    };
    addTransaction(transactionData);

    // Update order status
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId), { status: 'completed', updatedAt: serverTimestamp() });
    toast({ title: "Pedido completado y listo para retirar" });
  };
  
  const pickupOrder = (orderId: string) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId), { status: 'picked-up', updatedAt: serverTimestamp() });
    toast({title: "Pedido marcado como retirado"});
  };

  const cancelOrder = (orderId: string) => {
    if (!firebaseUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'orders', orderId));
    toast({ title: 'Pedido Cancelado' });
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

  const deleteTransaction = (id: string) => {
    if (!firebaseUser) return;
    const transaction = (rawTransactions || []).find(t => t.id === id);
    if (transaction && transaction.concept.startsWith('VENTA:')) {
        toast({
            variant: "destructive",
            title: "Acción no permitida",
            description: "Las transacciones de venta no se pueden eliminar manualmente.",
        });
        return;
    }
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'transactions', id));
    toast({ title: 'Movimiento eliminado' });
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
    // Also remove any items from the cart that use this product
    setCart(prev => {
        const productInCart = prev.some(item => item.product.id === id);
        if (productInCart) {
            toast({ title: "Producto eliminado del carrito" });
        }
        return prev.filter(item => item.product.id !== id);
    });
  };
  
  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id' | 'localId' | 'createdAt'>>) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'products', id), { ...updates, updatedAt: serverTimestamp() });
    
    setCart(prev => {
        let cartUpdated = false;
        const newCart = prev.map(item => {
            if (item.product.id === id) {
                cartUpdated = true;
                const updatedProduct = { ...item.product, ...updates };
                const finalPrice = (updates.price ?? item.product.price) + item.toppings.reduce((total, t) => total + t.price, 0);
                return { ...item, product: updatedProduct, finalPrice };
            }
            return item;
        });

        if (cartUpdated) {
            toast({ title: "Producto actualizado", description: "Se actualizó el producto en tu carrito." });
        }
        return newCart;
    });
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
  
  const addTopping = (topping: Omit<Topping, 'id' | 'localId' | 'createdAt' | 'updatedAt'>) => {
    if (!firebaseUser) return;
    const newTopping = {
      ...topping,
      localId: firebaseUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    addDocumentNonBlocking(collection(firestore, 'locals', firebaseUser.uid, 'toppings'), newTopping);
  };

  const deleteTopping = (id: string) => {
    if (!firebaseUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'toppings', id));
     // Also remove any items from the cart that use this topping
    setCart(prev => {
        const cartHasTopping = prev.some(item => item.toppings.some(t => t.id === id));
        if (cartHasTopping) {
            toast({ title: "Topping eliminado", description: "Algunos productos fueron removidos de tu carrito." });
        }
        return prev.filter(item => !item.toppings.some(t => t.id === id));
    });
  };

  const updateTopping = (id: string, price: number) => {
    if (!firebaseUser) return;
    updateDocumentNonBlocking(doc(firestore, 'locals', firebaseUser.uid, 'toppings', id), { price, updatedAt: serverTimestamp() });
    // Also update cart items that use this topping
    setCart(prev => {
        let cartUpdated = false;
        const newCart = prev.map(item => {
            if (item.toppings.some(t => t.id === id)) {
                cartUpdated = true;
                const updatedToppings = item.toppings.map(t => t.id === id ? {...t, price} : t);
                const finalPrice = item.product.price + updatedToppings.reduce((total, t) => total + t.price, 0);
                return {...item, toppings: updatedToppings, finalPrice};
            }
            return item;
        });
        if (cartUpdated) {
            toast({ title: "Topping actualizado", description: "Se actualizó el precio en tu carrito." });
        }
        return newCart;
    });
  };

  const deleteAllLocalData = async () => {
    if (!firebaseUser || !firestore) {
        toast({ variant: "destructive", title: "No estás autenticado." });
        return;
    }

    setIsSwitchingLocal(true);
    toast({ title: "Borrando todos los datos, por favor espera..." });

    const localId = firebaseUser.uid;
    const collectionsToDelete = ['products', 'stockItems', 'orders', 'transactions', 'closures', 'toppings'];

    try {
        for (const collectionName of collectionsToDelete) {
            const collectionRef = collection(firestore, 'locals', localId, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) continue;

            for (let i = 0; i < snapshot.docs.length; i += 500) {
                const batch = writeBatch(firestore);
                const chunk = snapshot.docs.slice(i, i + 500);
                chunk.forEach(docSnapshot => {
                    batch.delete(docSnapshot.ref);
                });
                await batch.commit();
            }
        }
        toast({ title: "¡Todos los datos del local han sido borrados!" });
    } catch (error: any) {
        console.error("Error al borrar datos:", error);
        toast({ variant: "destructive", title: "Error al borrar los datos", description: error.message });
    } finally {
        setIsSwitchingLocal(false);
    }
  };

  const clearFinancialHistory = async () => {
    if (!firebaseUser || !firestore) {
        toast({ variant: 'destructive', title: 'No estás autenticado.' });
        return;
    }

    setIsSwitchingLocal(true);
    toast({ title: 'Borrando historial financiero, por favor espera...' });

    const localId = firebaseUser.uid;
    const collectionsToDelete = ['orders', 'transactions', 'closures'];

    try {
        for (const collectionName of collectionsToDelete) {
            const collectionRef = collection(firestore, 'locals', localId, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) continue;
            
            for (let i = 0; i < snapshot.docs.length; i += 500) {
                const batch = writeBatch(firestore);
                const chunk = snapshot.docs.slice(i, i + 500);
                chunk.forEach(docSnapshot => {
                    batch.delete(docSnapshot.ref);
                });
                await batch.commit();
            }
        }
        toast({ title: '¡Historial financiero borrado con éxito!' });
    } catch (error: any) {
        console.error('Error al borrar el historial financiero:', error);
        toast({ variant: 'destructive', title: 'Error al borrar el historial', description: error.message });
    } finally {
        setIsSwitchingLocal(false);
    }
  };

  const resetRankings = async () => {
    if (!firebaseUser || !firestore) {
        toast({ variant: 'destructive', title: 'No estás autenticado.' });
        return;
    }

    const ordersToArchive = (rawOrders || []).filter(o => !o.archivedForRanking);

    if (ordersToArchive.length === 0) {
        toast({ title: 'No hay pedidos en los rankings para reiniciar.' });
        return;
    }
    
    setIsSwitchingLocal(true); // show loading spinner
    toast({ title: 'Reiniciando rankings, por favor espera...' });

    const localId = firebaseUser.uid;
    
    try {
        const batch = writeBatch(firestore);
        ordersToArchive.forEach(order => {
            const orderRef = doc(firestore, 'locals', localId, 'orders', order.id);
            batch.update(orderRef, { archivedForRanking: true });
        });
        await batch.commit();
        toast({ title: '¡Rankings reiniciados con éxito!' });
    } catch (error: any) {
        console.error('Error al reiniciar los rankings:', error);
        toast({ variant: 'destructive', title: 'Error al reiniciar', description: error.message });
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
    cancelOrder,
    stockItems: stockItems || [],
    updateStock,
    transactions: openTransactions || [],
    closures: closures || [],
    addTransaction,
    deleteTransaction,
    closeDay,
    addProduct,
    deleteProduct,
    updateProduct,
    addStockItem,
    deleteStockItem,
    addTopping,
    deleteTopping,
    updateTopping,
    deleteAllLocalData,
    clearFinancialHistory,
    resetRankings,
    topProducts,
    topCustomers,
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
