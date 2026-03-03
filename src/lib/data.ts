import { Product, StockItem, Order, Transaction, Closure } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'HAMBURGUESA CLÁSICA', price: 1200, emoji: '🍔' },
  { id: '2', name: 'PAPAS FRITAS', price: 800, emoji: '🍟' },
  { id: '3', name: 'GASEOSA LÍNEA COCA', price: 500, emoji: '🥤' },
  { id: '4', name: 'AGUA MINERAL', price: 400, emoji: '💧' },
  { id: '5', name: 'SUPER PANCHO', price: 900, emoji: '🌭' },
  { id: '6', name: 'NUGGETS DE POLLO', price: 1000, emoji: '🍗' },
  { id: '7', name: 'HELADO', price: 600, emoji: '🍦' },
  { id: '8', name: 'CAFÉ', price: 450, emoji: '☕' },
];

export const MOCK_STOCK_ITEMS: StockItem[] = [
  { id: 's1', name: 'PAN DE HAMBURGUESA', unit: 'UNID', stock: 100 },
  { id: 's2', name: 'CARNE PICADA', unit: 'KG', stock: 20 },
  { id: 's3', name: 'PAPAS CONGELADAS', unit: 'KG', stock: 35 },
  { id: 's4', name: 'GASEOSA', unit: 'LITROS', stock: 50 },
  { id: 's5', name: 'SALCHICHAS', unit: 'PAQ', stock: 40 },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    name: 'JUAN PEREZ',
    caller: 23,
    items: [
      { id: '1', name: 'HAMBURGUESA CLÁSICA', price: 1200, emoji: '🍔', qty: 2 },
      { id: '2', name: 'PAPAS FRITAS', price: 800, emoji: '🍟', qty: 1 },
    ],
    createdAt: new Date(),
  },
  {
    id: 'o2',
    name: 'ANA GOMEZ',
    caller: 24,
    items: [{ id: '3', name: 'GASEOSA LÍNEA COCA', price: 500, emoji: '🥤', qty: 4 }],
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', concept: 'VENTA: CLIENTE MOSTRADOR', amount: 3200, paymentMethod: 'Efectivo', type: 'ingreso', createdAt: new Date() },
    { id: 't2', concept: 'PAGO PROVEEDOR', amount: 5000, paymentMethod: 'Efectivo', type: 'egreso', createdAt: new Date() },
    { id: 't3', concept: 'VENTA: PEDIDO APP', amount: 2400, paymentMethod: 'Transferencia', type: 'ingreso', createdAt: new Date() },
];


export const MOCK_CLOSURES: Closure[] = [
    { id: 'c1', date: new Date(Date.now() - 1000 * 60 * 60 * 24), cash: 25000, trans: 15000, total: 40000, count: 30 },
    { id: 'c2', date: new Date(Date.now() - 1000 * 60 * 60 * 48), cash: 22000, trans: 18000, total: 40000, count: 28 },
];
