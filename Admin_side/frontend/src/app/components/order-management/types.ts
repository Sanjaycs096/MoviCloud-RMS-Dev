export interface Order {
  id: string;
  orderNumber?: string;
  tableNumber?: number;
  customerName?: string;
  waiterId?: string;
  waiterName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'placed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  type: 'dine-in' | 'takeaway' | 'delivery';
  createdAt: string;
  paymentMethod?: 'cash' | 'upi' | 'card';
  tags?: string[];
  statusUpdatedAt?: string;
  notes?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
}
