export type Product = {
  id: string;
  localId: string;
  name: string;
  price: number;
  emoji: string;
  createdAt: any;
  updatedAt: any;
};

export type CartItem = Product & {
  qty: number;
};

export type Order = {
  id:string;
  localId: string;
  customerName: string;
  items: CartItem[];
  createdAt: any;
  orderNumber: number;
  status: 'pending' | 'completed' | 'picked-up';
  updatedAt?: any;
  isDelivery: boolean;
  customerPhone?: string;
  deliveryFee?: number;
  closureId?: string;
};

export type StockItem = {
  id: string;
  localId: string;
  name: string;
  unit: string;
  stock: number;
  createdAt: any;
  updatedAt: any;
};

export type Transaction = {
  id: string;
  localId: string;
  concept: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Transferencia';
  type: 'ingreso' | 'egreso';
  createdAt: any;
  closureId?: string;
};

export type Closure = {
  id: string;
  localId: string;
  closureDate: any;
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  balanceEfectivo: number;
  balanceTransferencia: number;
  totalTransacciones: number;
};
