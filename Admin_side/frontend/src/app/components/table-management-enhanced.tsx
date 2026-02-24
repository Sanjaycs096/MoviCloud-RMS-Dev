import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTableStore, WAITER_ROSTER, TableStatus, TableEntity } from '@/app/contexts/table-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Clock, 
  Utensils, 
  Sparkles, 
  AlertCircle,
  Calendar,
  TrendingUp,
  Activity,
  Coffee,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/app/components/ui/utils';

// ==================== TIME SLOTS ====================

const TIME_SLOTS = [
  '8:00 AM – 9:00 AM',
  '9:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 1:00 PM',
  '1:00 PM – 2:00 PM',
  '2:00 PM – 3:00 PM',
  '3:00 PM – 4:00 PM',
  '4:00 PM – 5:00 PM',
  '5:00 PM – 6:00 PM',
  '6:00 PM – 7:00 PM',
  '7:00 PM – 8:00 PM',
  '8:00 PM – 9:00 PM',
  '9:00 PM – 10:00 PM',
];

// ==================== TABLE ILLUSTRATION COMPONENT ====================

function TableIllustration({ capacity, status }: { capacity: 2 | 4 | 6; status: TableStatus }) {
  const getChairColor = () => {
    switch (status) {
      case 'Available':
        return '#10b981'; // green
      case 'Reserved':
        return '#f97316'; // orange
      case 'Occupied':
        return '#ef4444'; // red
      case 'Eating':
        return '#3b82f6'; // blue
      case 'Cleaning':
        return '#a855f7'; // purple
    }
  };

  const chairColor = getChairColor();

  if (capacity === 2) {
    return (
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Left Chair */}
        <div className="absolute left-2" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <div className="w-4 h-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
        
        {/* Table */}
        <div className="w-16 h-20 rounded-lg border-4" style={{ borderColor: chairColor, backgroundColor: '#ffffff' }} />
        
        {/* Right Chair */}
        <div className="absolute right-2" style={{ top: '50%', transform: 'translateY(-50%)' }}>
          <div className="w-4 h-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
      </div>
    );
  }

  if (capacity === 4) {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Top Chair */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <div className="h-4 w-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
        
        {/* Left Chair */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
        
        {/* Table */}
        <div className="w-24 h-24 rounded-xl border-4" style={{ borderColor: chairColor, backgroundColor: '#ffffff' }} />
        
        {/* Right Chair */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-4 h-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
        
        {/* Bottom Chair */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="h-4 w-12 rounded" style={{ backgroundColor: chairColor }} />
        </div>
      </div>
    );
  }

  // 6-Seater
  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      {/* Top Left Chair */}
      <div className="absolute top-2 left-8">
        <div className="h-4 w-10 rounded" style={{ backgroundColor: chairColor }} />
      </div>
      
      {/* Top Right Chair */}
      <div className="absolute top-2 right-8">
        <div className="h-4 w-10 rounded" style={{ backgroundColor: chairColor }} />
      </div>
      
      {/* Left Chair */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <div className="w-4 h-14 rounded" style={{ backgroundColor: chairColor }} />
      </div>
      
      {/* Table */}
      <div className="w-28 h-28 rounded-2xl border-4" style={{ borderColor: chairColor, backgroundColor: '#ffffff' }} />
      
      {/* Right Chair */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <div className="w-4 h-14 rounded" style={{ backgroundColor: chairColor }} />
      </div>
      
      {/* Bottom Left Chair */}
      <div className="absolute bottom-2 left-8">
        <div className="h-4 w-10 rounded" style={{ backgroundColor: chairColor }} />
      </div>
      
      {/* Bottom Right Chair */}
      <div className="absolute bottom-2 right-8">
        <div className="h-4 w-10 rounded" style={{ backgroundColor: chairColor }} />
      </div>
    </div>
  );
}

// ==================== TABLE CARD COMPONENT ====================

interface TableCardProps {
  table: TableEntity;
  onAssignWaiter: () => void;
  onGuestsArrived: () => void;
  onCheckout: () => void;
}

function TableCard({ table, onAssignWaiter, onGuestsArrived, onCheckout }: TableCardProps) {
  const getStatusColor = (status: TableStatus): string => {
    switch (status) {
      case 'Available':
        return 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300';
      case 'Reserved':
        return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300';
      case 'Occupied':
        return 'bg-gradient-to-br from-rose-50 to-red-100 border-red-300';
      case 'Eating':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300';
      case 'Cleaning':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300';
    }
  };

  const getStatusBadgeColor = (status: TableStatus): string => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-600 text-white';
      case 'Reserved':
        return 'bg-orange-600 text-white';
      case 'Occupied':
        return 'bg-red-600 text-white';
      case 'Eating':
        return 'bg-blue-600 text-white';
      case 'Cleaning':
        return 'bg-purple-600 text-white';
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="h-4 w-4" />;
      case 'Reserved':
        return <Clock className="h-4 w-4" />;
      case 'Occupied':
        return <Users className="h-4 w-4" />;
      case 'Eating':
        return <Utensils className="h-4 w-4" />;
      case 'Cleaning':
        return <Sparkles className="h-4 w-4" />;
    }
  };

  // Calculate cleaning countdown
  const getCleaningCountdown = (): string => {
    if (table.Status !== 'Cleaning' || !table.Timers.CleaningStart) return '';
    const elapsed = Date.now() - table.Timers.CleaningStart;
    const remaining = Math.max(0, 300000 - elapsed); // 5 min = 300000ms
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate reservation countdown
  const getReservationCountdown = (): string => {
    if (table.Status !== 'Reserved' || !table.Timers.ReservationStart) return '';
    const elapsed = Date.now() - table.Timers.ReservationStart;
    const remaining = Math.max(0, 900000 - elapsed); // 15 min = 900000ms
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card className={cn('border-2 shadow-lg hover:shadow-2xl transition-all overflow-hidden', getStatusColor(table.Status))}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-black tracking-tight">{table.Number}</CardTitle>
              <p className="text-sm font-semibold text-gray-600 mt-1">
                <Users className="inline h-3 w-3 mr-1" />
                {table.Capacity} Seater
              </p>
            </div>
            <Badge className={cn('px-3 py-1 font-bold text-sm flex items-center gap-1', getStatusBadgeColor(table.Status))}>
              {getStatusIcon(table.Status)}
              {table.Status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Table Illustration */}
          <div className="flex justify-center py-2">
            <TableIllustration capacity={table.Capacity} status={table.Status} />
          </div>

          {/* Waiter Info */}
          {table.WaiterName && (
            <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assigned Waiter</p>
              <p className="text-lg font-black text-gray-800 mt-1">{table.WaiterName}</p>
            </div>
          )}

          {/* Timers */}
          {table.Status === 'Cleaning' && (
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs font-bold text-purple-700 uppercase">Cleaning</p>
                <p className="text-xl font-black text-purple-900">{getCleaningCountdown()}</p>
              </div>
            </div>
          )}

          {table.Status === 'Reserved' && (
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-orange-700 uppercase">Reservation Expires</p>
                <p className="text-xl font-black text-orange-900">{getReservationCountdown()}</p>
              </div>
            </div>
          )}

          {/* Reservation Details */}
          {table.ReservationSlot && (
            <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Time Slot</p>
              <p className="text-sm font-bold text-gray-800 mt-1">
                {table.ReservationSlot.Start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {table.ReservationSlot.End.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
              {table.ReservationSlot.CustomerName && (
                <p className="text-xs text-gray-600 mt-1">Customer: {table.ReservationSlot.CustomerName}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {table.Status === 'Reserved' && (
              <Button 
                onClick={onGuestsArrived} 
                className="w-full bg-green-600 hover:bg-green-700 font-bold"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Guests Arrived
              </Button>
            )}

            {table.Status === 'Occupied' && !table.WaiterName && (
              <Button 
                onClick={onAssignWaiter} 
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Waiter
              </Button>
            )}

            {(table.Status === 'Eating' || table.Status === 'Occupied') && table.WaiterName && (
              <Button 
                onClick={onCheckout} 
                className="w-full bg-amber-600 hover:bg-amber-700 font-bold"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Checkout & Pay
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ==================== WALK-IN DIALOG ====================

interface WalkInDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (tableID: string, waiterID: string, waiterName: string, timeSlot: string, customerName: string) => void;
}

function WalkInDialog({ open, onClose, onComplete }: WalkInDialogProps) {
  const { state } = useTableStore();
  const [step, setStep] = useState(1);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [location, setLocation] = useState<'VIP' | 'Main Hall' | 'AC Hall'>('VIP');
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<{ id: string; name: string } | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');

  // Map display location names to actual location values
  const getActualLocation = (displayLocation: 'VIP' | 'Main Hall' | 'AC Hall'): 'VIP' | 'Main' | 'AC' => {
    if (displayLocation === 'Main Hall') return 'Main';
    if (displayLocation === 'AC Hall') return 'AC';
    return 'VIP';
  };

  const availableTables = state.tables.filter(t => 
    t.Status === 'Available' && 
    t.Capacity >= guestCount &&
    t.Location === getActualLocation(location)
  );

  const busyWaiters = state.tables
    .filter(t => (t.Status === 'Occupied' || t.Status === 'Eating') && t.WaiterID)
    .map(t => t.WaiterID);

  const availableWaiters = WAITER_ROSTER.filter(w => !busyWaiters.includes(w.id));

  const handleComplete = () => {
    if (!selectedTable || !selectedWaiter || !selectedTimeSlot) {
      toast.error('Please complete all steps');
      return;
    }
    onComplete(selectedTable.ID, selectedWaiter.id, selectedWaiter.name, selectedTimeSlot, customerName);
    onClose();
    // Reset
    setStep(1);
    setGuestCount(2);
    setLocation('VIP');
    setSelectedTable(null);
    setSelectedWaiter(null);
    setSelectedTimeSlot('');
    setCustomerName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black">New Walk-In Booking</DialogTitle>
          <DialogDescription className="text-lg">
            Step {step} of 4 - Complete the walk-in assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                  step >= s ? 'bg-[#8B5A2B] text-white' : 'bg-gray-200 text-gray-500'
                )}>
                  {s}
                </div>
                {s < 4 && <ChevronRight className="h-5 w-5 mx-2 text-gray-400" />}
              </div>
            ))}
          </div>

          {/* Step 1: Guest Count & Location */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <Label className="text-xl font-bold mb-4 block">How many guests?</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[2, 4, 6].map((count) => (
                    <Button
                      key={count}
                      type="button"
                      variant={guestCount === count ? 'default' : 'outline'}
                      className={cn(
                        'h-24 text-2xl font-black',
                        guestCount === count && 'bg-[#8B5A2B] hover:bg-[#6D421E]'
                      )}
                      onClick={() => setGuestCount(count)}
                    >
                      <Users className="mr-2 h-8 w-8" />
                      {count} Guests
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xl font-bold mb-4 block">Preferred Location?</Label>
                <div className="grid grid-cols-3 gap-4">
                  {['VIP', 'Main Hall', 'AC Hall'].map((loc) => (
                    <Button
                      key={loc}
                      type="button"
                      variant={location === loc ? 'default' : 'outline'}
                      className={cn(
                        'h-16 text-lg font-bold',
                        location === loc && 'bg-[#8B5A2B] hover:bg-[#6D421E]'
                      )}
                      onClick={() => setLocation(loc as any)}
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => setStep(2)} 
                className="w-full h-14 text-lg font-bold bg-[#8B5A2B] hover:bg-[#6D421E]"
                disabled={availableTables.length === 0}
              >
                Next: Select Table ({availableTables.length} Available)
              </Button>
            </motion.div>
          )}

          {/* Step 2: Table Selection */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Label className="text-xl font-bold">Choose a table ({availableTables.length} available)</Label>
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                {availableTables.map((table) => (
                  <Card
                    key={table.ID}
                    className={cn(
                      'cursor-pointer border-2 transition-all hover:shadow-lg',
                      selectedTable?.ID === table.ID ? 'border-[#8B5A2B] bg-[#F7F3EE]' : 'border-gray-200'
                    )}
                    onClick={() => setSelectedTable(table)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-3xl font-black">{table.Number}</p>
                          <p className="text-sm text-gray-600 font-semibold mt-1">
                            <Users className="inline h-3 w-3 mr-1" />
                            {table.Capacity} Seater
                          </p>
                        </div>
                        {selectedTable?.ID === table.ID && (
                          <CheckCircle className="h-8 w-8 text-[#8B5A2B]" />
                        )}
                      </div>
                      <div className="flex justify-center">
                        <TableIllustration capacity={table.Capacity} status="Available" />
                      </div>
                      <p className="text-xs text-gray-500 font-semibold text-center mt-3">
                        {table.Location} • {table.Segment}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => setStep(1)} 
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="flex-1 h-14 text-lg font-bold bg-[#8B5A2B] hover:bg-[#6D421E]"
                  disabled={!selectedTable}
                >
                  Next: Time Slot
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Time Slot Selection */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <Label className="text-xl font-bold mb-4 block">Select Time Slot</Label>
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTimeSlot === slot ? 'default' : 'outline'}
                      className={cn(
                        'h-14 text-base font-bold justify-start',
                        selectedTimeSlot === slot && 'bg-[#8B5A2B] hover:bg-[#6D421E]'
                      )}
                      onClick={() => setSelectedTimeSlot(slot)}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-lg font-bold mb-2 block">Customer Name (Optional)</Label>
                <Input 
                  placeholder="Enter customer name..."
                  className="h-14 text-lg"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => setStep(2)} 
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  className="flex-1 h-14 text-lg font-bold bg-[#8B5A2B] hover:bg-[#6D421E]"
                  disabled={!selectedTimeSlot}
                >
                  Next: Assign Waiter
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Waiter Assignment */}
          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Label className="text-xl font-bold">Assign Waiter</Label>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900">
                  <AlertCircle className="inline h-5 w-5 mr-2" />
                  {availableWaiters.length} waiters available ({WAITER_ROSTER.length - availableWaiters.length} busy)
                </p>
              </div>

              <div className="space-y-3">
                {availableWaiters.map((waiter) => (
                  <Card
                    key={waiter.id}
                    className={cn(
                      'cursor-pointer border-2 transition-all hover:shadow-md',
                      selectedWaiter?.id === waiter.id ? 'border-[#8B5A2B] bg-[#F7F3EE]' : 'border-gray-200'
                    )}
                    onClick={() => setSelectedWaiter(waiter)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{waiter.name}</p>
                          <p className="text-sm text-emerald-600 font-semibold">✓ Available</p>
                        </div>
                      </div>
                      {selectedWaiter?.id === waiter.id && (
                        <CheckCircle className="h-6 w-6 text-[#8B5A2B]" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {busyWaiters.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-bold text-gray-500 uppercase mb-2">Busy Waiters</p>
                  {WAITER_ROSTER.filter(w => busyWaiters.includes(w.id)).map((waiter) => (
                    <div key={waiter.id} className="bg-gray-100 rounded-lg p-3 mb-2 opacity-50">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-bold text-gray-700">{waiter.name}</p>
                          <p className="text-xs text-red-600 font-semibold">● Currently Serving</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={() => setStep(3)} 
                  variant="outline"
                  className="flex-1 h-14 text-lg font-bold"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1 h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                  disabled={!selectedWaiter}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete Walk-In
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== WAITER ASSIGNMENT DIALOG ====================

interface WaiterDialogProps {
  open: boolean;
  onClose: () => void;
  table: TableEntity | null;
  onAssign: (waiterID: string, waiterName: string) => void;
}

function WaiterAssignmentDialog({ open, onClose, table, onAssign }: WaiterDialogProps) {
  const { state } = useTableStore();
  const [selectedWaiter, setSelectedWaiter] = useState<{ id: string; name: string } | null>(null);

  if (!table) return null;

  const busyWaiters = state.tables
    .filter(t => (t.Status === 'Occupied' || t.Status === 'Eating') && t.WaiterID)
    .map(t => t.WaiterID);

  const availableWaiters = WAITER_ROSTER.filter(w => !busyWaiters.includes(w.id));

  const handleAssign = () => {
    if (!selectedWaiter) {
      toast.error('Please select a waiter');
      return;
    }
    onAssign(selectedWaiter.id, selectedWaiter.name);
    onClose();
    setSelectedWaiter(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Assign Waiter to Table {table.Number}</DialogTitle>
          <DialogDescription className="text-lg">
            Select an available waiter from the list below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold text-blue-900">
              <AlertCircle className="inline h-5 w-5 mr-2" />
              {availableWaiters.length} waiters available
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availableWaiters.map((waiter) => (
              <Card
                key={waiter.id}
                className={cn(
                  'cursor-pointer border-2 transition-all hover:shadow-md',
                  selectedWaiter?.id === waiter.id ? 'border-[#8B5A2B] bg-[#F7F3EE]' : 'border-gray-200'
                )}
                onClick={() => setSelectedWaiter(waiter)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{waiter.name}</p>
                      <p className="text-sm text-emerald-600 font-semibold">✓ Available</p>
                    </div>
                  </div>
                  {selectedWaiter?.id === waiter.id && (
                    <CheckCircle className="h-6 w-6 text-[#8B5A2B]" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {busyWaiters.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-bold text-gray-500 uppercase mb-2">Busy Waiters</p>
              {WAITER_ROSTER.filter(w => busyWaiters.includes(w.id)).map((waiter) => (
                <div key={waiter.id} className="bg-gray-100 rounded-lg p-3 mb-2 opacity-50">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-700">{waiter.name}</p>
                      <p className="text-xs text-red-600 font-semibold">● Currently Serving</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-12 px-8 font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedWaiter}
            className="h-12 px-8 font-bold bg-[#8B5A2B] hover:bg-[#6D421E]"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Assign Waiter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN COMPONENT ====================

export function TableManagementEnhanced() {
  const { state, assignWaiter, guestsArrived, checkoutAndPay, setReservation, dispatch } = useTableStore();
  const [selectedTable, setSelectedTable] = useState<TableEntity | null>(null);
  const [waiterDialogOpen, setWaiterDialogOpen] = useState(false);
  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);

  // Listen for order:served events from Order Management to update table status
  useEffect(() => {
    const handleOrderServed = (event: CustomEvent) => {
      const { tableNumber, orderId } = event.detail;
      
      console.log('[Table Management] order:served event received:', { tableNumber, orderId });
      
      // Find the table by its number
      const table = state.tables.find(t => {
        // Match table number (e.g., "V1", "M1", "A1")
        const tableNum = parseInt(tableNumber.toString());
        const tableId = t.Number;
        const match = tableId.includes(tableNum.toString()) || parseInt(tableId.replace(/\D/g, '')) === tableNum;
        console.log(`[Table Management] Checking table ${tableId} against ${tableNumber}:`, match);
        return match;
      });

      console.log('[Table Management] Found table:', table ? `${table.Number} (Status: ${table.Status})` : 'null');

      if (table && table.Status === 'Occupied') {
        console.log(`[Table Management] Updating table ${table.Number} to Eating`);
        // Update table status to Eating
        dispatch({ type: 'SET_TABLE_STATUS', payload: { tableID: table.ID, status: 'Eating' } });
        toast.success(`Table ${table.Number} status updated to Eating!`, {
          description: 'Order has been served',
        });
      } else if (table) {
        console.log(`[Table Management] Table ${table.Number} is in ${table.Status} state, not Occupied. Cannot update to Eating.`);
        // Still update if it makes sense
        if (table.Status !== 'Available' && table.Status !== 'Cleaning') {
          console.log(`[Table Management] Force updating table ${table.Number} to Eating anyway`);
          dispatch({ type: 'SET_TABLE_STATUS', payload: { tableID: table.ID, status: 'Eating' } });
          toast.success(`Table ${table.Number} status updated to Eating!`, {
            description: 'Order has been served',
          });
        }
      }
    };

    window.addEventListener('order:served' as any, handleOrderServed);
    
    return () => {
      window.removeEventListener('order:served' as any, handleOrderServed);
    };
  }, [state.tables, dispatch]);

  // Group tables by location and segment
  const groupedTables = state.tables.reduce((acc, table) => {
    const key = `${table.Location}-${table.Segment}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(table);
    return acc;
  }, {} as Record<string, TableEntity[]>);

  const handleAssignWaiter = (table: TableEntity) => {
    if (table.Status !== 'Occupied') {
      toast.error('Can only assign waiters to occupied tables');
      return;
    }
    setSelectedTable(table);
    setWaiterDialogOpen(true);
  };

  const handleWaiterAssign = (waiterID: string, waiterName: string) => {
    if (selectedTable) {
      assignWaiter(selectedTable.ID, waiterID, waiterName);
      toast.success(`${waiterName} assigned to Table ${selectedTable.Number}`);
    }
  };

  const handleGuestsArrived = (table: TableEntity) => {
    if (table.Status === 'Reserved') {
      guestsArrived(table.ID);
      toast.success(`Table ${table.Number} is now occupied. Please assign a waiter.`);
    }
  };

  const handleCheckout = (table: TableEntity) => {
    checkoutAndPay(table.ID);
    toast.success(`Table ${table.Number} checked out. Cleaning will take 5 minutes.`);
  };

  const handleWalkInComplete = (
    tableID: string, 
    waiterID: string, 
    waiterName: string, 
    timeSlot: string,
    customerName: string
  ) => {
    const table = state.tables.find(t => t.ID === tableID);
    if (!table) return;

    // Parse time slot
    const [startTime] = timeSlot.split(' – ');
    const start = new Date();
    const [time, period] = startTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    start.setHours(hours, minutes || 0, 0, 0);
    
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour later

    // Set reservation with time slot
    setReservation(tableID, {
      Start: start,
      End: end,
      CustomerName: customerName || undefined
    });

    // Immediately mark as occupied and assign waiter
    setTimeout(() => {
      guestsArrived(tableID);
      setTimeout(() => {
        assignWaiter(tableID, waiterID, waiterName);
        toast.success(`Walk-in complete! Table ${table.Number} assigned to ${waiterName}`);
      }, 100);
    }, 100);
  };

  // Statistics
  const stats = {
    available: state.tables.filter(t => t.Status === 'Available').length,
    reserved: state.tables.filter(t => t.Status === 'Reserved').length,
    occupied: state.tables.filter(t => t.Status === 'Occupied').length,
    eating: state.tables.filter(t => t.Status === 'Eating').length,
    cleaning: state.tables.filter(t => t.Status === 'Cleaning').length,
  };

  return (
    <div className="bg-table-management-module p-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="module-container flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-lg">Table Management</h1>
          <p className="text-gray-200 font-medium text-xl mt-2 italic">
            Floor Command Center with Walk-In Booking
          </p>
        </div>
        <Button 
          onClick={() => setWalkInDialogOpen(true)}
          className="h-14 px-8 rounded-2xl bg-[#8B5A2B] hover:bg-[#6D421E] shadow-xl text-lg font-bold"
        >
          <UserPlus className="mr-2 h-6 w-6" />
          New Walk-In
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-700 uppercase">Available</p>
                <p className="text-4xl font-black text-emerald-900 mt-1">{stats.available}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-700 uppercase">Reserved</p>
                <p className="text-4xl font-black text-orange-900 mt-1">{stats.reserved}</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-red-100 border-red-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-red-700 uppercase">Occupied</p>
                <p className="text-4xl font-black text-red-900 mt-1">{stats.occupied}</p>
              </div>
              <Users className="h-12 w-12 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-700 uppercase">Eating</p>
                <p className="text-4xl font-black text-blue-900 mt-1">{stats.eating}</p>
              </div>
              <Utensils className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-700 uppercase">Cleaning</p>
                <p className="text-4xl font-black text-purple-900 mt-1">{stats.cleaning}</p>
              </div>
              <Sparkles className="h-12 w-12 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid by Location & Segment */}
      <div className="space-y-10">
        {Object.entries(groupedTables).map(([key, tables]) => {
          const [location, segment] = key.split('-');
          return (
            <div key={key}>
              <div className="mb-6">
                <h2 className="text-3xl font-black text-gray-800">
                  {location === 'VIP' ? '👑 VIP Lounge' : location === 'AC' ? '❄️ AC Hall' : '🍽️ Main Hall'}
                  <span className="text-xl font-semibold text-gray-500 ml-4">
                    / {segment} Section
                  </span>
                </h2>
                <div className="h-1 w-32 bg-[#8B5A2B] rounded-full mt-2" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables
                  .sort((a, b) => a.Number.localeCompare(b.Number))
                  .map((table) => (
                    <TableCard
                      key={table.ID}
                      table={table}
                      onAssignWaiter={() => handleAssignWaiter(table)}
                      onGuestsArrived={() => handleGuestsArrived(table)}
                      onCheckout={() => handleCheckout(table)}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <WaiterAssignmentDialog
        open={waiterDialogOpen}
        onClose={() => setWaiterDialogOpen(false)}
        table={selectedTable}
        onAssign={handleWaiterAssign}
      />

      <WalkInDialog
        open={walkInDialogOpen}
        onClose={() => setWalkInDialogOpen(false)}
        onComplete={handleWalkInComplete}
      />
    </div>
  );
}