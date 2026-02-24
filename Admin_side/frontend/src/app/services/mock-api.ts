// Mock API Service for local development without Supabase backend

export interface MockOrder {
  id: string;
  displayId: string;
  customerName: string;
  tableNumber?: string;
  tableId?: string;
  type: 'dine-in' | 'takeaway' | 'delivery';
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'completed' | 'cancelled';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
    station?: 'FRY' | 'CURRY' | 'GRILL' | 'COLD' | 'BEVERAGE';
    completed?: boolean;
  }>;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  customerNotes?: string;
  priority?: 'high' | 'normal' | 'low';
  waiterId?: string;
  waiterName?: string;
}

export interface MockMenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  image?: string;
}

export interface MockTable {
  id: string;
  displayNumber: string;
  capacity: 2 | 4 | 6;
  location: 'VIP' | 'Main Hall' | 'AC Hall';
  segment: 'Front' | 'Middle' | 'Back';
  status: 'Available' | 'Reserved' | 'Occupied' | 'Eating' | 'Cleaning';
  reservationType: 'None' | 'Web' | 'Phone' | 'Walk-in';
  reservationStatus?: 'Upcoming' | 'Active' | 'Cancelled' | 'Expired' | null;
  guestCount: number;
  waiterName: string | null;
  waiterId: string | null;
  statusStartTime: number | null;
  currentOrderId: string | null;
  kitchenStatus: 'Idle' | 'Cooking' | 'Ready' | 'Served';
  reservationSlot?: string | null;
  cleaningEndTime?: number | null;
}

export interface MockWaiter {
  id: string;
  name: string;
  assignedTableId: string | null;
}

export interface MockInvoice {
  id: string;
  orderId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountType: 'flat' | 'percent';
  discountValue: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI';
  createdAt: string;
}

// Mock Orders Data
let mockOrders: MockOrder[] = [
  {
    id: 'order:1',
    displayId: 'ORD-001',
    customerName: 'John Doe',
    tableNumber: 'M2',
    tableId: 'table:5',
    type: 'dine-in',
    status: 'preparing',
    items: [
      { id: '1', name: 'Butter Chicken', quantity: 2, price: 360 },
      { id: '2', name: 'Naan', quantity: 4, price: 40 },
      { id: '3', name: 'Mango Lassi', quantity: 2, price: 100 },
    ],
    totalAmount: 980,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    paymentStatus: 'pending',
    priority: 'high',
  },
  {
    id: 'order:2',
    displayId: 'ORD-002',
    customerName: 'Sarah Smith',
    tableNumber: 'V2',
    tableId: 'table:2',
    type: 'dine-in',
    status: 'placed',
    items: [
      { id: '4', name: 'Paneer Tikka', quantity: 1, price: 250 },
      { id: '5', name: 'Dal Makhani', quantity: 1, price: 280 },
      { id: '6', name: 'Filter Coffee', quantity: 2, price: 60 },
    ],
    totalAmount: 650,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    paymentStatus: 'pending',
    customerNotes: 'Extra spicy please',
    priority: 'normal',
  },
  {
    id: 'order:3',
    displayId: 'ORD-003',
    customerName: 'Mike Johnson',
    type: 'takeaway',
    status: 'ready',
    items: [
      { id: '7', name: 'Margherita Pizza', quantity: 1, price: 340 },
      { id: '8', name: 'Garlic Bread', quantity: 1, price: 120 },
    ],
    totalAmount: 460,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    paymentStatus: 'paid',
    priority: 'normal',
  },
  {
    id: 'order:4',
    displayId: 'ORD-004',
    customerName: 'Emily Brown',
    tableNumber: 'M5',
    tableId: 'table:8',
    type: 'dine-in',
    status: 'completed',
    items: [
      { id: '9', name: 'Chicken Tikka', quantity: 1, price: 320 },
      { id: '10', name: 'Veg Hakka Noodles', quantity: 1, price: 210 },
      { id: '11', name: 'Gulab Jamun', quantity: 2, price: 80 },
    ],
    totalAmount: 690,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    paymentStatus: 'paid',
    priority: 'normal',
  },
];

// Mock Menu Items Data
const mockMenuItems: MockMenuItem[] = [
  { id: '1', name: 'Butter Chicken', category: 'main-course', price: 360, description: 'Chicken in rich tomato cream', available: true },
  { id: '2', name: 'Paneer Tikka', category: 'starters', price: 250, description: 'Cottage cheese cubes marinated', available: true },
  { id: '3', name: 'Dal Makhani', category: 'main-course', price: 280, description: 'Rich black lentils', available: true },
  { id: '4', name: 'Naan', category: 'breads', price: 40, description: 'Indian flatbread', available: true },
  { id: '5', name: 'Margherita Pizza', category: 'main-course', price: 340, description: 'Classic tomato and mozzarella', available: true },
  { id: '6', name: 'Filter Coffee', category: 'beverages', price: 60, description: 'Freshly brewed', available: true },
  { id: '7', name: 'Mango Lassi', category: 'beverages', price: 100, description: 'Creamy mango yogurt', available: true },
  { id: '8', name: 'Gulab Jamun', category: 'desserts', price: 80, description: 'Soft milk solid', available: true },
  { id: '9', name: 'Chicken Tikka', category: 'starters', price: 320, description: 'Marinated grilled chicken', available: true },
  { id: '10', name: 'Veg Hakka Noodles', category: 'main-course', price: 210, description: 'Stir-fried noodles', available: true },
];

// Mock Tables Data
let mockTables: MockTable[] = [
  // VIP Section
  {
    id: 'table:1',
    displayNumber: 'V1',
    capacity: 4,
    location: 'VIP',
    segment: 'Front',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:2',
    displayNumber: 'V2',
    capacity: 6,
    location: 'VIP',
    segment: 'Front',
    status: 'Reserved',
    reservationType: 'Web',
    reservationStatus: 'Upcoming',
    guestCount: 4,
    waiterName: null,
    waiterId: null,
    statusStartTime: Date.now(),
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: '7:00 PM - 8:20 PM',
    cleaningEndTime: null,
  },
  {
    id: 'table:3',
    displayNumber: 'V3',
    capacity: 4,
    location: 'VIP',
    segment: 'Back',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  
  // Main Hall Section
  {
    id: 'table:4',
    displayNumber: 'M1',
    capacity: 2,
    location: 'Main Hall',
    segment: 'Front',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:5',
    displayNumber: 'M2',
    capacity: 2,
    location: 'Main Hall',
    segment: 'Front',
    status: 'Occupied',
    reservationType: 'Walk-in',
    reservationStatus: 'Active',
    guestCount: 2,
    waiterName: 'Rahul Sharma',
    waiterId: 'waiter:1',
    statusStartTime: Date.now() - 600000, // 10 mins ago
    currentOrderId: 'order:1',
    kitchenStatus: 'Cooking',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:6',
    displayNumber: 'M3',
    capacity: 4,
    location: 'Main Hall',
    segment: 'Front',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:7',
    displayNumber: 'M4',
    capacity: 4,
    location: 'Main Hall',
    segment: 'Middle',
    status: 'Eating',
    reservationType: 'Phone',
    reservationStatus: 'Active',
    guestCount: 3,
    waiterName: 'Priya Singh',
    waiterId: 'waiter:2',
    statusStartTime: Date.now() - 900000, // 15 mins ago
    currentOrderId: 'order:2',
    kitchenStatus: 'Ready',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:8',
    displayNumber: 'M5',
    capacity: 6,
    location: 'Main Hall',
    segment: 'Middle',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:9',
    displayNumber: 'M6',
    capacity: 2,
    location: 'Main Hall',
    segment: 'Back',
    status: 'Cleaning',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: Date.now(),
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: Date.now() + 300000, // 5 minutes from now
  },
  {
    id: 'table:10',
    displayNumber: 'M7',
    capacity: 4,
    location: 'Main Hall',
    segment: 'Back',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  
  // AC Hall Section
  {
    id: 'table:11',
    displayNumber: 'A1',
    capacity: 4,
    location: 'AC Hall',
    segment: 'Front',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:12',
    displayNumber: 'A2',
    capacity: 4,
    location: 'AC Hall',
    segment: 'Front',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:13',
    displayNumber: 'A3',
    capacity: 6,
    location: 'AC Hall',
    segment: 'Middle',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
  {
    id: 'table:14',
    displayNumber: 'A4',
    capacity: 2,
    location: 'AC Hall',
    segment: 'Middle',
    status: 'Available',
    reservationType: 'None',
    reservationStatus: null,
    guestCount: 0,
    waiterName: null,
    waiterId: null,
    statusStartTime: null,
    currentOrderId: null,
    kitchenStatus: 'Idle',
    reservationSlot: null,
    cleaningEndTime: null,
  },
];

// Mock Waiters Data
const mockWaiters: MockWaiter[] = [
  { id: 'waiter:1', name: 'Rahul Sharma', assignedTableId: 'table:5' },
  { id: 'waiter:2', name: 'Priya Singh', assignedTableId: 'table:7' },
  { id: 'waiter:3', name: 'Amit Kumar', assignedTableId: null },
  { id: 'waiter:4', name: 'Sneha Patel', assignedTableId: null },
  { id: 'waiter:5', name: 'Vijay Reddy', assignedTableId: null },
];

// Mock Invoices Data
const mockInvoices: MockInvoice[] = [
  {
    id: 'invoice:1',
    orderId: 'order:1',
    tableId: 'table:1',
    tableNumber: 'T1',
    customerName: 'John Doe',
    items: [
      { name: 'Butter Chicken', quantity: 2, price: 360 },
      { name: 'Naan', quantity: 4, price: 40 },
      { name: 'Mango Lassi', quantity: 2, price: 100 },
    ],
    subtotal: 980,
    taxPercent: 10,
    taxAmount: 98,
    discountType: 'percent',
    discountValue: 5,
    discountAmount: 49,
    grandTotal: 1029,
    paymentMethod: 'Card',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'invoice:2',
    orderId: 'order:2',
    tableId: 'table:2',
    tableNumber: 'T2',
    customerName: 'Sarah Smith',
    items: [
      { name: 'Paneer Tikka', quantity: 1, price: 250 },
      { name: 'Dal Makhani', quantity: 1, price: 280 },
      { name: 'Filter Coffee', quantity: 2, price: 60 },
    ],
    subtotal: 650,
    taxPercent: 10,
    taxAmount: 65,
    discountType: 'flat',
    discountValue: 20,
    discountAmount: 20,
    grandTotal: 700,
    paymentMethod: 'Cash',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'invoice:3',
    orderId: 'order:3',
    tableId: 'table:3',
    tableNumber: 'T3',
    customerName: 'Mike Johnson',
    items: [
      { name: 'Margherita Pizza', quantity: 1, price: 340 },
      { name: 'Garlic Bread', quantity: 1, price: 120 },
    ],
    subtotal: 460,
    taxPercent: 10,
    taxAmount: 46,
    discountType: 'percent',
    discountValue: 10,
    discountAmount: 46,
    grandTotal: 460,
    paymentMethod: 'UPI',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'invoice:4',
    orderId: 'order:4',
    tableId: 'table:4',
    tableNumber: 'T4',
    customerName: 'Emily Brown',
    items: [
      { name: 'Chicken Tikka', quantity: 1, price: 320 },
      { name: 'Veg Hakka Noodles', quantity: 1, price: 210 },
      { name: 'Gulab Jamun', quantity: 2, price: 80 },
    ],
    subtotal: 690,
    taxPercent: 10,
    taxAmount: 69,
    discountType: 'flat',
    discountValue: 30,
    discountAmount: 30,
    grandTotal: 729,
    paymentMethod: 'Card',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  // Get all orders
  getOrders: async (): Promise<{ success: boolean; data: MockOrder[] }> => {
    await delay();
    return { success: true, data: [...mockOrders] };
  },

  // Get single order
  getOrder: async (orderId: string): Promise<{ success: boolean; data: MockOrder | null }> => {
    await delay();
    const order = mockOrders.find(o => o.id === orderId || o.id === `order:${orderId}`);
    return { success: true, data: order || null };
  },

  // Create new order
  createOrder: async (orderData: Partial<MockOrder>): Promise<{ success: boolean; data: MockOrder }> => {
    await delay();
    
    const newOrder: MockOrder = {
      id: `order:${Date.now()}`,
      displayId: `ORD-${String(mockOrders.length + 1).padStart(3, '0')}`,
      customerName: orderData.customerName || 'Guest',
      tableNumber: orderData.tableNumber,
      type: orderData.type || 'dine-in',
      status: 'placed',
      items: orderData.items || [],
      totalAmount: orderData.totalAmount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'pending',
      customerNotes: orderData.customerNotes,
      priority: orderData.priority || 'normal',
    };

    mockOrders.unshift(newOrder);
    return { success: true, data: newOrder };
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: MockOrder['status']): Promise<{ success: boolean; data: MockOrder }> => {
    await delay();
    
    const cleanId = orderId.replace('order:', '');
    const orderIndex = mockOrders.findIndex(o => o.id === `order:${cleanId}` || o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockOrders[orderIndex] };
  },

  // Update order
  updateOrder: async (orderId: string, updates: Partial<MockOrder>): Promise<{ success: boolean; data: MockOrder }> => {
    await delay();
    
    const cleanId = orderId.replace('order:', '');
    const orderIndex = mockOrders.findIndex(o => o.id === `order:${cleanId}` || o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockOrders[orderIndex] };
  },

  // Delete order
  deleteOrder: async (orderId: string): Promise<{ success: boolean }> => {
    await delay();
    
    const cleanId = orderId.replace('order:', '');
    const orderIndex = mockOrders.findIndex(o => o.id === `order:${cleanId}` || o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    mockOrders.splice(orderIndex, 1);
    return { success: true };
  },

  // Get menu items
  getMenuItems: async (): Promise<{ success: boolean; data: MockMenuItem[] }> => {
    await delay();
    return { success: true, data: [...mockMenuItems] };
  },

  // Update payment status
  updatePaymentStatus: async (orderId: string, paymentStatus: MockOrder['paymentStatus']): Promise<{ success: boolean; data: MockOrder }> => {
    await delay();
    
    const cleanId = orderId.replace('order:', '');
    const orderIndex = mockOrders.findIndex(o => o.id === `order:${cleanId}` || o.id === orderId);
    
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }

    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: mockOrders[orderIndex] };
  },

  // Get tables
  getTables: async (): Promise<{ success: boolean; data: MockTable[] }> => {
    await delay();
    return { success: true, data: [...mockTables] };
  },

  // Get single table
  getTable: async (tableId: string): Promise<{ success: boolean; data: MockTable | null }> => {
    await delay();
    const table = mockTables.find(t => t.id === tableId || t.id === `table:${tableId}`);
    return { success: true, data: table || null };
  },

  // Update table status
  updateTableStatus: async (tableId: string, status: MockTable['status']): Promise<{ success: boolean; data: MockTable }> => {
    await delay();
    
    const cleanId = tableId.replace('table:', '');
    const tableIndex = mockTables.findIndex(t => t.id === `table:${cleanId}` || t.id === tableId);
    
    if (tableIndex === -1) {
      throw new Error('Table not found');
    }

    mockTables[tableIndex] = {
      ...mockTables[tableIndex],
      status,
      statusStartTime: Date.now(),
    };

    return { success: true, data: mockTables[tableIndex] };
  },

  // Update table
  updateTable: async (tableId: string, updates: Partial<MockTable>): Promise<{ success: boolean; data: MockTable }> => {
    await delay();
    
    const cleanId = tableId.replace('table:', '');
    const tableIndex = mockTables.findIndex(t => t.id === `table:${cleanId}` || t.id === tableId);
    
    if (tableIndex === -1) {
      throw new Error('Table not found');
    }

    mockTables[tableIndex] = {
      ...mockTables[tableIndex],
      ...updates,
      statusStartTime: Date.now(),
    };

    return { success: true, data: mockTables[tableIndex] };
  },

  // Get waiters
  getWaiters: async (): Promise<{ success: boolean; data: MockWaiter[] }> => {
    await delay();
    return { success: true, data: [...mockWaiters] };
  },

  // Get single waiter
  getWaiter: async (waiterId: string): Promise<{ success: boolean; data: MockWaiter | null }> => {
    await delay();
    const waiter = mockWaiters.find(w => w.id === waiterId || w.id === `waiter:${waiterId}`);
    return { success: true, data: waiter || null };
  },

  // Update waiter
  updateWaiter: async (waiterId: string, updates: Partial<MockWaiter>): Promise<{ success: boolean; data: MockWaiter }> => {
    await delay();
    
    const cleanId = waiterId.replace('waiter:', '');
    const waiterIndex = mockWaiters.findIndex(w => w.id === `waiter:${cleanId}` || w.id === waiterId);
    
    if (waiterIndex === -1) {
      throw new Error('Waiter not found');
    }

    mockWaiters[waiterIndex] = {
      ...mockWaiters[waiterIndex],
      ...updates,
    };

    return { success: true, data: mockWaiters[waiterIndex] };
  },

  // Get invoices
  getInvoices: async (): Promise<{ success: boolean; data: MockInvoice[] }> => {
    await delay();
    return { success: true, data: [...mockInvoices] };
  },

  // Get single invoice
  getInvoice: async (invoiceId: string): Promise<{ success: boolean; data: MockInvoice | null }> => {
    await delay();
    const invoice = mockInvoices.find(i => i.id === invoiceId || i.id === `invoice:${invoiceId}`);
    return { success: true, data: invoice || null };
  },

  // Create new invoice
  createInvoice: async (invoiceData: Partial<MockInvoice>): Promise<{ success: boolean; data: MockInvoice }> => {
    await delay();
    
    const newInvoice: MockInvoice = {
      id: `invoice:${Date.now()}`,
      orderId: invoiceData.orderId || '',
      tableId: invoiceData.tableId || '',
      tableNumber: invoiceData.tableNumber || '',
      customerName: invoiceData.customerName || 'Guest',
      items: invoiceData.items || [],
      subtotal: invoiceData.subtotal || 0,
      taxPercent: invoiceData.taxPercent || 0,
      taxAmount: invoiceData.taxAmount || 0,
      discountType: invoiceData.discountType || 'flat',
      discountValue: invoiceData.discountValue || 0,
      discountAmount: invoiceData.discountAmount || 0,
      grandTotal: invoiceData.grandTotal || 0,
      paymentMethod: invoiceData.paymentMethod || 'Cash',
      createdAt: new Date().toISOString(),
    };

    mockInvoices.unshift(newInvoice);
    return { success: true, data: newInvoice };
  },

  // Update invoice
  updateInvoice: async (invoiceId: string, updates: Partial<MockInvoice>): Promise<{ success: boolean; data: MockInvoice }> => {
    await delay();
    
    const cleanId = invoiceId.replace('invoice:', '');
    const invoiceIndex = mockInvoices.findIndex(i => i.id === `invoice:${cleanId}` || i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found');
    }

    mockInvoices[invoiceIndex] = {
      ...mockInvoices[invoiceIndex],
      ...updates,
    };

    return { success: true, data: mockInvoices[invoiceIndex] };
  },

  // Delete invoice
  deleteInvoice: async (invoiceId: string): Promise<{ success: boolean }> => {
    await delay();
    
    const cleanId = invoiceId.replace('invoice:', '');
    const invoiceIndex = mockInvoices.findIndex(i => i.id === `invoice:${cleanId}` || i.id === invoiceId);
    
    if (invoiceIndex === -1) {
      throw new Error('Invoice not found');
    }

    mockInvoices.splice(invoiceIndex, 1);
    return { success: true };
  },
};

// Check if we should use mock API (when Supabase is not available)
export const useMockApi = async (supabaseUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(supabaseUrl, {
      signal: controller.signal,
      headers: { 'Authorization': 'Bearer dummy' }
    });
    
    clearTimeout(timeoutId);
    return false; // Supabase is available
  } catch (error) {
    console.log('Supabase not available, using mock API');
    return true; // Use mock API
  }
};