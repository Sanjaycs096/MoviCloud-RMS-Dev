import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { cn } from '@/app/components/ui/utils';
import { LoadingOrders } from '@/app/components/ui/loading-spinner';
import {
  Clock, Package, CheckCircle, XCircle, AlertCircle, Zap, 
  Undo2, Play, ChefHat, Utensils, DollarSign, Trash2, Search,
  Timer, AlertTriangle, Coffee, Ban, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi } from '@/utils/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'bill_requested' | 'completed' | 'cancelled';

// ============================================================================
// SMART NOTES PARSING
// ============================================================================

interface SmartTag {
  icon: string;
  label: string;
  color: string;
}

function parseSmartNotes(notes?: string): SmartTag[] {
  if (!notes) return [];
  
  const tags: SmartTag[] = [];
  const lowerNotes = notes.toLowerCase();

  if (lowerNotes.includes('no onion')) {
    tags.push({ icon: '🧅', label: 'No Onion', color: 'bg-orange-100 text-orange-800' });
  }
  if (lowerNotes.includes('urgent') || lowerNotes.includes('asap')) {
    tags.push({ icon: '⚡', label: 'Urgent', color: 'bg-red-100 text-red-800' });
  }
  if (lowerNotes.includes('spicy') || lowerNotes.includes('extra spice')) {
    tags.push({ icon: '🌶️', label: 'Spice Level', color: 'bg-red-100 text-red-700' });
  }
  if (lowerNotes.includes('allergy') || lowerNotes.includes('allergic')) {
    tags.push({ icon: '⚠️', label: 'Allergies', color: 'bg-yellow-100 text-yellow-800' });
  }
  if (lowerNotes.includes('vegan')) {
    tags.push({ icon: '🌱', label: 'Vegan', color: 'bg-green-100 text-green-800' });
  }
  if (lowerNotes.includes('less oil') || lowerNotes.includes('no oil')) {
    tags.push({ icon: '💧', label: 'Less Oil', color: 'bg-blue-100 text-blue-800' });
  }

  return tags;
}

// ============================================================================
// ORDER AGE & DELAY CALCULATION
// ============================================================================

function getOrderAge(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000 / 60);
}

function getDelayLevel(ageMinutes: number): 'normal' | 'warning' | 'critical' {
  if (ageMinutes > 20) return 'critical';
  if (ageMinutes > 15) return 'warning';
  return 'normal';
}

function formatTimeAgo(createdAt: string): string {
  const minutes = getOrderAge(createdAt);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

// ============================================================================
// ORDER CARD COMPONENT
// ============================================================================

interface OrderCardProps {
  order: any;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onDelete: (orderId: string) => void;
}

function OrderCard({ order, onStatusChange, onDelete }: OrderCardProps) {
  const ageMinutes = getOrderAge(order.createdAt);
  const delayLevel = getDelayLevel(ageMinutes);
  const smartTags = parseSmartNotes(order.customerNotes);

  const getStatusColor = () => {
    switch (order.status) {
      case 'placed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-teal-100 text-teal-800';
      case 'bill_requested': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBorderColor = () => {
    if (delayLevel === 'critical') return 'border-red-500 border-4';
    if (delayLevel === 'warning') return 'border-yellow-500 border-3';
    return 'border-gray-200';
  };

  const getNextStatus = (): OrderStatus | null => {
    switch (order.status) {
      case 'placed': return 'accepted';
      case 'accepted': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      case 'served': return 'bill_requested';
      default: return null;
    }
  };

  const getActionLabel = (): string => {
    switch (order.status) {
      case 'placed': return 'Accept Order';
      case 'accepted': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Serve';
      case 'served': return 'Request Bill';
      default: return '';
    }
  };

  const nextStatus = getNextStatus();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={cn('hover:shadow-lg transition-shadow', getBorderColor())}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {order.displayId}
                <Badge className={getStatusColor()}>
                  {order.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {order.customerName}
                {order.tableNumber && ` • Table ${order.tableNumber}`}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(order.createdAt)}</span>
              </div>
              {delayLevel !== 'normal' && (
                <Badge variant="outline" className={cn(
                  'mt-1',
                  delayLevel === 'critical' ? 'border-red-500 text-red-700' : 'border-yellow-500 text-yellow-700'
                )}>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {delayLevel === 'critical' ? 'Critical' : 'Warning'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Smart Tags */}
          {smartTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {smartTags.map((tag, idx) => (
                <Badge key={idx} className={cn('text-xs gap-1', tag.color)}>
                  <span>{tag.icon}</span>
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Items */}
          <div className="space-y-1">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium text-gray-900">₹{item.price}</span>
              </div>
            ))}
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <p className="text-xs text-amber-900">
                <strong>Note:</strong> {order.customerNotes}
              </p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">₹{order.totalAmount}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {nextStatus && (
              <Button
                size="sm"
                className="flex-1 bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
                onClick={() => onStatusChange(order.id, nextStatus)}
              >
                {getActionLabel()}
              </Button>
            )}
            {order.status === 'placed' && (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => onStatusChange(order.id, 'cancelled')}
              >
                <Ban className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// UNDO TOAST COMPONENT
// ============================================================================

interface UndoState {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OrderManagementComprehensive() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Undo countdown timer
  useEffect(() => {
    if (undoCountdown > 0) {
      undoTimerRef.current = setTimeout(() => {
        setUndoCountdown(prev => prev - 1);
      }, 1000);
    } else if (undoCountdown === 0 && undoState) {
      setUndoState(null);
    }

    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, [undoCountdown, undoState]);

  const fetchOrders = async () => {
    try {
      const result = await ordersApi.list();
      if (result.data) {
        // Transform API data to match component expectations
        const transformedOrders = (result.data || []).map((o: any) => ({
          id: o._id || o.id,
          displayId: o.displayId || o.orderNumber || `ORD-${(o._id || o.id).slice(-6)}`,
          customerName: o.customerName || o.customer?.name || 'Guest',
          tableNumber: o.tableNumber || o.table?.number,
          type: o.type || o.orderType || 'dine-in',
          status: o.status,
          items: (o.items || []).map((item: any, idx: number) => ({
            id: item._id || idx,
            name: item.name || item.menuItemName,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: o.totalAmount || o.total || 0,
          customerNotes: o.notes || o.specialInstructions,
          createdAt: o.createdAt || o.created_at
        }));
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const previousStatus = order.status;

    try {
      await ordersApi.updateStatus(orderId, newStatus);
      
      // Set undo state
      setUndoState({
        orderId,
        previousStatus,
        newStatus,
        timestamp: Date.now()
      });
      setUndoCountdown(10);

      // Show undo toast
      toast.success(`Order ${newStatus.replace('_', ' ')}`, {
        action: {
          label: `Undo (${10}s)`,
          onClick: handleUndo
        },
        duration: 10000
      });

      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;

    try {
      await ordersApi.updateStatus(undoState.orderId, undoState.previousStatus);
      
      toast.success('Order status reverted');
      setUndoState(null);
      setUndoCountdown(0);
      
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }

      fetchOrders();
    } catch (error) {
      toast.error('Failed to undo action');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await ordersApi.delete(orderId);
      toast.success('Order deleted');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  // Filtering
  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterType !== 'all' && order.type !== filterType) return false;
    if (searchQuery && !order.displayId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Group orders by status
  const ordersByStatus = {
    placed: filteredOrders.filter(o => o.status === 'placed'),
    accepted: filteredOrders.filter(o => o.status === 'accepted'),
    preparing: filteredOrders.filter(o => o.status === 'preparing'),
    ready: filteredOrders.filter(o => o.status === 'ready'),
    served: filteredOrders.filter(o => o.status === 'served'),
    bill_requested: filteredOrders.filter(o => o.status === 'bill_requested'),
    completed: filteredOrders.filter(o => o.status === 'completed'),
    cancelled: filteredOrders.filter(o => o.status === 'cancelled'),
  };

  const activeOrders = filteredOrders.filter(o => 
    !['completed', 'cancelled'].includes(o.status)
  );

  if (loading) {
    return <LoadingOrders />;
  }

  return (
    <div className="bg-order-management-module min-h-screen space-y-6">
      {/* Header */}
      <div className="module-container flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Order Management</h1>
          <p className="text-gray-200 mt-1">Track and manage all orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            {activeOrders.length} Active
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 items-center flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by ID or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="bill_requested">Bill Requested</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="dine-in">Dine-In</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-white">
          <TabsTrigger value="all">
            All ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="placed">
            Placed ({ordersByStatus.placed.length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing ({ordersByStatus.preparing.length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({ordersByStatus.ready.length})
          </TabsTrigger>
          <TabsTrigger value="served">
            Served ({ordersByStatus.served.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteOrder}
                />
              ))}
            </AnimatePresence>
          </div>
          {activeOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active orders</p>
            </div>
          )}
        </TabsContent>

        {['placed', 'preparing', 'ready', 'served'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {ordersByStatus[status as keyof typeof ordersByStatus].map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDeleteOrder}
                  />
                ))}
              </AnimatePresence>
            </div>
            {ordersByStatus[status as keyof typeof ordersByStatus].length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No {status} orders</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}