'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Product, CartItem, Order, StockItem, Transaction, Closure } from '@/lib/types';
import { MOCK_PRODUCTS, MOCK_ORDERS, MOCK_STOCK_ITEMS, MOCK_TRANSACTIONS, MOCK_CLOSURES } from '@/lib/data';

type User = {
  local: string;
};

type AppContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  products: Product[];
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  orders: Order[];
  completeOrder: (orderId: string) => void;
  stockItems: StockItem[];
  updateStock: (itemId: string, delta: number) => void;
  transactions: Transaction[];
  closures: Closure[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  closeDay: () => void;
  addProduct: (product: Omit<Product, 'id' | 'emoji'>) => void;
  deleteProduct: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id' | 'stock'>) => void;
  deleteStockItem: (id: string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [stockItems, setStockItems] = useState<StockItem[]>(MOCK_STOCK_ITEMS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [closures, setClosures] = useState<Closure[]>(MOCK_CLOSURES);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This is a simple auth guard.
    if (!user && pathname !== '/') {
      router.push('/');
    }
  }, [user, pathname, router]);


  const login = (user: User) => setUser(user);
  const logout = () => {
    setUser(null);
    router.push('/');
  };

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

  const completeOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  const updateStock = (itemId: string, delta: number) => {
    setStockItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, stock: Math.max(0, item.stock + delta) } : item
      )
    );
  };
  
  const addTransaction = (transaction: Omit<Transaction, 'id'|'createdAt'>) => {
    const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const closeDay = () => {
    const cash = transactions.filter(t => t.paymentMethod === 'Efectivo').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
    const trans = transactions.filter(t => t.paymentMethod === 'Transferencia').reduce((s,t)=>s+(t.type==='ingreso'?t.amount:-t.amount), 0);
    const newClosure: Closure = {
        id: Date.now().toString(),
        date: new Date(),
        cash,
        trans,
        total: cash + trans,
        count: transactions.filter(t => t.type === 'ingreso').length,
    };
    setClosures(prev => [newClosure, ...prev]);
    setTransactions([]);
  };

  const addProduct = (product: Omit<Product, 'id'|'emoji'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      emoji: '🍔' // Default emoji
    };
    setProducts(prev => [newProduct, ...prev]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addStockItem = (item: Omit<StockItem, 'id'|'stock'>) => {
    const newStockItem: StockItem = {
      ...item,
      id: Date.now().toString(),
      stock: 0
    };
    setStockItems(prev => [newStockItem, ...prev]);
  };

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(s => s.id !== id));
  };

  const value = {
    user,
    login,
    logout,
    products,
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    cartTotal,
    cartCount,
    orders,
    completeOrder,
    stockItems,
    updateStock,
    transactions,
    closures,
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
