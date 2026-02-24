import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Utensils,
  IndianRupee,
  User,
  MapPin
} from 'lucide-react';
import { restaurantState, type RestaurantOrder, type OrderStatus } from '@/app/services/restaurant-state';
import { cn } from '@/app/components/ui/utils';

function getOrderStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'created':
      return { 
        label: 'Created', 
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: ShoppingCart,
        description: 'Order placed, waiting acceptance'
      };
    case 'accepted':
      return { 
        label: 'Accepted', 
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: CheckCircle,
        description: 'Order accepted, preparing to cook'
      };
    case 'cooking':
      return { 
        label: 'Cooking', 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: ChefHat,
        description: 'Order is being prepared'
      };
    case 'ready':
      return { 
        label: 'Ready', 
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: CheckCircle,
        description: 'Order ready to serve'
      };
    case 'served':
      return { 
        label: 'Served', 
        color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
        icon: Utensils,
        description: 'Food served to table'
      };
    case 'completed':
      return { 
        label: 'Completed', 
        color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
        icon: CheckCircle,
        description: 'Order completed and paid'
      };
    case 'cancelled':
      return { 
        label: 'Cancelled', 
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: Clock,
        description: 'Order cancelled'
      };
  }
}

export function IntegratedOrderView() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    // Load initial orders
    loadOrders();

    // Subscribe to state changes
    const unsubscribe = restaurantState.subscribe((event) => {
      if (
        event.type === 'ORDER_CREATED' || 
        event.type === 'ORDER_STATUS_CHANGED' ||
        event.type === 'CHECKOUT_COMPLETED'
      ) {
        loadOrders();
      }
    });

    return unsubscribe;
  }, []);

  const loadOrders = () => {
    const allOrders = restaurantState.getAllOrders();
    setOrders(allOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const activeOrders = orders.filter(o => 
    o.status !== 'completed' && o.status !== 'cancelled'
  );

  const statusCounts = {
    all: orders.length,
    created: orders.filter(o => o.status === 'created').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    cooking: orders.filter(o => o.status === 'cooking').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="bg-order-management-module space-y-6 p-6 min-h-screen">
      {/* Header */}
      <div className="module-container flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white drop-shadow-lg">Order Monitor</h2>
          <p className="text-sm text-gray-200">Real-time order tracking across all tables</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {activeOrders.length} Active Orders
        </Badge>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
          className="gap-2"
        >
          All Orders
          <Badge variant="secondary" className="ml-1">{statusCounts.all}</Badge>
        </Button>
        <Button
          variant={filterStatus === 'created' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('created')}
          className="gap-2"
        >
          Created
          {statusCounts.created > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.created}</Badge>
          )}
        </Button>
        <Button
          variant={filterStatus === 'accepted' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('accepted')}
          className="gap-2"
        >
          Accepted
          {statusCounts.accepted > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.accepted}</Badge>
          )}
        </Button>
        <Button
          variant={filterStatus === 'cooking' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('cooking')}
          className="gap-2"
        >
          Cooking
          {statusCounts.cooking > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.cooking}</Badge>
          )}
        </Button>
        <Button
          variant={filterStatus === 'ready' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('ready')}
          className="gap-2"
        >
          Ready
          {statusCounts.ready > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.ready}</Badge>
          )}
        </Button>
        <Button
          variant={filterStatus === 'served' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('served')}
          className="gap-2"
        >
          Served
          {statusCounts.served > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.served}</Badge>
          )}
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
          className="gap-2"
        >
          Completed
          {statusCounts.completed > 0 && (
            <Badge variant="secondary" className="ml-1">{statusCounts.completed}</Badge>
          )}
        </Button>
      </div>

      {/* Orders Grid */}
      <ScrollArea className="h-[600px]">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
            {filteredOrders.map((order) => {
              const statusConfig = getOrderStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card 
                  key={order.id} 
                  className={cn(
                    "overflow-hidden border-2 transition-all hover:shadow-lg",
                    order.status === 'ready' && 'ring-2 ring-green-500 ring-opacity-50'
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          Table {order.tableNumber}
                        </div>
                      </div>
                      <Badge className={cn("border", statusConfig.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Waiter Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                      <User className="h-4 w-4" />
                      <span>{order.waiterName}</span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-gray-700">Items:</div>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.quantity}x {item.name}
                            </span>
                            <span className="text-gray-600">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                          <IndianRupee className="h-4 w-4" />
                          {order.total}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                        <div className="text-xs font-semibold text-yellow-800 mb-1">Notes:</div>
                        <div className="text-xs text-yellow-700">{order.notes}</div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="text-xs text-gray-500">
                      <div>Created: {new Date(order.createdAt).toLocaleTimeString()}</div>
                      <div>Updated: {new Date(order.updatedAt).toLocaleTimeString()}</div>
                    </div>

                    {/* Status Description */}
                    <div className="text-xs text-gray-600 italic">
                      {statusConfig.description}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
