import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/supabase/info';

// ==================== DATA ENTITIES ====================

export type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Eating' | 'Cleaning';

export interface TableEntity {
  ID: string;
  Number: string;
  Status: TableStatus;
  Capacity: 2 | 4 | 6;
  WaiterID: string | null;
  WaiterName: string | null;
  Location: 'VIP' | 'Main' | 'AC';
  Segment: 'Front' | 'Back';
  Timers: {
    CleaningStart: number | null;
    ReservationStart: number | null;
    ReservationEnd: number | null;
  };
  ReservationSlot?: {
    Start: Date;
    End: Date;
    CustomerName?: string;
  };
}

export type OrderStatus = 'Placed' | 'Cooking' | 'Ready' | 'Served';

export interface OrderEntity {
  ID: string;
  TableID: string;
  TableNumber: string;
  Items: Array<{
    Name: string;
    Qty: number;
    Price: number;
  }>;
  Total: number;
  WaiterName: string;
  Status: OrderStatus;
  CreatedAt: Date;
  UpdatedAt: Date;
}

// ==================== WAITER ROSTER (HARDCODED) ====================

export const WAITER_ROSTER = [
  { id: 'w1', name: 'John Doe' },
  { id: 'w2', name: 'Sarah Smith' },
  { id: 'w3', name: 'Mike Johnson' },
  { id: 'w4', name: 'Emily Davis' },
  { id: 'w5', name: 'Alex Wilson' },
  { id: 'w6', name: 'Robert Brown' },
  { id: 'w7', name: 'Jessica Taylor' },
  { id: 'w8', name: 'David Miller' },
  { id: 'w9', name: 'Jennifer Anderson' },
  { id: 'w10', name: 'James Wilson' },
  { id: 'w11', name: 'Lisa Martinez' },
  { id: 'w12', name: 'William Thomas' },
];

// ==================== MENU ITEMS POOL ====================

export const MENU_ITEMS_POOL = [
  { name: 'Butter Chicken', price: 320 },
  { name: 'Tandoori Roti', price: 30 },
  { name: 'Paneer Tikka', price: 280 },
  { name: 'Chicken Biryani', price: 350 },
  { name: 'Veg Hakka Noodles', price: 180 },
  { name: 'Masala Dosa', price: 120 },
  { name: 'Gulab Jamun', price: 80 },
  { name: 'Fresh Lime Soda', price: 60 },
  { name: 'Mutton Rogan Josh', price: 420 },
  { name: 'Dal Makhani', price: 220 },
  { name: 'Garlic Naan', price: 50 },
  { name: 'Manchow Soup', price: 100 },
  { name: 'Fish Finger', price: 250 },
  { name: 'Chocolate Brownie', price: 150 },
];

// ==================== INITIAL TABLES DATA ====================

const INITIAL_TABLES: TableEntity[] = [
  // VIP Section - Front
  { ID: 't1', Number: 'V1', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'VIP', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't2', Number: 'V2', Status: 'Available', Capacity: 6, WaiterID: null, WaiterName: null, Location: 'VIP', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  
  // VIP Section - Back
  { ID: 't3', Number: 'V3', Status: 'Available', Capacity: 2, WaiterID: null, WaiterName: null, Location: 'VIP', Segment: 'Back', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  
  // Main Section - Front
  { ID: 't4', Number: 'M1', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'Main', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't5', Number: 'M2', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'Main', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't6', Number: 'M3', Status: 'Available', Capacity: 2, WaiterID: null, WaiterName: null, Location: 'Main', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  
  // Main Section - Back
  { ID: 't7', Number: 'M4', Status: 'Available', Capacity: 6, WaiterID: null, WaiterName: null, Location: 'Main', Segment: 'Back', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't8', Number: 'M5', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'Main', Segment: 'Back', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  
  // AC Section - Front
  { ID: 't9', Number: 'A1', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'AC', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't10', Number: 'A2', Status: 'Available', Capacity: 6, WaiterID: null, WaiterName: null, Location: 'AC', Segment: 'Front', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  
  // AC Section - Back
  { ID: 't11', Number: 'A3', Status: 'Available', Capacity: 2, WaiterID: null, WaiterName: null, Location: 'AC', Segment: 'Back', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
  { ID: 't12', Number: 'A4', Status: 'Available', Capacity: 4, WaiterID: null, WaiterName: null, Location: 'AC', Segment: 'Back', Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } },
];

// ==================== STATE & ACTIONS ====================

interface TableState {
  tables: TableEntity[];
  orders: OrderEntity[];
}

type TableAction =
  | { type: 'SET_TABLE_STATUS'; payload: { tableID: string; status: TableStatus } }
  | { type: 'ASSIGN_WAITER'; payload: { tableID: string; waiterID: string; waiterName: string } }
  | { type: 'GUESTS_ARRIVED'; payload: { tableID: string } }
  | { type: 'START_CLEANING'; payload: { tableID: string } }
  | { type: 'COMPLETE_CLEANING'; payload: { tableID: string } }
  | { type: 'ADD_ORDER'; payload: OrderEntity }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderID: string; status: OrderStatus } }
  | { type: 'SET_RESERVATION'; payload: { tableID: string; slot: { Start: Date; End: Date; CustomerName?: string } } }
  | { type: 'CLEAR_RESERVATION'; payload: { tableID: string } }
  | { type: 'TICK' }
  | { type: 'SYNC_TABLES'; payload: TableEntity[] };

// ==================== REDUCER ====================

function tableReducer(state: TableState, action: TableAction): TableState {
  switch (action.type) {
    case 'SET_TABLE_STATUS': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? { ...table, Status: action.payload.status }
            : table
        ),
      };
    }

    case 'ASSIGN_WAITER': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? { ...table, WaiterID: action.payload.waiterID, WaiterName: action.payload.waiterName }
            : table
        ),
      };
    }

    case 'GUESTS_ARRIVED': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? { ...table, Status: 'Occupied', Timers: { ...table.Timers, ReservationStart: null, ReservationEnd: null }, ReservationSlot: undefined }
            : table
        ),
      };
    }

    case 'START_CLEANING': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? { ...table, Status: 'Cleaning', Timers: { ...table.Timers, CleaningStart: Date.now() } }
            : table
        ),
      };
    }

    case 'COMPLETE_CLEANING': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? { ...table, Status: 'Available', WaiterID: null, WaiterName: null, Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null } }
            : table
        ),
      };
    }

    case 'ADD_ORDER': {
      return {
        ...state,
        orders: [...state.orders, action.payload],
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      return {
        ...state,
        orders: state.orders.map(order =>
          order.ID === action.payload.orderID
            ? { ...order, Status: action.payload.status, UpdatedAt: new Date() }
            : order
        ),
      };
    }

    case 'SET_RESERVATION': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? {
                ...table,
                ReservationSlot: action.payload.slot,
                Timers: {
                  ...table.Timers,
                  ReservationStart: action.payload.slot.Start.getTime(),
                  ReservationEnd: action.payload.slot.End.getTime(),
                },
              }
            : table
        ),
      };
    }

    case 'CLEAR_RESERVATION': {
      return {
        ...state,
        tables: state.tables.map(table =>
          table.ID === action.payload.tableID
            ? {
                ...table,
                ReservationSlot: undefined,
                Timers: { ...table.Timers, ReservationStart: null, ReservationEnd: null },
                Status: 'Available',
              }
            : table
        ),
      };
    }

    case 'TICK': {
      const now = Date.now();
      return {
        ...state,
        tables: state.tables.map(table => {
          // Auto-expire reservations
          if (table.Status === 'Reserved' && table.Timers.ReservationEnd && now >= table.Timers.ReservationEnd) {
            return {
              ...table,
              Status: 'Available',
              ReservationSlot: undefined,
              Timers: { ...table.Timers, ReservationStart: null, ReservationEnd: null },
            };
          }

          // Auto-start reservations
          if (
            table.Status === 'Available' &&
            table.Timers.ReservationStart &&
            table.Timers.ReservationEnd &&
            now >= table.Timers.ReservationStart &&
            now < table.Timers.ReservationEnd
          ) {
            return { ...table, Status: 'Reserved' };
          }

          // Auto-complete cleaning after 5 minutes
          if (table.Status === 'Cleaning' && table.Timers.CleaningStart && now - table.Timers.CleaningStart >= 5 * 60 * 1000) {
            return {
              ...table,
              Status: 'Available',
              WaiterID: null,
              WaiterName: null,
              Timers: { CleaningStart: null, ReservationStart: null, ReservationEnd: null },
            };
          }

          return table;
        }),
      };
    }

    case 'SYNC_TABLES': {
      return {
        ...state,
        tables: action.payload,
      };
    }

    default:
      return state;
  }
}

// ==================== CONTEXT ====================

interface TableContextType {
  state: TableState;
  dispatch: React.Dispatch<TableAction>;
  assignWaiter: (tableID: string, waiterID: string, waiterName: string) => void;
  guestsArrived: (tableID: string) => void;
  checkoutAndPay: (tableID: string) => void;
  generateRandomOrder: (tableID: string, tableNumber: string, waiterName: string) => void;
  updateOrderStatus: (orderID: string, status: OrderStatus) => void;
  setReservation: (tableID: string, slot: { Start: Date; End: Date; CustomerName?: string }) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function TableStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tableReducer, {
    tables: INITIAL_TABLES,
    orders: [],
  });

  // ==================== TIME-SLOT WATCHER (1-second ticker) ====================
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ==================== MENU GENERATOR ALGORITHM ====================
  const generateRandomOrder = (tableID: string, tableNumber: string, waiterName: string) => {
    // Exclude Mineral Water (none in our list, but following the rule)
    const availableItems = MENU_ITEMS_POOL.filter(item => item.name !== 'Mineral Water');

    // Select 2 to 4 random unique items
    const itemCount = Math.floor(Math.random() * 3) + 2; // 2-4
    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    const selectedItems = shuffled.slice(0, itemCount);

    // Assign random quantity (1-2) per item
    const orderItems = selectedItems.map(item => ({
      Name: item.name,
      Qty: Math.floor(Math.random() * 2) + 1, // 1-2
      Price: item.price,
    }));

    // Calculate total
    const total = orderItems.reduce((sum, item) => sum + item.Price * item.Qty, 0);

    const order: OrderEntity = {
      ID: `order:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
      TableID: tableID,
      TableNumber: tableNumber,
      Items: orderItems,
      Total: total,
      WaiterName: waiterName,
      Status: 'Placed',
      CreatedAt: new Date(),
      UpdatedAt: new Date(),
    };

    dispatch({ type: 'ADD_ORDER', payload: order });

    // Push to backend orders
    pushOrderToBackend(order);

    // Trigger notification
    toast.success(`Order from Table ${tableNumber} sent to Kitchen by Waiter ${waiterName}`, {
      description: `${orderItems.length} items • ₹${total.toFixed(2)}`,
      duration: 5000,
    });

    // Auto-transition to Cooking after 3 seconds
    setTimeout(() => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderID: order.ID, status: 'Cooking' } });
      toast.info(`Order ${tableNumber} is now being prepared in the kitchen`);
    }, 3000);

    return order;
  };

  // ==================== PUSH ORDER TO BACKEND ====================
  const pushOrderToBackend = async (order: OrderEntity) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tableNumber: parseInt(order.TableNumber.replace(/[^0-9]/g, '')) || 0,
            customerName: order.WaiterName,
            items: order.Items.map(item => ({
              name: item.Name,
              quantity: item.Qty,
              price: item.Price,
            })),
            total: order.Total,
            status: 'placed',
            type: 'dine-in',
            notes: `Auto-generated by ${order.WaiterName}`,
          }),
        }
      );

      if (response.ok) {
        console.log('Order pushed to backend successfully');
      }
    } catch (error) {
      console.error('Failed to push order to backend:', error);
    }
  };

  // ==================== WAITER-FIRST AUTOMATION ENGINE ====================
  const assignWaiter = (tableID: string, waiterID: string, waiterName: string) => {
    const table = state.tables.find(t => t.ID === tableID);
    if (!table) return;

    // Update table with waiter
    dispatch({ type: 'ASSIGN_WAITER', payload: { tableID, waiterID, waiterName } });

    // Show "Waiter Taking Order..." notification
    toast.info(`Waiter ${waiterName} is taking order for Table ${table.Number}...`, {
      duration: 3000,
    });

    // T+3s: Generate Random Order
    setTimeout(() => {
      generateRandomOrder(tableID, table.Number, waiterName);
    }, 3000);
  };

  // ==================== GUESTS ARRIVED ====================
  const guestsArrived = (tableID: string) => {
    dispatch({ type: 'GUESTS_ARRIVED', payload: { tableID } });
    const table = state.tables.find(t => t.ID === tableID);
    if (table) {
      toast.success(`Guests arrived at Table ${table.Number}`);
    }
  };

  // ==================== CHECKOUT & PAY ====================
  const checkoutAndPay = (tableID: string) => {
    const table = state.tables.find(t => t.ID === tableID);
    const tableOrders = state.orders.filter(o => o.TableID === tableID && o.Status === 'Served');

    if (!table) return;

    // Mark all served orders as completed
    tableOrders.forEach(order => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderID: order.ID, status: 'Served' } });
    });

    // Start cleaning
    dispatch({ type: 'START_CLEANING', payload: { tableID } });
    toast.success(`Table ${table.Number} checked out. Cleaning in progress...`);
  };

  // ==================== UPDATE ORDER STATUS ====================
  const updateOrderStatus = (orderID: string, status: OrderStatus) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderID, status } });

    // If order is marked as Served, transition table to Eating
    if (status === 'Served') {
      const order = state.orders.find(o => o.ID === orderID);
      if (order) {
        const table = state.tables.find(t => t.ID === order.TableID);
        if (table && table.Status === 'Occupied') {
          dispatch({ type: 'SET_TABLE_STATUS', payload: { tableID: table.ID, status: 'Eating' } });
          toast.success(`Table ${table.Number} is now eating`);
        }
      }
    }
  };

  // ==================== SET RESERVATION ====================
  const setReservation = (tableID: string, slot: { Start: Date; End: Date; CustomerName?: string }) => {
    dispatch({ type: 'SET_RESERVATION', payload: { tableID, slot } });
    const table = state.tables.find(t => t.ID === tableID);
    if (table) {
      toast.success(`Reservation set for Table ${table.Number}`, {
        description: `${slot.Start.toLocaleTimeString()} - ${slot.End.toLocaleTimeString()}`,
      });
    }
  };

  const value: TableContextType = {
    state,
    dispatch,
    assignWaiter,
    guestsArrived,
    checkoutAndPay,
    generateRandomOrder,
    updateOrderStatus,
    setReservation,
  };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

// ==================== HOOK ====================

export function useTableStore() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTableStore must be used within a TableStoreProvider');
  }
  return context;
}
