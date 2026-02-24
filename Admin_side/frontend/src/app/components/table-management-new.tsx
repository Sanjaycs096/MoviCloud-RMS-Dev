import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/app/components/ui/utils';
import { 
  Armchair, Users, Clock, Utensils, Sparkles, CheckCircle,
  UserCheck, UserPlus, X, MapPin, ChefHat
} from 'lucide-react';
import { toast } from 'sonner';
import { restaurantState, type RestaurantOrder } from '@/app/services/restaurant-state';
import { API_BASE_URL } from '@/utils/supabase/info';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Eating' | 'Cleaning';
export type ReservationType = 'None' | 'Web' | 'Phone' | 'Walk-in';
export type Location = 'VIP' | 'Main Hall' | 'AC Hall';
export type Segment = 'Front' | 'Middle' | 'Back';
export type BookingStatus = 'Occupied' | 'Eating' | 'Bill Requested' | 'Completed';

// Individual booking/party at a table
export interface TableBooking {
  id: string; // Unique booking ID
  tableId: string;
  guestCount: number;
  waiterName: string | null;
  waiterId: string | null;
  status: BookingStatus;
  orderId: string | null;
  kitchenStatus: 'Idle' | 'Cooking' | 'Ready' | 'Served';
  billRequested: boolean;
  createdAt: number;
  reservationType: ReservationType;
}

export interface TableData {
  id: string;
  displayNumber: string;
  capacity: 2 | 4 | 6;
  location: Location;
  segment: Segment;
  status: TableStatus;
  timeSlot?: string | null;
  reservationTime?: number | null;
  reservationEndTime?: number | null;
  cleaningStartTime?: number | null;
  // Array of bookings - supports multiple parties
  bookings: TableBooking[];
}

export interface WaiterData {
  id: string;
  name: string;
  assignedTableId: string | null;
}

// ============================================================================
// INITIAL DATA
// ============================================================================

const INITIAL_TABLES: TableData[] = [
  // VIP - Front
  { id: 't1', displayNumber: 'V1', capacity: 4, location: 'VIP', segment: 'Front', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  { id: 't2', displayNumber: 'V2', capacity: 6, location: 'VIP', segment: 'Back', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  
  // VIP - Middle
  { id: 't3', displayNumber: 'V3', capacity: 4, location: 'VIP', segment: 'Middle', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  
  // Main Hall - Front
  { id: 't4', displayNumber: 'M1', capacity: 2, location: 'Main Hall', segment: 'Front', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  { id: 't5', displayNumber: 'M2', capacity: 2, location: 'Main Hall', segment: 'Front', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  { id: 't6', displayNumber: 'M3', capacity: 4, location: 'Main Hall', segment: 'Back', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  
  // Main Hall - Middle
  { id: 't7', displayNumber: 'M4', capacity: 4, location: 'Main Hall', segment: 'Middle', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  
  // AC Hall - Front
  { id: 't11', displayNumber: 'A1', capacity: 2, location: 'AC Hall', segment: 'Front', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  { id: 't12', displayNumber: 'A2', capacity: 4, location: 'AC Hall', segment: 'Front', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
  { id: 't13', displayNumber: 'A3', capacity: 4, location: 'AC Hall', segment: 'Middle', status: 'Available', timeSlot: null, reservationTime: null, reservationEndTime: null, cleaningStartTime: null, bookings: [] },
];

const INITIAL_WAITERS: WaiterData[] = [
  { id: 'w1', name: 'Rahul Sharma', assignedTableId: null },
  { id: 'w2', name: 'Priya Singh', assignedTableId: null },
  { id: 'w3', name: 'Amit Kumar', assignedTableId: null },
  { id: 'w4', name: 'Sneha Patel', assignedTableId: null },
  { id: 'w5', name: 'Vijay Reddy', assignedTableId: null },
  { id: 'w6', name: 'Anjali Verma', assignedTableId: null },
  { id: 'w7', name: 'Rajesh Gupta', assignedTableId: null },
  { id: 'w8', name: 'Meera Joshi', assignedTableId: null },
  { id: 'w9', name: 'Arjun Nair', assignedTableId: null },
  { id: 'w10', name: 'Kavya Iyer', assignedTableId: null },
  { id: 'w11', name: 'Sanjay Mehta', assignedTableId: null },
  { id: 'w12', name: 'Pooja Desai', assignedTableId: null },
];

const TIME_SLOTS = [
  '7:30 AM - 8:50 AM',
  '9:10 AM - 10:30 AM',
  '12:00 PM - 1:20 PM',
  '1:40 PM - 3:00 PM',
  '6:40 PM - 8:00 PM',
  '8:20 PM - 9:40 PM'
];

// ============================================================================
// VISUAL TABLE WITH CHAIRS (NEW DESIGN)
// ============================================================================

interface VisualTableWithChairsProps {
  capacity: 2 | 4 | 6;
  status: TableStatus;
  displayNumber: string;
}

function VisualTableWithChairs({ capacity, status, displayNumber }: VisualTableWithChairsProps) {
  // Define chair color based on status
  const getChairColor = () => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500';
      case 'Reserved':
        return 'bg-orange-500';
      case 'Occupied':
        return 'bg-rose-500';
      case 'Eating':
        return 'bg-blue-500';
      case 'Cleaning':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTableColor = () => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-100 border-emerald-300';
      case 'Reserved':
        return 'bg-orange-100 border-orange-300';
      case 'Occupied':
        return 'bg-rose-100 border-rose-300';
      case 'Eating':
        return 'bg-blue-100 border-blue-300';
      case 'Cleaning':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const chairColor = getChairColor();
  const tableColor = getTableColor();

  // 2-seater: chairs on left and right
  if (capacity === 2) {
    return (
      <div className="relative flex items-center justify-center py-6">
        {/* Left Chair */}
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
        
        {/* Table */}
        <div className={cn("mx-2 w-16 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-bold", tableColor)}>
          {displayNumber}
        </div>
        
        {/* Right Chair */}
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
      </div>
    );
  }

  // 4-seater: chairs on all 4 sides
  if (capacity === 4) {
    return (
      <div className="relative flex flex-col items-center justify-center py-6">
        {/* Top Chair */}
        <div className={cn("w-3 h-3 rounded-full mb-2", chairColor)}></div>
        
        <div className="flex items-center">
          {/* Left Chair */}
          <div className={cn("w-3 h-3 rounded-full mr-2", chairColor)}></div>
          
          {/* Table */}
          <div className={cn("w-20 h-16 rounded-lg border-2 flex items-center justify-center text-sm font-bold", tableColor)}>
            {displayNumber}
          </div>
          
          {/* Right Chair */}
          <div className={cn("w-3 h-3 rounded-full ml-2", chairColor)}></div>
        </div>
        
        {/* Bottom Chair */}
        <div className={cn("w-3 h-3 rounded-full mt-2", chairColor)}></div>
      </div>
    );
  }

  // 6-seater: 2 chairs on top and bottom, 1 on each side
  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Top Chairs */}
      <div className="flex gap-4 mb-2">
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
      </div>
      
      <div className="flex items-center">
        {/* Left Chair */}
        <div className={cn("w-3 h-3 rounded-full mr-2", chairColor)}></div>
        
        {/* Table */}
        <div className={cn("w-24 h-20 rounded-lg border-2 flex items-center justify-center text-sm font-bold", tableColor)}>
          {displayNumber}
        </div>
        
        {/* Right Chair */}
        <div className={cn("w-3 h-3 rounded-full ml-2", chairColor)}></div>
      </div>
      
      {/* Bottom Chairs */}
      <div className="flex gap-4 mt-2">
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
        <div className={cn("w-3 h-3 rounded-full", chairColor)}></div>
      </div>
    </div>
  );
}

// ============================================================================
// TABLE CARD COMPONENT (NEW DESIGN)
// ============================================================================

interface FloorTableCardProps {
  table: TableData;
  onClick?: () => void;
}

function FloorTableCard({ table, onClick }: FloorTableCardProps) {
  const getStatusBadgeColor = () => {
    switch (table.status) {
      case 'Available':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'Reserved':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Occupied':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      case 'Eating':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Cleaning':
        return 'bg-purple-100 text-purple-700 border-purple-300';
    }
  };
  
  const getKitchenStatusBadge = () => {
    if (!table.bookings.length) return null;
    
    const latestBooking = table.bookings[table.bookings.length - 1];
    if (!latestBooking.kitchenStatus || latestBooking.kitchenStatus === 'Idle') return null;
    
    const badges = {
      'Cooking': { color: 'bg-orange-500 text-white', icon: ChefHat, label: 'Cooking' },
      'Ready': { color: 'bg-emerald-500 text-white', icon: CheckCircle, label: 'Ready' },
      'Served': { color: 'bg-blue-500 text-white', icon: Utensils, label: 'Served' }
    };
    
    const badgeInfo = badges[latestBooking.kitchenStatus];
    if (!badgeInfo) return null;
    
    const Icon = badgeInfo.icon;
    return (
      <div className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', badgeInfo.color)}>
        <Icon className="h-3 w-3" />
        <span>{badgeInfo.label}</span>
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-xl border-2 border-gray-200 p-3 hover:shadow-lg transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-gray-900">{table.displayNumber}</span>
        <Badge className={cn("text-xs border", getStatusBadgeColor())}>
          {table.status}
        </Badge>
      </div>

      {/* Visual Table */}
      <VisualTableWithChairs 
        capacity={table.capacity} 
        status={table.status} 
        displayNumber={table.displayNumber}
      />

      {/* Info */}
      <div className="space-y-1 text-xs text-gray-600">
        {table.bookings.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{table.bookings.reduce((sum, booking) => sum + booking.guestCount, 0)} Guests</span>
          </div>
        )}
        {table.timeSlot && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{table.timeSlot}</span>
          </div>
        )}
        {table.bookings.length > 0 && table.bookings[table.bookings.length - 1].waiterName && (
          <div className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            <span>{table.bookings[table.bookings.length - 1].waiterName}</span>
          </div>
        )}
        {getKitchenStatusBadge() && (
          <div className="mt-2">
            {getKitchenStatusBadge()}
          </div>
        )}
        {table.bookings.length > 0 && table.bookings[table.bookings.length - 1].billRequested && (
          <div className="mt-2">
            <Badge className="bg-amber-500 text-white text-xs">
              🧾 Bill Requested
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TableManagement() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [waiters, setWaiters] = useState(INITIAL_WAITERS);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('floor');
  
  // Walk-in Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInGuestCount, setWalkInGuestCount] = useState(2);
  const [walkInLocation, setWalkInLocation] = useState<string>('Any Location');
  const [walkInSegment, setWalkInSegment] = useState<string>('Any Segment');
  const [walkInSelectedTableId, setWalkInSelectedTableId] = useState<string | null>(null);
  
  // Waiter Assignment Modal State
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [selectedTableForWaiter, setSelectedTableForWaiter] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedTableForCheckout, setSelectedTableForCheckout] = useState<string | null>(null);
  
  // Table Details Modal State (to see all bookings)
  const [tableDetailsModalOpen, setTableDetailsModalOpen] = useState(false);
  const [selectedTableForDetails, setSelectedTableForDetails] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Background Timer for Cleaning → Available transition
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTables(prev => prev.map(table => {
        // Auto-transition from Cleaning → Available after 5 minutes
        if (table.status === 'Cleaning' && table.cleaningStartTime) {
          const elapsed = now - table.cleaningStartTime;
          const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
          
          if (elapsed >= fiveMinutes) {
            toast.success(`Table ${table.displayNumber} is now available`);
            return {
              ...table,
              status: 'Available',
              timeSlot: null,
              reservationTime: null,
              reservationEndTime: null,
              cleaningStartTime: null,
              bookings: []
            };
          }
        }
        
        return table;
      }));
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
  }, []);
  
  // Check reservations and activate them at the right time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTables(prev => prev.map(table => {
        // Only activate reservation when reservation time arrives
        if (table.status === 'Reserved' && table.reservationTime && now >= table.reservationTime) {
          // Reservation time has arrived - but keep it Reserved until guests arrive
          return table;
        }
        return table;
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch staff from backend
  useEffect(() => {
    fetchStaff();
    
    // Listen for order status changes from other modules
    const unsubscribe = restaurantState.subscribe((event) => {
      if (event.type === 'ORDER_CREATED') {
        // When an order is created, update kitchen status to Cooking
        const order = event.payload;
        setTables(prev => prev.map(t => 
          t.id === order.tableId
            ? { ...t, bookings: t.bookings.map(b => b.id === order.id ? { ...b, kitchenStatus: 'Cooking' } : b) }
            : t
        ));
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        // Update kitchen status based on order status
        const { orderId, status } = event.payload;
        setTables(prev => prev.map(t => {
          const bookingIndex = t.bookings.findIndex(b => b.orderId === orderId);
          if (bookingIndex !== -1) {
            const booking = t.bookings[bookingIndex];
            if (status === 'cooking') {
              return { ...t, bookings: t.bookings.map(b => b.id === orderId ? { ...b, kitchenStatus: 'Cooking' } : b) };
            } else if (status === 'ready') {
              return { ...t, bookings: t.bookings.map(b => b.id === orderId ? { ...b, kitchenStatus: 'Ready' } : b) };
            } else if (status === 'served') {
              return { ...t, status: 'Eating', bookings: t.bookings.map(b => b.id === orderId ? { ...b, status: 'Eating', kitchenStatus: 'Served' } : b) };
            }
          }
          return t;
        }));
      }
    });
    
    return () => unsubscribe();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/staff`,
      );
      
      if (response.ok) {
        const result = await response.json();
        const rawStaff = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];
        if (result?.success || Array.isArray(result)) {
          const waiterStaff = rawStaff
            .filter((staff: any) => staff.role === 'waiter')
            .map((staff: any) => ({
              id: staff.id,
              name: staff.name,
              assignedTableId: null
            }));
          
          setWaiters(prev => {
            const merged = [...INITIAL_WAITERS];
            waiterStaff.forEach((ws: WaiterData) => {
              const exists = merged.find(w => w.id === ws.id);
              if (!exists) {
                merged.push(ws);
              }
            });
            return merged;
          });
        }
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSimulateWebBooking = () => {
    const availableTable = tables.find(t => t.status === 'Available');
    if (availableTable) {
      const randomSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
      setTables(prev => prev.map(t => 
        t.id === availableTable.id
          ? { 
              ...t, 
              status: 'Reserved', 
              timeSlot: randomSlot,
              reservationTime: Date.now() 
            }
          : t
      ));
      toast.success(`Web booking created for Table ${availableTable.displayNumber}`);
    } else {
      toast.error('No available tables for booking');
    }
  };

  const handleWalkInSubmit = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setTables(prev => prev.map(t => 
        t.id === tableId
          ? { 
              ...t, 
              status: 'Occupied', 
              timeSlot: null,
              reservationTime: null,
              reservationEndTime: null,
              cleaningStartTime: null,
              bookings: [
                ...t.bookings,
                {
                  id: `b${Date.now()}`,
                  tableId: tableId,
                  guestCount: walkInGuestCount,
                  waiterName: null,
                  waiterId: null,
                  status: 'Occupied',
                  orderId: null,
                  kitchenStatus: 'Idle',
                  billRequested: false,
                  createdAt: Date.now(),
                  reservationType: 'Walk-in'
                }
              ]
            }
          : t
      ));
      toast.success(`Walk-in seated at Table ${table.displayNumber}`);
      setWalkInModalOpen(false);
      
      // Open waiter assignment
      setSelectedTableForWaiter(tableId);
      setWaiterModalOpen(true);
    }
  };

  const handleAssignWaiter = (waiterId: string) => {
    if (selectedTableForWaiter) {
      const waiter = waiters.find(w => w.id === waiterId);
      if (waiter) {
        setTables(prev => prev.map(t => 
          t.id === selectedTableForWaiter
            ? { ...t, bookings: t.bookings.map(b => b.status === 'Occupied' ? { ...b, waiterName: waiter.name, waiterId: waiter.id } : b) }
            : t
        ));
        
        setWaiters(prev => prev.map(w => 
          w.id === waiterId ? { ...w, assignedTableId: selectedTableForWaiter } : w
        ));
        
        const table = tables.find(t => t.id === selectedTableForWaiter);
        toast.success(`${waiter.name} assigned to Table ${table?.displayNumber}`);
        setWaiterModalOpen(false);
        setSelectedTableForWaiter(null);
        
        // Simulate order placement after 3 seconds
        setTimeout(() => {
          setTables(prev => prev.map(t => 
            t.id === selectedTableForWaiter
              ? { ...t, bookings: t.bookings.map(b => b.status === 'Occupied' ? { ...b, kitchenStatus: 'Cooking' } : b) }
              : t
          ));
        }, 3000);
      }
    }
  };

  const handleCancelReservation = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { 
            ...t, 
            status: 'Available',
            timeSlot: null,
            reservationTime: null,
            reservationEndTime: null,
            cleaningStartTime: null,
            bookings: []
          }
        : t
    ));
    toast.success(`Reservation cancelled for Table ${table?.displayNumber}`);
  };

  // Handle bill request
  const handleRequestBill = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.status !== 'Eating') {
      toast.error('Bill can only be requested for tables with eating status');
      return;
    }
    
    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { ...t, bookings: t.bookings.map(b => b.status === 'Eating' ? { ...b, billRequested: true } : b) }
        : t
    ));
    toast.info(`Bill requested for Table ${table.displayNumber}`);
  };

  // Step 3: Mark food as served (Occupied → Eating)
  const handleMarkAsServed = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { 
            ...t, 
            status: 'Eating',
            bookings: t.bookings.map(b => b.status === 'Occupied' ? { ...b, status: 'Eating', kitchenStatus: 'Served' } : b),
            timeSlot: null,
            reservationTime: null,
            reservationEndTime: null,
            cleaningStartTime: null
          }
        : t
    ));
    toast.success(`Food served at Table ${table?.displayNumber}`);
  };
  
  // Step 4: Checkout & Payment (Eating → Cleaning)
  const handleCheckout = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Simulate payment processing
    const billAmount = (table.bookings.reduce((sum, booking) => sum + booking.guestCount, 0) * 450).toFixed(2); // Mock calculation
    
    setTables(prev => prev.map(t => 
      t.id === tableId
        ? { 
            ...t, 
            status: 'Cleaning',
            cleaningStartTime: Date.now(),
            bookings: t.bookings.map(b => b.status === 'Eating' ? { ...b, status: 'Completed' } : b)
          }
        : t
    ));
    
    // Free up the waiter
    if (table.bookings.length > 0 && table.bookings[table.bookings.length - 1].waiterId) {
      setWaiters(prev => prev.map(w => 
        w.id === table.bookings[table.bookings.length - 1].waiterId ? { ...w, assignedTableId: null } : w
      ));
    }
    
    toast.success(`Payment completed (₹${billAmount}). Table ${table.displayNumber} is being cleaned.`);
  };

  // ============================================================================
  // FILTERING & GROUPING
  // ============================================================================

  const getFilteredTablesForWalkIn = () => {
    return tables.filter(t => {
      // Calculate remaining capacity
      const occupiedSeats = t.bookings.reduce((sum, booking) => sum + booking.guestCount, 0);
      const remainingSeats = t.capacity - occupiedSeats;
      
      // Table must be Available OR have remaining capacity for walk-in guests
      const hasSpace = t.status === 'Available' || (t.status !== 'Cleaning' && remainingSeats >= walkInGuestCount);
      
      if (!hasSpace) return false;
      if (walkInLocation !== 'Any Location' && t.location !== walkInLocation) return false;
      if (walkInSegment !== 'Any Segment' && t.segment !== walkInSegment) return false;
      return true;
    });
  };

  const groupTablesByLocation = () => {
    const locations: Location[] = ['VIP', 'Main Hall', 'AC Hall'];
    const grouped: Record<Location, Record<string, TableData[]>> = {
      'VIP': { 'FRONT AREA': [], 'MIDDLE AREA': [], 'BACK AREA': [] },
      'Main Hall': { 'FRONT AREA': [], 'MIDDLE AREA': [], 'BACK AREA': [] },
      'AC Hall': { 'FRONT AREA': [], 'MIDDLE AREA': [], 'BACK AREA': [] }
    };

    tables.forEach(table => {
      const areaKey = `${table.segment.toUpperCase()} AREA`;
      if (grouped[table.location][areaKey]) {
        grouped[table.location][areaKey].push(table);
      }
    });

    return grouped;
  };

  const getAvailableWaiters = () => {
    return waiters.map(waiter => {
      if (!waiter.assignedTableId) {
        return { ...waiter, available: true };
      }
      
      const assignedTable = tables.find(t => t.id === waiter.assignedTableId);
      const isBusy = assignedTable && (assignedTable.status === 'Occupied' || assignedTable.status === 'Eating');
      
      return { ...waiter, available: !isBusy };
    });
  };

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const stats = {
    available: tables.filter(t => t.status === 'Available').length,
    reserved: tables.filter(t => t.status === 'Reserved').length,
    occupied: tables.filter(t => t.status === 'Occupied').length,
    eating: tables.filter(t => t.status === 'Eating').length,
    cleaning: tables.filter(t => t.status === 'Cleaning').length,
  };

  const reservedTables = tables.filter(t => t.status === 'Reserved');
  const groupedTables = groupTablesByLocation();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-indigo-600 rounded-lg">
                <Armchair className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Table Management</h1>
                <p className="text-sm text-gray-500">Floor Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatDateTime(currentTime)}</span>
              </div>
              
              <Button
                variant="outline"
                onClick={handleSimulateWebBooking}
              >
                Simulate Web Booking
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="floor">Floor Overview</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
          </TabsList>

          {/* Floor Overview Tab */}
          <TabsContent value="floor" className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-emerald-700 uppercase mb-1">Available</div>
                  <div className="text-3xl font-bold text-emerald-700">{stats.available}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-orange-700 uppercase mb-1">Reserved</div>
                  <div className="text-3xl font-bold text-orange-700">{stats.reserved}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-rose-50 border-rose-200">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-rose-700 uppercase mb-1">Occupied</div>
                  <div className="text-3xl font-bold text-rose-700">{stats.occupied}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-blue-700 uppercase mb-1">Eating</div>
                  <div className="text-3xl font-bold text-blue-700">{stats.eating}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-purple-700 uppercase mb-1">Cleaning</div>
                  <div className="text-3xl font-bold text-purple-700">{stats.cleaning}</div>
                </CardContent>
              </Card>
            </div>

            {/* New Walk-In Entry Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setWalkInModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                New Walk-In Entry
              </Button>
            </div>

            {/* Floor Plan */}
            <div className="space-y-8">
              {(['VIP', 'Main Hall', 'AC Hall'] as Location[]).map(location => {
                const locationTables = groupedTables[location];
                const hasAnyTables = Object.values(locationTables).some(area => area.length > 0);
                
                if (!hasAnyTables) return null;
                
                return (
                  <div key={location} className="space-y-4">
                    {/* Location Header */}
                    <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-3">
                      <h2 className="text-xl font-semibold text-gray-900">{location}</h2>
                      <span className="text-sm text-gray-500">
                        {Object.values(locationTables).flat().length} Tables
                      </span>
                    </div>
                    
                    {/* Areas */}
                    {Object.entries(locationTables).map(([area, areaTables]) => {
                      if (areaTables.length === 0) return null;
                      
                      return (
                        <div key={area} className="pl-6">
                          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-4">
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <h3 className="text-sm font-medium text-gray-700">{area}</h3>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4">
                              {areaTables.map(table => (
                                <FloorTableCard
                                  key={table.id}
                                  table={table}
                                  onClick={() => {
                                    if (table.status === 'Occupied' && !table.bookings[table.bookings.length - 1].waiterName) {
                                      setSelectedTableForWaiter(table.id);
                                      setWaiterModalOpen(true);
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reservations</h2>
              <p className="text-sm text-gray-600 mb-6">Manage time slots and upcoming bookings</p>

              {reservedTables.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No active reservations</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reservedTables.map(table => (
                    <div 
                      key={table.id} 
                      className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {/* Table Number */}
                        <div className="bg-indigo-100 text-indigo-700 font-bold rounded-lg w-16 h-16 flex items-center justify-center text-xl">
                          {table.displayNumber}
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                              UPCOMING
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">
                              {table.timeSlot || TIME_SLOTS[0]}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Location: {table.location} • Guests: {table.bookings.reduce((sum, booking) => sum + booking.guestCount, 0)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Cancel Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(table.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel Reservation
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Walk-In Entry Modal */}
      <Dialog open={walkInModalOpen} onOpenChange={setWalkInModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Walk-In Entry</DialogTitle>
            <DialogDescription>
              Select filters and choose an available table to seat walk-in guests
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filters Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Guest Count */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Guest Count</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWalkInGuestCount(Math.max(1, walkInGuestCount - 1))}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center text-2xl font-bold">{walkInGuestCount}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWalkInGuestCount(walkInGuestCount + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Select value={walkInLocation} onValueChange={setWalkInLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any Location">Any Location</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Main Hall">Main Hall</SelectItem>
                    <SelectItem value="AC Hall">AC Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segment */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Segment</Label>
                <Select value={walkInSegment} onValueChange={setWalkInSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any Segment">Any Segment</SelectItem>
                    <SelectItem value="Front">Front</SelectItem>
                    <SelectItem value="Middle">Middle</SelectItem>
                    <SelectItem value="Back">Back</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Available Tables */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                AVAILABLE TABLES ({getFilteredTablesForWalkIn().length})
              </Label>
              
              {getFilteredTablesForWalkIn().length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <p>No available tables matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                  {getFilteredTablesForWalkIn().map(table => {
                    const occupiedSeats = table.bookings.reduce((sum, booking) => sum + booking.guestCount, 0);
                    const remainingSeats = table.capacity - occupiedSeats;
                    const isShared = table.bookings.length > 0;
                    
                    return (
                      <Button
                        key={table.id}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start hover:bg-emerald-50 hover:border-emerald-500"
                        onClick={() => handleWalkInSubmit(table.id)}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-xl font-bold">{table.displayNumber}</span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                            {table.capacity} Seats
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          {table.location} • {table.segment}
                        </div>
                        {isShared ? (
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              Shared Table
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              {remainingSeats} Seats Free
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            Available
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Waiter Assignment Modal */}
      <Dialog open={waiterModalOpen} onOpenChange={setWaiterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-[#8B5A2B]" />
              Assign Waiter
            </DialogTitle>
            <DialogDescription>
              Select a waiter for Table{' '}
              {tables.find(t => t.id === selectedTableForWaiter)?.displayNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {getAvailableWaiters().map(waiter => {
              const table = waiter.assignedTableId 
                ? tables.find(t => t.id === waiter.assignedTableId)
                : null;
              
              return (
                <Button
                  key={waiter.id}
                  variant={waiter.available ? 'outline' : 'ghost'}
                  className="w-full justify-start h-auto py-3"
                  disabled={!waiter.available}
                  onClick={() => handleAssignWaiter(waiter.id)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <UserCheck className={cn(
                        "h-4 w-4",
                        waiter.available ? "text-emerald-600" : "text-gray-400"
                      )} />
                      <span>{waiter.name}</span>
                    </div>
                    {!waiter.available && table && (
                      <Badge variant="secondary" className="text-xs">
                        Busy at {table.displayNumber}
                      </Badge>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
