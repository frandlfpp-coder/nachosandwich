export type Topping = {
  id: string;
  userId: string;
  name: string;
  price: number;
  createdAt: any;
  updatedAt: any;
};

export type ProductCategory = 'Sandwich de Miga' | 'Lomitos' | 'Pebetes' | 'Barroluco' | 'Tostados' | 'Baguette';

export type Product = {
  id: string;
  userId: string;
  name: string;
  price: number;
  emoji?: string;
  category: ProductCategory;
  createdAt: any;
  updatedAt: any;
};

export type CartItem = {
  id: string; // Unique ID for this specific item configuration in the cart
  product?: Product;
  qty: number;
  toppings: Topping[];
  notes?: string;
  finalPrice: number; // The final price for one unit (product price + toppings price)
};

export type Order = {
  id:string;
  userId: string;
  customerName: string;
  items?: CartItem[];
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

// Type for the data payload when creating a new order
export type NewOrderPayload = Pick<Order, 
  'customerName' |
  'paymentMethod' | 
  'isDelivery'
> & {
  items: CartItem[];
} & Partial<Pick<Order, 'customerPhone' | 'deliveryFee'>>;


export type StockItem = {
  id: string;
  userId: string;
  name: string;
  unit: string;
  stock: number;
  createdAt: any;
  updatedAt: any;
};

export type Transaction = {
  id: string;
  userId: string;
  concept: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Transferencia';
  type: 'ingreso' | 'egreso';
  createdAt: any;
  closureId?: string;
};

export type Closure = {
  id: string;
  userId: string;
  closureDate: any;
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  balanceEfectivo: number;
  balanceTransferencia: number;
  totalTransacciones: number;
  totalDeliveryFees: number;
  orders?: Order[];
  transactions?: Transaction[];
};

export type RankedProduct = {
  id: string;
  name: string;
  emoji?: string;
  count: number;
};

export type RankedCustomer = {
  name: string;
  totalSpent: number;
  orderCount: number;
};
