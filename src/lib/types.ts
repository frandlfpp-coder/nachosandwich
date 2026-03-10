export type Topping = {
  id: string;
  localId: string;
  name: string;
  price: number;
  createdAt: any;
  updatedAt: any;
};

export type ProductCategory = 'Sandwich de Miga' | 'Lomitos' | 'Pebetes' | 'Barroluco' | 'Tostados' | 'Baguette';

export type Product = {
  id: string;
  localId: string;
  name: string;
  price: number;
  emoji?: string;
  category: ProductCategory;
  createdAt: any;
  updatedAt: any;
};

export type CartItem = {
  id: string; // Unique ID for this specific item configuration in the cart
  product: Product;
  qty: number;
  toppings: Topping[];
  notes?: string;
  finalPrice: number; // The final price for one unit (product price + toppings price)
};

export type Order = {
  id:string;
  localId: string;
  customerName: string;
  items: CartItem[];
  paymentMethod: 'Efectivo' | 'Transferencia';
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
  totalDeliveryFees: number;
};

export type TopSale = {
  name: string;
  count: number;
  emoji?: string;
};
