import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';
import { cn } from '@/app/components/ui/utils';
import { LoadingKitchen } from '@/app/components/ui/loading-spinner';
import {
  ChefHat, Clock, Flame, CheckCircle, Package,
  AlertTriangle, Coffee, Zap, Users, LogOut, Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { ordersApi, tablesApi } from '@/utils/api';
import { KDSTerminalLogin, type KitchenTerminalStation, TERMINAL_STATIONS } from '@/app/components/kds-terminal-login';

// Kitchen Order type matching backend data
interface KitchenOrder {
  id: string;
  _id?: string;
  displayId?: string;
  orderNumber?: string;
  tableNumber?: number | string;
  tableId?: string;
  customerName?: string;
  customerNotes?: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    completed?: boolean;
    specialInstructions?: string;
  }>;
  status: string;
  createdAt: string;
  type?: string;
}

// ============================================================================
// STATION ASSIGNMENT LOGIC
// ============================================================================

type Station = Exclude<KitchenTerminalStation, 'HEAD_CHEF'>;

function getStationForItem(itemName: string): Station {
  const name = itemName.toLowerCase();
  
  // FRY Station
  if (name.includes('fries') || name.includes('dosa') || name.includes('samosa') || 
      name.includes('pakora') || name.includes('vada')) {
    return 'FRY';
  }
  
  // CURRY Station
  if (name.includes('curry') || name.includes('paneer') || name.includes('dal') ||
      name.includes('chicken') && !name.includes('tikka') || name.includes('gravy')) {
    return 'CURRY';
  }
  
  // RICE Station
  if (name.includes('rice') || name.includes('biryani') || name.includes('pulao')) {
    return 'RICE';
  }

  // GRILL Station
  if (name.includes('tikka') || name.includes('kebab') || name.includes('tandoor') ||
      name.includes('grill') || name.includes('pizza')) {
    return 'GRILL';
  }
  
  // DESSERT Station
  if (name.includes('lassi') || name.includes('coffee') || name.includes('tea') ||
      name.includes('juice') || name.includes('shake')) {
    return 'DESSERT';
  }
  
  // PREP Station
  if (name.includes('gulab') || name.includes('ice cream') || name.includes('salad') ||
      name.includes('raita') || name.includes('kulfi')) {
    return 'PREP';
  }
  
  // Default to CURRY for misc items
  return 'CURRY';
}

function getStationColor(station: Station): string {
  switch (station) {
    case 'FRY': return 'bg-orange-50 text-orange-700 border-orange-300';
    case 'CURRY': return 'bg-yellow-50 text-yellow-800 border-yellow-300';
    case 'RICE': return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'GRILL': return 'bg-red-50 text-red-700 border-red-300';
    case 'PREP': return 'bg-green-50 text-green-700 border-green-300';
    case 'DESSERT': return 'bg-purple-50 text-purple-700 border-purple-300';
  }
}

// ============================================================================
// PRODUCTION TICKET COMPONENT
// ============================================================================

interface ProductionTicketProps {
  order: KitchenOrder;
  activeTerminal: KitchenTerminalStation;
  onItemToggle: (orderId: string, itemId: string, completed: boolean) => void;
  onMarkReady: (orderId: string) => void;
}

function ProductionTicket({ order, activeTerminal, onItemToggle, onMarkReady }: ProductionTicketProps) {
  const ageMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60);
  const isUrgent = ageMinutes > 15;

  // Add stations to items
  const itemsWithStations = order.items.map(item => ({
    ...item,
    station: getStationForItem(item.name),
    completed: item.completed || false
  }));

  const visibleItems = activeTerminal === 'HEAD_CHEF'
    ? itemsWithStations
    : itemsWithStations.filter(item => item.station === activeTerminal);

  // Group by station
  const itemsByStation = visibleItems.reduce((acc, item) => {
    if (!acc[item.station]) {
      acc[item.station] = [];
    }
    acc[item.station].push(item);
    return acc;
  }, {} as Record<Station, typeof itemsWithStations>);

  const allItemsCompleted = itemsWithStations.every(item => item.completed);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'bg-white border-2 rounded-xl overflow-hidden shadow-sm',
        isUrgent ? 'border-red-300' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="bg-[#F7F3EE] p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-[#000000]">{order.displayId}</h3>
          <div className="flex items-center gap-2">
            {isUrgent && (
              <Badge className="bg-red-50 text-red-700 border-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{ageMinutes}m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {order.tableNumber || 'Takeaway'} • {order.customerName}
          </span>
          <span className="text-[#8B5A2B] font-semibold">
            {visibleItems.length} items
          </span>
        </div>
      </div>

      {/* Items by Station */}
      <div className="p-4 space-y-4">
        {Object.entries(itemsByStation).map(([station, items]) => (
          <div key={station} className="space-y-2">
            <Badge className={cn('text-sm font-bold border-2', getStationColor(station as Station))}>
              {station} STATION
            </Badge>
            <div className="space-y-2 pl-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded bg-gray-50 border border-gray-200',
                    item.completed && 'opacity-40 line-through'
                  )}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={(checked) => 
                      onItemToggle(order.id, item.id || '', checked as boolean)
                    }
                    className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-[#000000] font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  {item.specialInstructions && (
                    <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                      {item.specialInstructions}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {order.customerNotes && (
        <div className="px-4 pb-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900">
              <strong className="text-amber-700">Special Note:</strong> {order.customerNotes}
            </p>
          </div>
        </div>
      )}

      {/* Action */}
      {activeTerminal === 'HEAD_CHEF' && (
        <div className="p-4 bg-white border-t border-gray-200">
          <Button
            className={cn(
              'w-full text-lg font-bold',
              allItemsCompleted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
            disabled={!allItemsCompleted}
            onClick={() => onMarkReady(order.id)}
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark Ready
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// BATCH VIEW COMPONENT
// ============================================================================

interface BatchItem {
  name: string;
  totalQuantity: number;
  orderCount: number;
  station: Station;
}

function BatchView({ orders, activeTerminal }: { orders: KitchenOrder[]; activeTerminal: KitchenTerminalStation }) {
  // Aggregate all items across all orders
  const batchItems: Record<string, BatchItem> = {};

  orders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!batchItems[item.name]) {
        batchItems[item.name] = {
          name: item.name,
          totalQuantity: 0,
          orderCount: 0,
          station: getStationForItem(item.name)
        };
      }
      batchItems[item.name].totalQuantity += item.quantity;
      batchItems[item.name].orderCount += 1;
    });
  });

  const sortedItems = Object.values(batchItems).filter(item =>
    activeTerminal === 'HEAD_CHEF' ? true : item.station === activeTerminal
  ).sort((a, b) => 
    b.totalQuantity - a.totalQuantity
  );

  // Group by station
  const itemsByStation = sortedItems.reduce((acc, item) => {
    if (!acc[item.station]) {
      acc[item.station] = [];
    }
    acc[item.station].push(item);
    return acc;
  }, {} as Record<Station, BatchItem[]>);

  return (
    <div className="space-y-6 p-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-[#000000] mb-2">Batch Production View</h2>
        <p className="text-muted-foreground">Aggregated items across all active orders</p>
      </div>

      {Object.entries(itemsByStation).map(([station, items]) => (
        <div key={station} className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className={cn('text-lg font-bold border-2 px-4 py-2', getStationColor(station as Station))}>
              <ChefHat className="w-5 h-5 mr-2" />
              {station} STATION
            </Badge>
            <span className="text-muted-foreground">
              {items.reduce((sum, item) => sum + item.totalQuantity, 0)} total items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <Card key={item.name} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-[#000000] text-lg">{item.name}</h4>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#8B5A2B]">
                        {item.totalQuantity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.orderCount} orders
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {sortedItems.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Coffee className="w-20 h-20 mx-auto mb-4 opacity-30" />
          <p className="text-xl">No items to prepare</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function KitchenDisplayComprehensive() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'tickets' | 'batch'>('tickets');
  const [activeTerminal, setActiveTerminal] = useState<KitchenTerminalStation | null>(null);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const result = await ordersApi.list();
      const data = result.data || [];
      // Map backend data to kitchen format
      const mappedOrders: KitchenOrder[] = data
        .filter((o: any) => ['placed', 'preparing'].includes(o.status))
        .map((order: any) => ({
          ...order,
          id: order._id || order.id,
          displayId: order.orderNumber || `#${(order._id || order.id)?.slice(-6).toUpperCase()}`,
          items: (order.items || []).map((item: any, idx: number) => ({
            ...item,
            id: item.id || `item-${idx}`,
            name: item.name || item.dishName || 'Unknown Item',
            quantity: item.quantity || 1,
            completed: item.completed || false,
          })),
        }));
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemToggle = async (orderId: string, itemId: string, completed: boolean) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item =>
      item.id === itemId ? { ...item, completed } : item
    );

    // Update local state immediately for responsiveness
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, items: updatedItems } : o
    ));

    try {
      // Update on server
      const cleanId = orderId.replace('order:', '').replace(/^.*:/, '');
      await ordersApi.update(cleanId, { items: updatedItems });
    } catch (error) {
      toast.error('Failed to update item');
      fetchOrders(); // Revert on error
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      const cleanId = orderId.replace('order:', '').replace(/^.*:/, '');
      await ordersApi.updateStatus(cleanId, 'ready');
      
      // Also update table's kitchen status to 'Ready' if applicable
      const order = orders.find(o => o.id === orderId);
      if (order?.tableId) {
        try {
          await tablesApi.update(order.tableId, {
            kitchenStatus: 'Ready'
          });
        } catch (e) {
          // Table update is not critical
          console.warn('Could not update table status:', e);
        }
      }

      toast.success('Order marked as ready!', {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
      
      fetchOrders();
    } catch (error) {
      toast.error('Failed to mark order as ready');
    }
  };

  // Filter only placed/preparing orders for kitchen
  const preparingOrders = orders.filter(o => 
    ['placed', 'preparing'].includes(o.status)
  );

  const visibleOrders = activeTerminal === null
    ? []
    : preparingOrders.filter((order) => {
        if (activeTerminal === 'HEAD_CHEF') return true;
        return (order.items || []).some((item) => getStationForItem(item.name) === activeTerminal);
      });

  if (loading) {
    return <LoadingKitchen />;
  }

  if (!activeTerminal) {
    return <KDSTerminalLogin onLogin={setActiveTerminal} />;
  }

  const activeTerminalMeta = TERMINAL_STATIONS.find((s) => s.id === activeTerminal);

  return (
    <div className="bg-kitchen-display-module min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="module-container bg-black/40 backdrop-blur-sm border border-gray-600 p-6 rounded-xl shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
              <ChefHat className="w-10 h-10 text-white" />
              Kitchen Display System
            </h1>
            <p className="text-gray-200 mt-2">
              {activeTerminalMeta?.name} • Production tracking and order management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={cn(
              'text-lg px-4 py-2 border',
              activeTerminal === 'HEAD_CHEF'
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-gray-50 text-gray-700 border-gray-300'
            )}>
              {activeTerminal === 'HEAD_CHEF' ? <Crown className="w-5 h-5 mr-2" /> : <ChefHat className="w-5 h-5 mr-2" />}
              {activeTerminalMeta?.name}
            </Badge>
            <Badge className="text-lg px-4 py-2 bg-[#F7F3EE] text-[#8B5A2B] border-[#C4A484]">
              <Flame className="w-5 h-5 mr-2" />
              {visibleOrders.length} Active Orders
            </Badge>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
              onClick={() => setActiveTerminal(null)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Switch Terminal
            </Button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'tickets' | 'batch')} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <TabsList className="bg-transparent border-0 p-1">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Package className="w-4 h-4 mr-2" />
            Production Board
          </TabsTrigger>
          <TabsTrigger value="batch" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Users className="w-4 h-4 mr-2" />
            Batch View
          </TabsTrigger>
        </TabsList>

        {/* Production Board (Ticket View) */}
        <TabsContent value="tickets" className="mt-6">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              <AnimatePresence>
                {visibleOrders.map(order => (
                  <ProductionTicket
                    key={order.id}
                    order={order}
                    activeTerminal={activeTerminal}
                    onItemToggle={handleItemToggle}
                    onMarkReady={handleMarkReady}
                  />
                ))}
              </AnimatePresence>
            </div>
            
            {visibleOrders.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Coffee className="w-20 h-20 mx-auto mb-4 opacity-30" />
                <p className="text-2xl font-bold">No orders in production</p>
                <p className="mt-2">All caught up!</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Batch View */}
        <TabsContent value="batch" className="mt-6">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <BatchView orders={visibleOrders} activeTerminal={activeTerminal} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
