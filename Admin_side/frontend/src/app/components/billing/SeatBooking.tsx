import { useState } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  UtensilsCrossed, 
  CreditCard,
  AlertCircle,
  IndianRupee,
  Phone,
  Tag
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/app/components/ui/utils';

// --- Types ---
type BookingStatus = 'Pending' | 'Confirmed' | 'Rejected' | 'Completed';
type PaymentFor = 'Table Only' | 'Food Only' | 'Table + Food';

interface BookingRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  guests: number;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  payment: {
    advancePaid: number;
    paidFor: PaymentFor;
    pendingAmount: number;
    balanceToCollect: number;
  };
  preOrderedItems: { 
    name: string; 
    price: number; 
    quantity: number 
  }[];
  status: BookingStatus;
  requestedAt: string;
}

interface TableSlot {
  tableId: number;
  capacity: number;
  slots: {
    time: string;
    status: 'Available' | 'Reserved' | 'Occupied' | 'Buffer';
    bookingId?: string;
  }[];
}

// --- Mock Data ---
const MOCK_BOOKINGS: BookingRequest[] = [
  {
    id: 'BK-2026-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    guests: 4,
    date: new Date().toISOString(),
    timeSlot: {
      start: '19:00',
      end: '20:30'
    },
    payment: {
      advancePaid: 800,
      paidFor: 'Table + Food',
      pendingAmount: 0,
      balanceToCollect: 0
    },
    preOrderedItems: [
      { name: 'Chicken Biryani', price: 250, quantity: 2 },
      { name: 'Butter Naan', price: 40, quantity: 4 },
      { name: 'Paneer Tikka', price: 180, quantity: 1 }
    ],
    status: 'Pending',
    requestedAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: 'BK-2026-002',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 12345',
    guests: 2,
    date: new Date().toISOString(),
    timeSlot: {
      start: '20:00',
      end: '21:30'
    },
    payment: {
      advancePaid: 300,
      paidFor: 'Table Only',
      pendingAmount: 0,
      balanceToCollect: 450
    },
    preOrderedItems: [],
    status: 'Pending',
    requestedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'BK-2026-003',
    customerName: 'Amit Patel',
    customerPhone: '+91 91234 56789',
    guests: 6,
    date: new Date().toISOString(),
    timeSlot: {
      start: '13:00',
      end: '14:30'
    },
    payment: {
      advancePaid: 600,
      paidFor: 'Food Only',
      pendingAmount: 200,
      balanceToCollect: 200
    },
    preOrderedItems: [
      { name: 'Veg Thali', price: 200, quantity: 4 },
      { name: 'Masala Dosa', price: 120, quantity: 2 }
    ],
    status: 'Pending',
    requestedAt: new Date(Date.now() - 7200000).toISOString()
  }
];

// Generate time slots with 15-minute buffer
const generateTimeSlots = () => {
  const slots: string[] = [];
  const startHour = 18;
  const endHour = 23;
  
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

const MOCK_TABLE_SLOTS: TableSlot[] = [
  {
    tableId: 1,
    capacity: 2,
    slots: [
      { time: '18:00', status: 'Available' },
      { time: '18:30', status: 'Available' },
      { time: '19:00', status: 'Reserved', bookingId: 'BK-2026-001' },
      { time: '19:30', status: 'Reserved', bookingId: 'BK-2026-001' },
      { time: '20:00', status: 'Reserved', bookingId: 'BK-2026-001' },
      { time: '20:30', status: 'Buffer' },
      { time: '21:00', status: 'Available' },
      { time: '21:30', status: 'Available' },
    ]
  },
  {
    tableId: 2,
    capacity: 4,
    slots: [
      { time: '18:00', status: 'Occupied' },
      { time: '18:30', status: 'Occupied' },
      { time: '19:00', status: 'Occupied' },
      { time: '19:30', status: 'Buffer' },
      { time: '20:00', status: 'Reserved', bookingId: 'BK-2026-002' },
      { time: '20:30', status: 'Reserved', bookingId: 'BK-2026-002' },
      { time: '21:00', status: 'Reserved', bookingId: 'BK-2026-002' },
      { time: '21:30', status: 'Buffer' },
    ]
  },
  {
    tableId: 3,
    capacity: 6,
    slots: [
      { time: '18:00', status: 'Available' },
      { time: '18:30', status: 'Available' },
      { time: '19:00', status: 'Available' },
      { time: '19:30', status: 'Available' },
      { time: '20:00', status: 'Available' },
      { time: '20:30', status: 'Available' },
      { time: '21:00', status: 'Available' },
      { time: '21:30', status: 'Available' },
    ]
  },
  {
    tableId: 4,
    capacity: 4,
    slots: [
      { time: '18:00', status: 'Reserved', bookingId: 'BK-2026-005' },
      { time: '18:30', status: 'Reserved', bookingId: 'BK-2026-005' },
      { time: '19:00', status: 'Buffer' },
      { time: '19:30', status: 'Available' },
      { time: '20:00', status: 'Available' },
      { time: '20:30', status: 'Available' },
      { time: '21:00', status: 'Available' },
      { time: '21:30', status: 'Available' },
    ]
  },
];

export function SeatBooking() {
  const [bookings, setBookings] = useState<BookingRequest[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState('requests');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingBookings = bookings.filter(b => b.status === 'Pending');
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

  const handleAccept = (id: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'Confirmed' as BookingStatus } : b
    ));
    toast.success('Booking accepted successfully');
  };

  const handleRejectClick = (id: string) => {
    setSelectedBooking(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setBookings(prev => prev.map(b => 
      b.id === selectedBooking ? { ...b, status: 'Rejected' as BookingStatus } : b
    ));
    
    toast.success('Booking rejected. Customer will be notified with reason.');
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedBooking(null);
  };

  return (
    <div className="bg-billing-module min-h-screen space-y-6 p-6">
      <div className="module-container flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Seat Booking Management</h2>
          <p className="text-gray-200 mt-1">Manage reservations and track table availability</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 shadow-sm">
          <TabsTrigger value="requests" className="data-[state=active]:bg-[#8B5A2B] data-[state=active]:text-white">
            Pending Requests 
            {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                {pendingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-[#8B5A2B] data-[state=active]:text-white">
            Table Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingBookings.map(booking => (
              <EnhancedBookingCard 
                key={booking.id} 
                booking={booking} 
                onAccept={handleAccept}
                onReject={handleRejectClick}
              />
            ))}
            {pendingBookings.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium text-gray-900">All caught up!</p>
                <p className="text-sm text-muted-foreground mt-1">No pending booking requests</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <TableScheduleView />
        </TabsContent>
      </Tabs>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this booking. The customer will receive this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., No tables available for selected time slot, Requested time already booked..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectConfirm}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnhancedBookingCard({ 
  booking, 
  onAccept, 
  onReject 
}: { 
  booking: BookingRequest; 
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const totalPreOrderValue = booking.preOrderedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFullyPaid = booking.payment.balanceToCollect === 0;

  return (
    <Card className="bg-white border-l-4 border-l-[#8B5A2B] shadow-sm hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="font-mono text-xs bg-gray-50 text-gray-700">
            {booking.id}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(booking.requestedAt), 'hh:mm a')}
          </span>
        </div>
        
        <CardTitle className="text-lg">{booking.customerName}</CardTitle>
        
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            <span>{booking.customerPhone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{booking.guests} Guests</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Date & Time */}
        <div className="bg-[#FDFCFB] border border-gray-100 p-3 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-[#8B5A2B]" />
            <span className="font-medium text-gray-900">{format(new Date(booking.date), 'dd MMMM yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-[#8B5A2B]" />
            <span className="font-bold text-[#8B5A2B]">{booking.timeSlot.start} → {booking.timeSlot.end}</span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment Breakdown</p>
          
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Advance Paid:</span>
              <span className="font-bold text-green-700">₹{booking.payment.advancePaid}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid For:</span>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {booking.payment.paidFor}
              </Badge>
            </div>
            
            {booking.payment.pendingAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Amount:</span>
                <span className="font-semibold text-orange-600">₹{booking.payment.pendingAmount}</span>
              </div>
            )}
            
            <div className="border-t pt-1.5 mt-1.5 flex justify-between items-center">
              <span className="font-bold text-gray-900">To Collect at Restaurant:</span>
              <span className={cn(
                "font-bold text-base",
                booking.payment.balanceToCollect === 0 ? "text-green-600" : "text-[#8B5A2B]"
              )}>
                ₹{booking.payment.balanceToCollect}
              </span>
            </div>

            {isFullyPaid && (
              <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5 flex items-center gap-1.5 mt-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-semibold text-green-700">Fully Paid — Covers: {booking.payment.paidFor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pre-Ordered Items */}
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Pre-Ordered Items
          </p>
          
          {booking.preOrderedItems.length > 0 ? (
            <div className="space-y-1.5">
              {booking.preOrderedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold">
                      {item.quantity}
                    </Badge>
                    <span className="text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t pt-1.5 mt-1.5 flex justify-between">
                <span className="text-xs font-bold text-gray-600">Food Total:</span>
                <span className="text-xs font-bold text-gray-900">₹{totalPreOrderValue}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>No dishes pre-ordered yet</span>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            onClick={() => onReject(booking.id)}
          >
            <XCircle className="h-4 w-4 mr-1.5" />
            Reject
          </Button>
          <Button 
            className="flex-1 bg-[#8B5A2B] hover:bg-[#704822] text-white shadow-sm"
            onClick={() => onAccept(booking.id)}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TableScheduleView() {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Live Table Schedule</CardTitle>
            <CardDescription className="mt-1">Real-time availability with 15-minute buffer between bookings</CardDescription>
          </div>
          <Badge variant="outline" className="bg-[#FDFCFB] text-gray-700 border-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Buffer: 15 mins
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_TABLE_SLOTS.map(table => (
            <div 
              key={table.tableId} 
              className="border border-gray-200 rounded-lg p-4 bg-[#FDFCFB]/30 hover:bg-[#FDFCFB]/50 transition-colors"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Table Info */}
                <div className="min-w-[100px]">
                  <div className="inline-flex items-center gap-3 bg-white border-2 border-[#8B5A2B] rounded-lg px-4 py-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#8B5A2B]">T{table.tableId}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {table.capacity}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time Slots Grid */}
                <div className="flex-1 grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 w-full">
                  {table.slots.map((slot, idx) => {
                    const statusColors = {
                      Available: 'bg-white border-gray-300 text-gray-600 hover:border-green-400 cursor-pointer',
                      Reserved: 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm',
                      Occupied: 'bg-red-50 border-red-300 text-red-900 shadow-sm',
                      Buffer: 'bg-gray-100 border-gray-300 text-gray-500'
                    };

                    return (
                      <div 
                        key={idx}
                        className={cn(
                          "p-2.5 rounded-md border-2 text-center transition-all duration-150",
                          statusColors[slot.status]
                        )}
                      >
                        <div className="font-bold text-sm">{slot.time}</div>
                        {slot.status === 'Reserved' && slot.bookingId && (
                          <div className="text-[9px] font-mono mt-0.5 opacity-75">{slot.bookingId}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
