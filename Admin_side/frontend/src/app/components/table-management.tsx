import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/app/components/ui/utils';
import { 
  Armchair, Users, Clock, Utensils, Sparkles, CheckCircle,
  UserCheck, AlertCircle, ChefHat, Timer, MapPin, ShoppingCart, ShieldCheck, Lock, UserPlus, X
} from 'lucide-react';
import { toast } from 'sonner';
import { restaurantState, type RestaurantOrder, type OrderStatus } from '@/app/services/restaurant-state';
import { API_BASE_URL } from '@/utils/supabase/info';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Eating' | 'Cleaning';
export type ReservationType = 'None' | 'Web' | 'Phone' | 'Walk-in';
export type Location = 'VIP' | 'Main Hall' | 'AC Hall';
export type Segment = 'Front' | 'Middle' | 'Back';

export interface TableData {
  id: string;
  displayNumber: string;
  capacity: 2 | 4 | 6;
  location: Location;
  segment: Segment;
  status: TableStatus;
  reservationType: ReservationType;
  guestCount: number;
  waiterName: string | null;
  waiterId: string | null;
  statusStartTime: number | null;
  currentOrderId: string | null;
  timeSlot?: string | null; // Added for time slot tracking
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
  { id: 't1', displayNumber: 'V1', capacity: 4, location: 'VIP', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't2', displayNumber: 'V2', capacity: 6, location: 'VIP', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // VIP - Back
  { id: 't3', displayNumber: 'V3', capacity: 4, location: 'VIP', segment: 'Back', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // Main Hall - Front
  { id: 't4', displayNumber: 'M1', capacity: 2, location: 'Main Hall', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't5', displayNumber: 'M2', capacity: 2, location: 'Main Hall', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't6', displayNumber: 'M3', capacity: 4, location: 'Main Hall', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // Main Hall - Middle
  { id: 't7', displayNumber: 'M4', capacity: 4, location: 'Main Hall', segment: 'Middle', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't8', displayNumber: 'M5', capacity: 6, location: 'Main Hall', segment: 'Middle', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // Main Hall - Back
  { id: 't9', displayNumber: 'M6', capacity: 2, location: 'Main Hall', segment: 'Back', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't10', displayNumber: 'M7', capacity: 4, location: 'Main Hall', segment: 'Back', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // AC Hall - Front
  { id: 't11', displayNumber: 'A1', capacity: 4, location: 'AC Hall', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't12', displayNumber: 'A2', capacity: 4, location: 'AC Hall', segment: 'Front', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  
  // AC Hall - Middle
  { id: 't13', displayNumber: 'A3', capacity: 6, location: 'AC Hall', segment: 'Middle', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
  { id: 't14', displayNumber: 'A4', capacity: 2, location: 'AC Hall', segment: 'Middle', status: 'Available', reservationType: 'None', guestCount: 0, waiterName: null, waiterId: null, statusStartTime: null, currentOrderId: null },
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

// Time slots for reservations and walk-ins
const TIME_SLOTS = [
  '7:30 AM - 8:50 AM',
  '9:10 AM - 10:30 AM',
  '12:00 PM - 1:20 PM',
  '1:40 PM - 3:00 PM',
  '6:40 PM - 8:00 PM',
  '8:20 PM - 9:40 PM'
];

// ============================================================================
// TABLE ILLUSTRATION COMPONENT
// ============================================================================

function TableIllustration({ capacity }: { capacity: 2 | 4 | 6 }) {
  if (capacity === 2) {
    return (
      <div className="flex items-center justify-center gap-1">
        {/* Left Chair */}
        <div className="w-3 h-4 bg-gray-400 rounded-sm"></div>
        {/* Table */}
        <div className="w-8 h-6 bg-gray-600 rounded"></div>
        {/* Right Chair */}
        <div className="w-3 h-4 bg-gray-400 rounded-sm"></div>
      </div>
    );
  }
  
  if (capacity === 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        {/* Top Chair */}
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
        {/* Middle Row */}
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
          <div className="w-10 h-8 bg-gray-600 rounded"></div>
          <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
        </div>
        {/* Bottom Chair */}
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
      </div>
    );
  }
  
  // 6 seater
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      {/* Top Chairs */}
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
      </div>
      {/* Middle Row */}
      <div className="flex items-center gap-0.5">
        <div className="w-3 h-4 bg-gray-400 rounded-sm"></div>
        <div className="w-12 h-10 bg-gray-600 rounded"></div>
        <div className="w-3 h-4 bg-gray-400 rounded-sm"></div>
      </div>
      {/* Bottom Chairs */}
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
        <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getStatusConfig(status: TableStatus) {
  switch (status) {
    case 'Available':
      return { 
        color: 'text-emerald-700', 
        bg: 'bg-emerald-50', 
        border: 'border-emerald-200',
        icon: CheckCircle,
        label: 'Available'
      };
    case 'Reserved':
      return { 
        color: 'text-orange-700', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        icon: Clock,
        label: 'Reserved'
      };
    case 'Occupied':
      return { 
        color: 'text-rose-700', 
        bg: 'bg-rose-50', 
        border: 'border-rose-200',
        icon: Users,
        label: 'Occupied'
      };
    case 'Eating':
      return { 
        color: 'text-blue-700', 
        bg: 'bg-blue-50', 
        border: 'border-blue-200',
        icon: Utensils,
        label: 'Eating'
      };
    case 'Cleaning':
      return { 
        color: 'text-purple-700', 
        bg: 'bg-purple-50', 
        border: 'border-purple-200',
        icon: Sparkles,
        label: 'Cleaning'
      };
  }
}

function getOrderStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'created':
      return { label: 'Created', color: 'bg-gray-100 text-gray-700' };
    case 'accepted':
      return { label: 'Accepted', color: 'bg-blue-100 text-blue-700' };
    case 'cooking':
      return { label: 'Cooking', color: 'bg-yellow-100 text-yellow-700' };
    case 'ready':
      return { label: 'Ready', color: 'bg-green-100 text-green-700' };
    case 'served':
      return { label: 'Served', color: 'bg-indigo-100 text-indigo-700' };
    case 'completed':
      return { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700' };
  }
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getRemainingTime(table: TableData, currentTime: number): number | null {
  if (!table.statusStartTime) return null;
  
  const elapsed = Math.floor((currentTime - table.statusStartTime) / 1000);
  
  if (table.status === 'Reserved') {
    return Math.max(0, 900 - elapsed); // 15 minutes
  }
  
  if (table.status === 'Cleaning') {
    return Math.max(0, 300 - elapsed); // 5 minutes = 300 seconds
  }
  
  return null;
}

// ============================================================================
// TABLE CARD COMPONENT
// ============================================================================

interface TableCardProps {
  table: TableData;
  order: RestaurantOrder | undefined;
  onGuestsArrived: (tableId: string) => void;
  onAssignWaiter: (tableId: string) => void;
  onCreateOrder: (tableId: string) => void;
  onAcceptOrder: (tableId: string) => void;
  onSendToCooking: (tableId: string) => void;
  onMarkReady: (tableId: string) => void;
  onServeFood: (tableId: string) => void;
  onCheckout: (tableId: string) => void;
  onMarkCleaned: (tableId: string) => void;
  remainingTime: number | null;
}

function TableCard({
  table,
  order,
  onGuestsArrived,
  onAssignWaiter,
  onCreateOrder,
  onAcceptOrder,
  onSendToCooking,
  onMarkReady,
  onServeFood,
  onCheckout,
  onMarkCleaned,
  remainingTime
}: TableCardProps) {
  const statusConfig = getStatusConfig(table.status);
  const StatusIcon = statusConfig.icon;
  const isAdmin = restaurantState.getRole() === 'admin';
  const isWaiter = restaurantState.getRole() === 'waiter';
  const currentWaiterId = restaurantState.getCurrentWaiterId();
  const isAssignedWaiter = isWaiter && table.waiterId === currentWaiterId;
  const canInteract = isAdmin || isAssignedWaiter;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        statusConfig.border,
        statusConfig.bg
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-gray-900">{table.displayNumber}</div>
            <div className="text-xs text-gray-600">Capacity: {table.capacity}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(statusConfig.bg, statusConfig.color, "border-0 flex items-center gap-1")}>
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </Badge>
            {table.reservationType !== 'None' && (
              <Badge variant="outline" className="text-[10px]">
                {table.reservationType}
              </Badge>
            )}
            {!canInteract && table.status !== 'Available' && (
              <Badge variant="secondary" className="text-[10px] flex items-center gap-1">
                <Lock className="h-2 w-2" />
                Locked
              </Badge>
            )}
          </div>
        </div>

        {/* Table Illustration */}
        <div className="flex justify-center py-2">
          <TableIllustration capacity={table.capacity} />
        </div>

        {/* Guest Count */}
        {table.guestCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="h-3 w-3" />
            {table.guestCount} Guests
          </div>
        )}

        {/* Waiter Assignment */}
        {table.waiterName && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <UserCheck className="h-3 w-3" />
            {table.waiterName}
          </div>
        )}

        {/* Timer Display */}
        {remainingTime !== null && (table.status === 'Reserved' || table.status === 'Cleaning') && (
          <div className={cn(
            "flex items-center justify-center gap-1 py-1 px-2 rounded text-xs font-mono",
            table.status === 'Reserved' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
          )}>
            <Timer className="h-3 w-3" />
            {formatTimer(remainingTime)}
          </div>
        )}

        {/* Order Status */}
        {order && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1 py-1 px-2 rounded text-xs bg-indigo-100 text-indigo-700">
              <ShoppingCart className="h-3 w-3" />
              Order #{order.id.slice(-4)}
            </div>
            <Badge className={cn("w-full justify-center", getOrderStatusBadge(order.status).color)}>
              {getOrderStatusBadge(order.status).label}
            </Badge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Guests Arrived - Admin Only */}
          {table.status === 'Reserved' && isAdmin && (
            <Button 
              size="sm" 
              className="w-full bg-[#8B5A2B] hover:bg-[#6d4522]"
              onClick={() => onGuestsArrived(table.id)}
            >
              Guests Arrived
            </Button>
          )}

          {/* Assign Waiter - Admin Only */}
          {table.status === 'Occupied' && !table.waiterName && isAdmin && (
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => onAssignWaiter(table.id)}
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Assign Waiter
            </Button>
          )}

          {/* Create Order - Waiter Only (Assigned Waiter) */}
          {table.status === 'Occupied' && table.waiterName && !order && isAssignedWaiter && (
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => onCreateOrder(table.id)}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Create Order
            </Button>
          )}

          {/* Accept Order - Waiter Only (Assigned Waiter) */}
          {order && order.status === 'created' && isAssignedWaiter && (
            <Button 
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => onAcceptOrder(table.id)}
            >
              Accept Order
            </Button>
          )}

          {/* Send to Cooking - Waiter Only (Assigned Waiter) */}
          {order && order.status === 'accepted' && isAssignedWaiter && (
            <Button 
              size="sm" 
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              onClick={() => onSendToCooking(table.id)}
            >
              <ChefHat className="h-3 w-3 mr-1" />
              Send to Kitchen
            </Button>
          )}

          {/* Mark as Ready - Waiter Only (Assigned Waiter) */}
          {order && order.status === 'cooking' && isAssignedWaiter && (
            <Button 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onMarkReady(table.id)}
            >
              Mark as Ready
            </Button>
          )}

          {/* Serve Food - Waiter Only (Assigned Waiter) */}
          {order && order.status === 'ready' && isAssignedWaiter && (
            <Button 
              size="sm" 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => onServeFood(table.id)}
            >
              <Utensils className="h-3 w-3 mr-1" />
              Serve Food
            </Button>
          )}

          {/* Checkout - Admin Only */}
          {table.status === 'Eating' && isAdmin && (
            <Button 
              size="sm" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onCheckout(table.id)}
            >
              Checkout
            </Button>
          )}

          {/* Mark as Cleaned - Admin Only */}
          {table.status === 'Cleaning' && isAdmin && (
            <Button 
              size="sm" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => onMarkCleaned(table.id)}
            >
              <ShieldCheck className="h-3 w-3 mr-1" />
              Mark as Cleaned
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TableManagement() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [waiters, setWaiters] = useState(INITIAL_WAITERS);
  const [staffList, setStaffList] = useState<WaiterData[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [, setForceUpdate] = useState(0);
  
  // Track pending auto-order timeouts
  const autoOrderTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const autoCleanupTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  
  // Walk-in Modal State
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInGuestCount, setWalkInGuestCount] = useState(2);
  const [walkInLocation, setWalkInLocation] = useState<Location | 'All'>('All');
  const [walkInSegment, setWalkInSegment] = useState<Segment | 'All'>('All');
  const [walkInTimeSlot, setWalkInTimeSlot] = useState<string>(TIME_SLOTS[0]); // Added time slot state
  
  // Waiter Assignment Modal State
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [selectedTableForWaiter, setSelectedTableForWaiter] = useState<string | null>(null);

  // Fetch staff from backend
  useEffect(() => {
    fetchStaff();
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
          setStaffList(waiterStaff);
          // Merge with initial waiters
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

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = restaurantState.subscribe((event) => {
      // Force re-render when state changes
      setForceUpdate(prev => prev + 1);
      
      // Handle specific events
      if (event.type === 'ORDER_STATUS_CHANGED') {
        const { orderId, status } = event.payload;
        const order = restaurantState.getOrder(orderId);
        
        if (order && status === 'served') {
          // Automatically change table status to Eating when order is served
          setTables(prev => prev.map(t => 
            t.currentOrderId === orderId 
              ? { ...t, status: 'Eating' } 
              : t
          ));
        }
      }
      
      if (event.type === 'CHECKOUT_COMPLETED') {
        const { tableId } = event.payload;
        // Change table to Cleaning status
        setTables(prev => prev.map(t => 
          t.id === tableId 
            ? { ...t, status: 'Cleaning', statusStartTime: Date.now() } 
            : t
        ));
        
        // AUTOMATION: 5-minute auto-reset from Cleaning to Available (300,000ms)
        const existingCleanupTimeout = autoCleanupTimeoutsRef.current.get(tableId);
        if (existingCleanupTimeout) {
          clearTimeout(existingCleanupTimeout);
        }
        
        const autoCleanupTimeout = setTimeout(() => {
          setTables(prev => prev.map(t => {
            if (t.id === tableId && t.status === 'Cleaning') {
              // Free up waiter
              if (t.waiterId) {
                setWaiters(prevW => prevW.map(w => 
                  w.id === t.waiterId ? { ...w, assignedTableId: null } : w
                ));
              }
              
              // Clear auto-order timeout if still pending
              const autoOrderTimeout = autoOrderTimeoutsRef.current.get(tableId);
              if (autoOrderTimeout) {
                clearTimeout(autoOrderTimeout);
                autoOrderTimeoutsRef.current.delete(tableId);
              }
              
              toast.info(`Table ${t.displayNumber} automatically reset to Available`);
              
              return {
                ...t,
                status: 'Available',
                reservationType: 'None',
                statusStartTime: null,
                waiterName: null,
                waiterId: null,
                guestCount: 0,
                currentOrderId: null
              };
            }
            return t;
          }));
          
          // Clean up cleanup timeout reference
          autoCleanupTimeoutsRef.current.delete(tableId);
        }, 300000); // 5 minutes = 300,000ms
        
        autoCleanupTimeoutsRef.current.set(tableId, autoCleanupTimeout);
      }
      
      if (event.type === 'TABLE_CLEANED') {
        const { tableId } = event.payload;
        // Reset table to Available
        setTables(prev => prev.map(t => {
          if (t.id === tableId) {
            // Clear any pending timeouts
            const autoOrderTimeout = autoOrderTimeoutsRef.current.get(tableId);
            if (autoOrderTimeout) {
              clearTimeout(autoOrderTimeout);
              autoOrderTimeoutsRef.current.delete(tableId);
            }
            
            const autoCleanupTimeout = autoCleanupTimeoutsRef.current.get(tableId);
            if (autoCleanupTimeout) {
              clearTimeout(autoCleanupTimeout);
              autoCleanupTimeoutsRef.current.delete(tableId);
            }
            
            // Free up waiter
            if (t.waiterId) {
              setWaiters(prevW => prevW.map(w => 
                w.id === t.waiterId ? { ...w, assignedTableId: null } : w
              ));
            }
            return {
              ...t,
              status: 'Available',
              reservationType: 'None',
              statusStartTime: null,
              waiterName: null,
              waiterId: null,
              guestCount: 0,
              currentOrderId: null
            };
          }
          return t;
        }));
      }
    });

    return unsubscribe;
  }, []);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all pending auto-order timeouts
      autoOrderTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      autoOrderTimeoutsRef.current.clear();
      
      // Clear all pending auto-cleanup timeouts
      autoCleanupTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      autoCleanupTimeoutsRef.current.clear();
    };
  }, []);

  // Update current time every second for timer displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-expire reservations
  useEffect(() => {
    const checkExpiry = () => {
      setTables(prev => prev.map(table => {
        // Auto-expire Reserved tables after 15 minutes
        if (table.status === 'Reserved' && table.statusStartTime) {
          const elapsed = Math.floor((Date.now() - table.statusStartTime) / 1000);
          if (elapsed >= 900) { // 15 minutes = 900 seconds
            toast.info(`Reservation expired for Table ${table.displayNumber}`);
            return {
              ...table,
              status: 'Available',
              reservationType: 'None',
              statusStartTime: null,
              guestCount: 0
            };
          }
        }
        
        return table;
      }));
    };

    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const reserveTable = (tableId: string, guestCount: number, reservationType: ReservationType) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.status !== 'Available') {
      toast.error('Table not available for reservation');
      return;
    }

    if (guestCount > table.capacity) {
      toast.error(`Guest count exceeds capacity of ${table.capacity}`);
      return;
    }

    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { 
            ...t, 
            status: 'Reserved', 
            reservationType,
            guestCount,
            statusStartTime: Date.now() 
          }
        : t
    ));
    
    toast.success(`Table ${table.displayNumber} reserved for ${guestCount} guests`);
  };

  const seatGuests = (tableId: string) => {
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { 
            ...t, 
            status: 'Occupied',
            statusStartTime: null 
          }
        : t
    ));
    
    const table = tables.find(t => t.id === tableId);
    toast.success(`Guests seated at Table ${table?.displayNumber}`);
  };

  const assignWaiterToTable = (tableId: string, waiterId: string) => {
    const table = tables.find(t => t.id === tableId);
    const waiter = waiters.find(w => w.id === waiterId);
    
    if (!table || !waiter) return;
    
    // Can only assign waiter to Occupied tables
    if (table.status !== 'Occupied') {
      toast.error('Waiter can only be assigned to occupied tables');
      return;
    }

    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { ...t, waiterName: waiter.name, waiterId: waiter.id } 
        : t
    ));
    
    setWaiters(prev => prev.map(w => 
      w.id === waiterId ? { ...w, assignedTableId: tableId } : w
    ));
    
    restaurantState.assignWaiterToTable({
      tableId,
      waiterId: waiter.id,
      waiterName: waiter.name,
      status: 'Occupied'
    });
    
    toast.success(`${waiter.name} assigned to Table ${table.displayNumber}`);
    
    // Clear any existing auto-order timeout for this table
    const existingTimeout = autoOrderTimeoutsRef.current.get(tableId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // AUTOMATION: 3-second auto-order trigger after waiter assignment
    const autoOrderTimeout = setTimeout(() => {
      // Create order from current state
      setTables(currentTables => {
        const currentTable = currentTables.find(t => t.id === tableId);
        if (currentTable && !currentTable.currentOrderId) {
          const orderId = `ORD-${Date.now()}`;
          const order: RestaurantOrder = {
            id: orderId,
            tableId,
            tableNumber: currentTable.displayNumber,
            waiterId: waiterId,
            waiterName: currentTable.waiterName || waiter.name,
            items: [
              { name: 'Sample Item 1', quantity: 2, price: 150 },
              { name: 'Sample Item 2', quantity: 1, price: 200 }
            ],
            total: 500,
            status: 'created',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            notes: 'Auto-generated order'
          };
          
          restaurantState.createOrder(order);
          
          return currentTables.map(t => 
            t.id === tableId ? { ...t, currentOrderId: orderId } : t
          );
        }
        return currentTables;
      });
      
      // Clean up timeout reference
      autoOrderTimeoutsRef.current.delete(tableId);
    }, 3000); // 3-second delay
    
    autoOrderTimeoutsRef.current.set(tableId, autoOrderTimeout);
  };

  const handleSimulateWebBooking = () => {
    const availableTable = tables.find(t => t.status === 'Available');
    if (availableTable) {
      reserveTable(availableTable.id, 4, 'Web');
    } else {
      toast.error('No available tables for booking');
    }
  };

  const handleGuestsArrived = (tableId: string) => {
    seatGuests(tableId);
    setSelectedTableForWaiter(tableId);
    setWaiterModalOpen(true);
  };

  const handleWalkInSubmit = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.status !== 'Available') {
      toast.error('Table not available');
      return;
    }

    if (walkInGuestCount > table.capacity) {
      toast.error(`Guest count exceeds capacity of ${table.capacity}`);
      return;
    }

    // Direct: Available → Occupied (no Reserved intermediate state)
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { 
            ...t, 
            status: 'Occupied',
            reservationType: 'Walk-in',
            guestCount: walkInGuestCount,
            statusStartTime: null
          }
        : t
    ));
    
    setWalkInModalOpen(false);
    
    // Prompt for waiter assignment
    setSelectedTableForWaiter(tableId);
    setWaiterModalOpen(true);
    
    toast.success(`Walk-in guests seated at Table ${table.displayNumber}`);
  };

  const handleAssignWaiter = (waiterId: string) => {
    if (selectedTableForWaiter) {
      assignWaiterToTable(selectedTableForWaiter, waiterId);
      setWaiterModalOpen(false);
      setSelectedTableForWaiter(null);
    }
  };

  const handleCreateOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    
    if (!table) return;
    
    // Validation: Table must be Occupied
    if (table.status !== 'Occupied') {
      toast.error('Orders can only be created for Occupied tables');
      return;
    }
    
    // Validation: Waiter must be assigned
    if (!table.waiterId || !table.waiterName) {
      toast.error('Waiter must be assigned first');
      return;
    }
    
    // Permission check
    if (!restaurantState.canCreateOrder(table.waiterId)) {
      toast.error('You can only create orders for your assigned tables');
      return;
    }
    
    // Create order
    const orderId = `ORD-${Date.now()}`;
    const order: RestaurantOrder = {
      id: orderId,
      tableId,
      tableNumber: table.displayNumber,
      waiterId: table.waiterId,
      waiterName: table.waiterName,
      items: [
        { name: 'Sample Item 1', quantity: 2, price: 150 },
        { name: 'Sample Item 2', quantity: 1, price: 200 }
      ],
      total: 500,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: 'Sample order for demonstration'
    };
    
    // Update table with order ID
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, currentOrderId: orderId } : t
    ));
    
    // Create order in restaurant state
    restaurantState.createOrder(order);
    
    toast.success(`Order created for Table ${table.displayNumber}`);
  };

  const handleAcceptOrder = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    restaurantState.updateOrderStatus(table.currentOrderId, 'accepted');
    toast.success('Order accepted');
  };

  const handleSendToCooking = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    restaurantState.updateOrderStatus(table.currentOrderId, 'cooking');
    toast.success('Order sent to kitchen');
  };

  const handleMarkReady = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    restaurantState.updateOrderStatus(table.currentOrderId, 'ready');
    toast.success('Order is ready to serve!');
  };

  const handleServeFood = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    const order = restaurantState.getOrder(table.currentOrderId);
    if (!order) return;
    
    // Permission check
    if (!restaurantState.canServeOrder(order.waiterId)) {
      toast.error('Only the assigned waiter can serve this order');
      return;
    }
    
    // Mark order as served
    restaurantState.updateOrderStatus(table.currentOrderId, 'served');
    
    // Update table status to Eating (handled by event listener)
    toast.success(`Food served to Table ${table.displayNumber}!`);
  };

  const handleCheckout = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;
    
    // Permission check - Only Admin can perform checkout
    if (!restaurantState.canCheckout()) {
      toast.error('Only Admin can perform checkout');
      return;
    }
    
    // Process checkout
    restaurantState.processCheckout(tableId, table.currentOrderId);
    
    toast.success(`Checkout completed for Table ${table.displayNumber}`);
  };

  const handleMarkCleaned = (tableId: string) => {
    // Only admin can clean tables
    if (!restaurantState.canCleanTable()) {
      toast.error('Only Admin can mark tables as cleaned');
      return;
    }
    
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Clear the order
    if (table.currentOrderId) {
      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, currentOrderId: null } : t
      ));
    }
    
    // Clear table assignment
    restaurantState.clearTableAssignment(tableId);
    
    toast.success(`Table ${table.displayNumber} is now available`);
  };

  // ============================================================================
  // FILTERING & GROUPING
  // ============================================================================

  const getFilteredTablesForWalkIn = () => {
    return tables.filter(t => {
      if (t.status !== 'Available') return false;
      if (t.capacity < walkInGuestCount) return false;
      if (walkInLocation !== 'All' && t.location !== walkInLocation) return false;
      if (walkInSegment !== 'All' && t.segment !== walkInSegment) return false;
      return true;
    });
  };

  const groupTablesByLocation = () => {
    const locations: Location[] = ['VIP', 'Main Hall', 'AC Hall'];
    const grouped: Record<Location, Record<Segment, TableData[]>> = {
      'VIP': { Front: [], Middle: [], Back: [] },
      'Main Hall': { Front: [], Middle: [], Back: [] },
      'AC Hall': { Front: [], Middle: [], Back: [] }
    };

    tables.forEach(table => {
      grouped[table.location][table.segment].push(table);
    });

    // Sort tables by displayNumber within each segment
    locations.forEach(location => {
      (['Front', 'Middle', 'Back'] as Segment[]).forEach(segment => {
        grouped[location][segment].sort((a, b) => 
          a.displayNumber.localeCompare(b.displayNumber)
        );
      });
    });

    return grouped;
  };

  const groupedTables = groupTablesByLocation();

  // Get available waiters (not assigned to active tables)
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
    total: tables.length
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="bg-table-management-module min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/40 backdrop-blur-sm border-b border-gray-600 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="module-container flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Armchair className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white drop-shadow-lg">Table Management</h1>
                <p className="text-sm text-gray-200">Floor Command Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick Actions */}
              <Button
                onClick={() => setWalkInModalOpen(true)}
                className="bg-[#8B5A2B] hover:bg-[#6d4522]"
              >
                <Users className="h-4 w-4 mr-2" />
                New Walk-In
              </Button>
              
              {/* Simulate Booking - Admin/Test Feature */}
              <Button
                variant="outline"
                onClick={handleSimulateWebBooking}
              >
                <Clock className="h-4 w-4 mr-2" />
                Simulate Booking
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-6 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <div className="text-xs text-emerald-700">Available</div>
              <div className="text-2xl font-bold text-emerald-700">{stats.available}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="text-xs text-orange-700">Reserved</div>
              <div className="text-2xl font-bold text-orange-700">{stats.reserved}</div>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
              <div className="text-xs text-rose-700">Occupied</div>
              <div className="text-2xl font-bold text-rose-700">{stats.occupied}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs text-blue-700">Eating</div>
              <div className="text-2xl font-bold text-blue-700">{stats.eating}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-xs text-purple-700">Cleaning</div>
              <div className="text-2xl font-bold text-purple-700">{stats.cleaning}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-6 space-y-8">
        {(['VIP', 'Main Hall', 'AC Hall'] as Location[]).map(location => {
          const locationTables = groupedTables[location];
          const hasAnyTables = Object.values(locationTables).some(segment => segment.length > 0);
          
          if (!hasAnyTables) return null;
          
          return (
            <div key={location} className="space-y-4">
              {/* Location Header */}
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#8B5A2B]" />
                <h2 className="text-xl font-semibold text-gray-900">{location}</h2>
                <div className="h-px flex-1 bg-gray-300"></div>
              </div>
              
              {/* Segments */}
              {(['Front', 'Middle', 'Back'] as Segment[]).map(segment => {
                const segmentTables = locationTables[segment];
                
                if (segmentTables.length === 0) return null;
                
                return (
                  <div key={segment} className="ml-8">
                    {/* Segment Container */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-white/40">
                      <div className="text-sm font-medium text-gray-600 mb-3">{segment} Section</div>
                      
                      {/* Table Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {segmentTables
                          .filter(table => table.status !== 'Eating' && table.status !== 'Cleaning')
                          .map(table => {
                          const order = table.currentOrderId 
                            ? restaurantState.getOrder(table.currentOrderId) 
                            : undefined;
                          return (
                            <TableCard
                              key={table.id}
                              table={table}
                              order={order}
                              onGuestsArrived={handleGuestsArrived}
                              onAssignWaiter={(id) => {
                                setSelectedTableForWaiter(id);
                                setWaiterModalOpen(true);
                              }}
                              onCreateOrder={handleCreateOrder}
                              onAcceptOrder={handleAcceptOrder}
                              onSendToCooking={handleSendToCooking}
                              onMarkReady={handleMarkReady}
                              onServeFood={handleServeFood}
                              onCheckout={handleCheckout}
                              onMarkCleaned={handleMarkCleaned}
                              remainingTime={getRemainingTime(table, currentTime)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}{/* Walk-In Modal */}
      <Dialog open={walkInModalOpen} onOpenChange={setWalkInModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#8B5A2B]" />
              New Walk-In Guest
            </DialogTitle>
            <DialogDescription>
              Select guest count and preferences to find available tables
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Guest Count */}
            <div className="space-y-2">
              <Label>Guest Count</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setWalkInGuestCount(Math.max(1, walkInGuestCount - 1))}
                >
                  -
                </Button>
                <div className="flex-1 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{walkInGuestCount}</span>
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setWalkInGuestCount(walkInGuestCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Location Filter */}
            <div className="space-y-2">
              <Label>Location Preference (Optional)</Label>
              <Select value={walkInLocation} onValueChange={(v) => setWalkInLocation(v as Location | 'All')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Locations</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Main Hall">Main Hall</SelectItem>
                  <SelectItem value="AC Hall">AC Hall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Segment Filter */}
            <div className="space-y-2">
              <Label>Segment Preference (Optional)</Label>
              <Select value={walkInSegment} onValueChange={(v) => setWalkInSegment(v as Segment | 'All')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Segments</SelectItem>
                  <SelectItem value="Front">Front</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                  <SelectItem value="Back">Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Time Slot */}
            <div className="space-y-2">
              <Label>Time Slot (Optional)</Label>
              <Select value={walkInTimeSlot} onValueChange={(v) => setWalkInTimeSlot(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(slot => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Available Tables */}
            <div className="space-y-2">
              <Label>Available Tables (Capacity ≥ {walkInGuestCount})</Label>
              {getFilteredTablesForWalkIn().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tables available matching your criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2">
                  {getFilteredTablesForWalkIn().map(table => (
                    <Button
                      key={table.id}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-500"
                      onClick={() => handleWalkInSubmit(table.id)}
                    >
                      <TableIllustration capacity={table.capacity} />
                      <div className="font-bold">{table.displayNumber}</div>
                      <div className="text-xs text-gray-600">
                        {table.location} - {table.segment}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Seats {table.capacity}
                      </Badge>
                    </Button>
                  ))}
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
              Select an available waiter for Table{' '}
              {tables.find(t => t.id === selectedTableForWaiter)?.displayNumber}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
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
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWaiterModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
