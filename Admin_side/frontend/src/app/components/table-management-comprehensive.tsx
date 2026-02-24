import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/app/components/ui/utils';
import { LoadingTables } from '@/app/components/ui/loading-spinner';
import {
  Users, Clock, Utensils, Sparkles, CheckCircle, UserPlus,
  AlertCircle, ChefHat, Timer, MapPin, Calendar, X, Coffee, DollarSign,
  Plus, ChevronsRight, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { tablesApi } from '@/utils/api';
import { staffApi } from '@/utils/api';
import { ordersApi } from '@/utils/api';
import { useAuth } from '@/utils/auth-context';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type TableStatus = 'Available' | 'Reserved' | 'Occupied' | 'Eating' | 'Cleaning';
type Location = 'VIP' | 'Main Hall' | 'AC Hall';
type Segment = 'Front' | 'Middle' | 'Back';

// Time slots for the walk-in modal
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

function TableIllustration({ capacity }: { capacity: number }) {
  const cap = capacity >= 6 ? 6 : capacity >= 4 ? 4 : 2;
  if (cap === 2) {
    return (
      <div className="flex items-center justify-center gap-1">
        <div className="w-3 h-4 bg-gray-400 rounded-sm" />
        <div className="w-8 h-6 bg-gray-600 rounded" />
        <div className="w-3 h-4 bg-gray-400 rounded-sm" />
      </div>
    );
  }
  if (cap === 4) {
    return (
      <div className="flex flex-col items-center justify-center gap-0.5">
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-3 bg-gray-400 rounded-sm" />
          <div className="w-10 h-8 bg-gray-600 rounded" />
          <div className="w-3 h-3 bg-gray-400 rounded-sm" />
        </div>
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-0.5">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
      </div>
      <div className="flex items-center gap-0.5">
        <div className="w-3 h-4 bg-gray-400 rounded-sm" />
        <div className="w-12 h-10 bg-gray-600 rounded" />
        <div className="w-3 h-4 bg-gray-400 rounded-sm" />
      </div>
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
      </div>
    </div>
  );
}

// ============================================================================
// TABLE CARD COMPONENT
// ============================================================================

interface TableCardProps {
  table: any;
  onClick: () => void;
  waiters: any[];
  onAssignWaiter: (tableId: string, waiterId: string, waiterName: string) => void;
  onCheckout: (tableId: string) => void;
  onRequestOrder: (tableId: string) => void;
  onSeatGuests: (tableId: string, guestCount: number) => void;
}

function TableCard({ table, onClick, waiters, onAssignWaiter, onCheckout, onRequestOrder, onSeatGuests }: TableCardProps) {
  const [cleaningTimeLeft, setCleaningTimeLeft] = useState<number>(0);
  const [isPulsing, setIsPulsing] = useState(false);
  const [seatCount, setSeatCount] = useState(2);

  // Cleaning timer countdown
  useEffect(() => {
    if (table.status === 'Cleaning' && table.cleaningEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((table.cleaningEndTime! - Date.now()) / 1000));
        setCleaningTimeLeft(remaining);
        
        if (remaining === 0) {
          // Auto-reset to Available after timer ends - emit event for parent to handle
          window.dispatchEvent(new CustomEvent('table:reset-status', { 
            detail: { tableId: table.id } 
          }));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [table.status, table.cleaningEndTime, table.id]);

  // Pulsating effect for "Order Ready"
  useEffect(() => {
    if (table.kitchenStatus === 'Ready') {
      const interval = setInterval(() => {
        setIsPulsing(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setIsPulsing(false);
    }
  }, [table.kitchenStatus]);

  const getStatusColor = () => {
    switch (table.status) {
      case 'Available': return 'bg-green-500';
      case 'Reserved': return 'bg-amber-500';
      case 'Occupied': return 'bg-blue-500';
      case 'Eating': return 'bg-purple-500';
      case 'Cleaning': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (table.status) {
      case 'Available': return <CheckCircle className="w-4 h-4" />;
      case 'Reserved': return <Calendar className="w-4 h-4" />;
      case 'Occupied': return <Users className="w-4 h-4" />;
      case 'Eating': return <Utensils className="w-4 h-4" />;
      case 'Cleaning': return <Sparkles className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // All waiters from DB are available for assignment
  const availableWaiters = waiters;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative"
    >
      <div
        className={cn(
          "bg-white cursor-pointer transition-all duration-200 hover:shadow-lg border-2 rounded-xl",
          isPulsing && "animate-pulse border-amber-500 shadow-xl"
        )}
        onClick={onClick}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0", getStatusColor())}>
                {table.displayNumber}
              </div>
            </div>
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border",
              table.status === 'Available' && "bg-green-50 text-green-700 border-green-200",
              table.status === 'Occupied' && "bg-blue-50 text-blue-700 border-blue-200",
              table.status === 'Eating' && "bg-purple-50 text-purple-700 border-purple-200",
              table.status === 'Reserved' && "bg-amber-50 text-amber-700 border-amber-200",
              table.status === 'Cleaning' && "bg-gray-50 text-gray-700 border-gray-200",
            )}>
              {getStatusIcon()}
              {table.status}
            </span>
          </div>

          {/* Capacity & Location */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{table.capacity} seats</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{table.location}</span>
            </div>
          </div>

          {/* Kitchen Status Badge */}
          {table.kitchenStatus === 'Ready' && table.status === 'Eating' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-amber-100 border border-amber-500 rounded-lg p-2 flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-700 text-sm">Order Ready!</span>
            </motion.div>
          )}

          {/* Waiter Assignment */}
          {table.status === 'Occupied' && !table.waiterName && (
            <Select
              onValueChange={(value) => {
                const [waiterId, waiterName] = value.split('|');
                onAssignWaiter(table.id, waiterId, waiterName);
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Assign Waiter" />
              </SelectTrigger>
              <SelectContent>
                {availableWaiters.map((waiter) => (
                  <SelectItem key={waiter.id} value={`${waiter.id}|${waiter.name}`}>
                    {waiter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {table.waiterName && (
            <div className="flex items-center gap-2 text-sm">
              <UserPlus className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700">{table.waiterName}</span>
            </div>
          )}

          {/* Guest Count */}
          {table.guestCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-3 h-3 text-gray-500" />
              <span className="text-gray-700">{table.guestCount} guests</span>
            </div>
          )}

          {/* Cleaning Timer */}
          {table.status === 'Cleaning' && (
            <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Cleaning</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800">
                {formatTime(cleaningTimeLeft)}
              </span>
            </div>
          )}

          {/* Seat Guests (Available tables) */}
          {table.status === 'Available' && (
            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSeatCount(Math.max(1, seatCount - 1))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="flex-1 text-center text-sm font-medium text-gray-900">{seatCount} guests</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setSeatCount(Math.min(table.capacity, seatCount + 1))}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => { e.stopPropagation(); onSeatGuests(table.id, seatCount); }}
              >
                <ChevronsRight className="w-4 h-4 mr-1" />
                Seat Guests
              </Button>
            </div>
          )}

          {/* Request Order Button */}
          {(table.status === 'Occupied' || table.status === 'Eating') && !table.currentOrderId && (
            <Button
              size="sm"
              className="w-full bg-stone-800 hover:bg-stone-900 text-white"
              onClick={(e) => { e.stopPropagation(); onRequestOrder(table.id); }}
            >
              <Utensils className="w-4 h-4 mr-1" />
              Request Order
            </Button>
          )}

          {/* Checkout Button */}
          {table.status === 'Eating' && table.currentOrderId && (
            <Button
              size="sm"
              className="w-full bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
              onClick={(e) => {
                e.stopPropagation();
                onCheckout(table.id);
              }}
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Checkout
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// RESERVATION CARD COMPONENT (Brown & White Theme)
// ============================================================================

interface ReservationCardProps {
  table: any;
  onCancel: (tableId: string) => void;
}

function ReservationCard({ table, onCancel }: ReservationCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white border-2 border-stone-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          {/* Table Number */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-stone-800 text-white rounded-lg flex items-center justify-center font-bold text-lg">
              {table.displayNumber}
            </div>
            <div>
              <p className="text-sm text-stone-500">Table • {table.capacity} Seats</p>
              <p className="text-xs text-stone-400">{table.location}</p>
            </div>
          </div>

          {/* Time Slot */}
          {table.reservationSlot && (
            <div className="flex items-center gap-2 text-amber-900">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-sm">{table.reservationSlot}</span>
            </div>
          )}

          {/* Guest Count */}
          <div className="flex items-center gap-2 text-stone-700">
            <Users className="w-4 h-4" />
            <span className="text-sm">{table.guestCount} Guests</span>
          </div>

          {/* Status */}
          <div className="inline-block">
            <span className="text-xs font-medium text-stone-800 bg-stone-100 px-3 py-1 rounded-full border border-stone-300">
              {table.reservationStatus}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          size="sm"
          className="border-stone-300 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
          onClick={() => onCancel(table.id)}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// WALK-IN MODAL COMPONENT
// ============================================================================

interface WalkInModalProps {
  open: boolean;
  onClose: () => void;
  tables: any[];
  onSelectTable: (tableId: string, guestCount: number) => void;
}

function WalkInModal({ open, onClose, tables, onSelectTable }: WalkInModalProps) {
  const [guestCount, setGuestCount] = useState(2);
  const [location, setLocation] = useState<Location | 'All'>('All');
  const [segment, setSegment] = useState<Segment | 'All'>('All');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);

  const eligibleTables = tables.filter(t => {
    if (t.status !== 'Available') return false;
    if (t.capacity < guestCount) return false;
    if (location !== 'All' && t.location !== location) return false;
    if (segment !== 'All' && t.segment !== segment) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              <Button variant="outline" size="lg" onClick={() => setGuestCount(Math.max(1, guestCount - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{guestCount}</span>
              </div>
              <Button variant="outline" size="lg" onClick={() => setGuestCount(guestCount + 1)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <Label>Location Preference (Optional)</Label>
            <Select value={location} onValueChange={(v) => setLocation(v as Location | 'All')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={segment} onValueChange={(v) => setSegment(v as Segment | 'All')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map(slot => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Available Tables */}
          <div className="space-y-2">
            <Label>Available Tables (Capacity ≥ {guestCount})</Label>
            {eligibleTables.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tables available matching your criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-2">
                {eligibleTables.map(table => (
                  <Button
                    key={table.id}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-500"
                    onClick={() => { onSelectTable(table.id, guestCount); onClose(); }}
                  >
                    <TableIllustration capacity={table.capacity} />
                    <div className="font-bold text-gray-900">{table.displayNumber}</div>
                    <div className="text-xs text-gray-600">{table.location} — {table.segment}</div>
                    <Badge variant="secondary" className="text-xs">Seats {table.capacity}</Badge>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TableManagementComprehensive() {
  const { user } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | 'All'>('All');
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('floor');
  
  // Add Table Dialog State
  const [addTableDialogOpen, setAddTableDialogOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableLocation, setNewTableLocation] = useState<Location>('Main Hall');
  const [newTableSegment, setNewTableSegment] = useState('Front');
  const [creatingTable, setCreatingTable] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [tablesRes, staffRes] = await Promise.all([
        tablesApi.list(),
        staffApi.list({ role: 'Waiter' })
      ]);
      
      // Transform tables data to match component expectations
      const normalizeStatus = (s: string): TableStatus => {
        const map: Record<string, TableStatus> = {
          available: 'Available', occupied: 'Occupied', reserved: 'Reserved',
          cleaning: 'Cleaning', eating: 'Eating',
        };
        return map[s?.toLowerCase()] ?? 'Available';
      };

      const tablesData = Array.isArray(tablesRes) ? tablesRes : (tablesRes.data || []);
      const transformedTables = tablesData.map((t: any) => ({
        id: t._id || t.id,
        displayNumber: t.displayNumber || t.display_number || t.name || t.tableNumber || t.table_number || `#${String(t._id || t.id).slice(-4)}`,
        number: t.displayNumber || t.display_number || t.name || t.tableNumber || t.number,
        capacity: t.capacity,
        location: t.location,
        segment: t.segment,
        status: normalizeStatus(t.status),
        guestCount: t.guestCount ?? t.currentGuests ?? 0,
        currentOrderId: t.currentOrderId,
        waiterId: t.waiterId || t.assignedWaiterId,
        waiterName: t.waiterName || t.assignedWaiterName,
        kitchenStatus: t.kitchenStatus,
        cleaningEndTime: t.cleaningEndTime,
        reservationSlot: t.reservation?.timeSlot || t.reservationSlot,
        reservationStatus: t.reservation?.status || t.reservationStatus,
        reservationType: t.reservation?.type || t.reservationType,
      }));
      setTables(transformedTables);
      
      // Transform waiters data
      const staffData = Array.isArray(staffRes) ? staffRes : ((staffRes as any).data || []);
      const transformedWaiters = staffData.map((s: any) => ({
        id: s._id || s.id,
        name: s.name,
        assignedTableId: s.assignedTableId
      }));
      setWaiters(transformedWaiters);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWaiter = async (tableId: string, waiterId: string, waiterName: string) => {
    try {
      await tablesApi.assignWaiter(tableId, waiterId, waiterName);
      // Also update existing order for this table with the waiter info
      const table = tables.find(t => t.id === tableId);
      if (table?.currentOrderId) {
        try {
          await ordersApi.update(table.currentOrderId, { waiterId, waiterName });
        } catch (e) {
          console.warn('Could not update order with waiter info:', e);
        }
      }
      toast.success(`${waiterName} assigned to table`);
      fetchData();
    } catch (error) {
      toast.error('Failed to assign waiter');
    }
  };

  const handleCheckout = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      // Update order to bill_requested
      if (table.currentOrderId) {
        await ordersApi.updateStatus(table.currentOrderId, 'bill_requested');
      }

      toast.success('Checkout initiated - Bill requested');
      fetchData();
    } catch (error) {
      toast.error('Failed to initiate checkout');
    }
  };

  const handleWalkIn = async () => {
    setWalkInModalOpen(true);
  };

  const handleSelectTableForWalkIn = async (tableId: string, guestCount: number) => {
    try {
      await tablesApi.updateStatus(tableId, 'occupied', guestCount);
      toast.success('Table marked as Occupied');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign table');
    }
  };

  const handleCancelReservation = async (tableId: string) => {
    try {
      await tablesApi.updateStatus(tableId, 'available');
      toast.success('Reservation cancelled');
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel reservation');
    }
  };

  const handleSeatGuests = async (tableId: string, guestCount: number) => {
    try {
      await tablesApi.updateStatus(tableId, 'occupied', guestCount);
      toast.success(`Table seated with ${guestCount} guest${guestCount !== 1 ? 's' : ''}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to seat guests');
    }
  };

  const handleRequestOrder = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Determine waiterId: use table's assigned waiter, or auto-assign if current user is a waiter
    let waiterId = table.waiterId || null;
    let waiterName = table.waiterName || null;

    if (!waiterId && user?.role === 'waiter') {
      // Auto-assign the current waiter to this table and order
      waiterId = user.id;
      waiterName = user.name;
      try {
        await tablesApi.assignWaiter(tableId, waiterId, waiterName);
      } catch (e) {
        console.warn('Could not auto-assign waiter to table:', e);
      }
    }

    if (!waiterId) {
      toast.error('Please assign a waiter to this table first');
      return;
    }

    try {
      const order = await ordersApi.create({
        tableId,
        tableNumber: table.displayNumber,
        waiterId,
        waiterName,
        type: 'dine-in',
        status: 'placed',
        items: [],
        total: 0,
        notes: '',
      });
      await tablesApi.update(tableId, { currentOrderId: order._id || order.id, status: 'occupied' });
      toast.success(`Order created for table ${table.displayNumber}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to create order request');
    }
  };

  // Handle creating a new table
  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }
    
    setCreatingTable(true);
    try {
      const tableData = {
        name: newTableName,
        displayNumber: newTableName,
        capacity: newTableCapacity,
        location: newTableLocation,
        segment: newTableSegment,
        status: 'available',
        reservationType: 'None',
        guestCount: 0
      };
      
      await tablesApi.create(tableData);
      
      toast.success(`Table ${newTableName} created successfully`);
      setAddTableDialogOpen(false);
      // Reset form
      setNewTableName('');
      setNewTableCapacity(4);
      setNewTableLocation('Main Hall');
      setNewTableSegment('Front');
      fetchData();
    } catch (error) {
      console.error('Error creating table:', error);
      toast.error('Failed to create table');
    } finally {
      setCreatingTable(false);
    }
  };

  const filteredTables = selectedLocation === 'All'
    ? tables
    : tables.filter(t => t.location === selectedLocation);

  const reservationTables = tables.filter(
    t => t.reservationStatus && !['Cancelled', 'Expired'].includes(t.reservationStatus)
  );

  const groupedTables: Record<string, any[]> = filteredTables.reduce((acc: Record<string, any[]>, table) => {
    const location = table.location || 'Other';
    if (!acc[location as Location]) {
      acc[location as Location] = [];
    }
    acc[location as Location].push(table);
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return <LoadingTables />;
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#FDFCFB' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage restaurant floor</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
            onClick={() => setAddTableDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
          <Button
            className="bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
            onClick={handleWalkIn}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Walk-In Entry
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Available', count: tables.filter(t => t.status === 'Available').length, color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
          { label: 'Occupied', count: tables.filter(t => t.status === 'Occupied' || t.status === 'Eating').length, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Reserved', count: tables.filter(t => t.status === 'Reserved').length, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Cleaning', count: tables.filter(t => t.status === 'Cleaning').length, color: 'bg-gray-400', text: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
        ].map(({ label, count, color, text, bg }) => (
          <div key={label} className={`flex items-center gap-3 rounded-lg border p-3 ${bg}`}>
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className={`text-xs font-medium ${text}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white">
          <TabsTrigger value="floor">Floor Plan</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>

        {/* Floor Plan Tab */}
        <TabsContent value="floor" className="space-y-6">
          {/* Location Filter */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Filter by Location:</Label>
              <div className="flex gap-2">
                {(['All', 'VIP', 'Main Hall', 'AC Hall'] as const).map((loc) => (
                  <Button
                    key={loc}
                    variant={selectedLocation === loc ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLocation(loc)}
                    className={cn(
                      selectedLocation === loc && 'bg-[#8B5A2B] text-white hover:bg-[#6B4520]'
                    )}
                  >
                    {loc}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tables Grid */}
          {Object.keys(groupedTables).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-stone-300 rounded-xl bg-white">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="w-10 h-10 text-stone-400" />
              </div>
              <h3 className="text-xl font-semibold text-stone-700 mb-1">
                {tables.length === 0 ? 'No tables yet' : 'No tables match this filter'}
              </h3>
              <p className="text-stone-400 text-sm mb-6">
                {tables.length === 0
                  ? 'Get started by adding your first table to the floor plan.'
                  : 'Try selecting a different location filter.'}
              </p>
              {tables.length === 0 && (
                <Button
                  className="bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
                  onClick={() => setAddTableDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Table
                </Button>
              )}
            </div>
          ) : (
            Object.entries(groupedTables).map(([location, locationTables]) => (
              <div key={location} className="space-y-3">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#8B5A2B]" />
                  {location}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <AnimatePresence>
                    {locationTables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        onClick={() => {}}
                        waiters={waiters}
                        onAssignWaiter={handleAssignWaiter}
                        onCheckout={handleCheckout}
                        onRequestOrder={handleRequestOrder}
                        onSeatGuests={handleSeatGuests}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-900">Reservation Log</h2>
                <p className="text-stone-600 text-sm mt-1">Upcoming and active bookings</p>
              </div>
              <Badge variant="outline" className="text-stone-800 border-stone-400">
                {reservationTables.length} Active
              </Badge>
            </div>

            <div className="space-y-3">
              {reservationTables.length === 0 ? (
                <div className="text-center py-12 text-stone-500">
                  <Calendar className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No reservations</p>
                  <p className="text-sm text-stone-400 mt-1">All tables are available</p>
                </div>
              ) : (
                <AnimatePresence>
                  {reservationTables.map((table) => (
                    <ReservationCard
                      key={table.id}
                      table={table}
                      onCancel={handleCancelReservation}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Table Dialog */}
      <Dialog open={addTableDialogOpen} onOpenChange={setAddTableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>
              Create a new table for the restaurant floor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Table Name */}
            <div className="space-y-2">
              <Label htmlFor="tableName">Table Name / Number</Label>
              <Input
                id="tableName"
                placeholder="e.g., T1, A1, V1"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
              />
            </div>
            
            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (seats)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={20}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(Number(e.target.value))}
              />
            </div>
            
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={newTableLocation}
                onValueChange={(value) => setNewTableLocation(value as Location)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Main Hall">Main Hall</SelectItem>
                  <SelectItem value="AC Hall">AC Hall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Segment */}
            <div className="space-y-2">
              <Label htmlFor="segment">Segment</Label>
              <Select
                value={newTableSegment}
                onValueChange={(value) => setNewTableSegment(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Front">Front</SelectItem>
                  <SelectItem value="Middle">Middle</SelectItem>
                  <SelectItem value="Back">Back</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddTableDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={creatingTable || !newTableName.trim()}
              className="bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
            >
              {creatingTable ? 'Creating...' : 'Create Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WalkInModal
        open={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        tables={tables}
        onSelectTable={handleSelectTableForWalkIn}
      />
    </div>
  );
}
