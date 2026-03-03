export type Product = {
  id: string;
  name: string;
  price: number;
  emoji: string;
};

export type CartItem = Product & {
  qty: number;
};

export type Order = {
  id: string;
  name: string;
  caller: number;
  items: CartItem[];
  createdAt: Date;
};

export type StockItem = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

export type Transaction = {
  id: string;
  concept: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Transferencia';
  type: 'ingreso' | 'egreso';
  createdAt: Date;
};

export type Closure = {
  id: string;
  date: Date;
  cash: number;
  trans: number;
  total: number;
  count: number;
};
