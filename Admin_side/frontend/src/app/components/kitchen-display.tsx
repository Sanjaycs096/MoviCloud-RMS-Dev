import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Clock, ChefHat, AlertCircle, Package } from 'lucide-react';
import { ordersApi, recipesApi } from '@/utils/api';
import { toast } from 'sonner';

interface Order {
  id: string;
  tableNumber?: number;
  items: Array<{
    name: string;
    quantity: number;
    customizations?: string[];
  }>;
  status: string;
  createdAt: string;
  type: string;
}

export function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const result = await ordersApi.list();
      const data = result.data || [];
      // Map _id to id for frontend compatibility and filter for kitchen orders
      const mappedOrders = data
        .map((order: any) => ({
          ...order,
          id: order._id || order.id,
        }))
        .filter((order: Order) => 
          ['placed', 'preparing', 'ready'].includes(order.status)
        );
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Clean the order ID - remove any prefix and get raw MongoDB ID
      const cleanId = orderId.replace('order:', '').replace(/^.*:/, '');
      await ordersApi.updateStatus(cleanId, newStatus);
      toast.success('Order updated!');
      
      // Trigger inventory deduction when order is accepted (starts preparing)
      if (newStatus === 'preparing') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.items) {
          try {
            // Call backend API to deduct inventory
            const result = await recipesApi.deductForOrder({
              orderId: cleanId,
              items: order.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                menuItemId: (item as any).menuItemId
              }))
            });
            
            if (result.deducted && result.deducted.length > 0) {
              toast.info("Inventory updated", {
                description: `Deducted ${result.deducted.length} ingredient(s)`
              });
            }
            
            if (result.errors && result.errors.length > 0) {
              console.warn('Inventory deduction warnings:', result.errors);
            }
          } catch (deductError) {
            console.error('Inventory deduction error:', deductError);
            // Don't fail the order update, just log the warning
            toast.warning("Inventory sync pending", {
              description: "Order accepted. Inventory will sync on next refresh."
            });
          }
        }
      }

      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return minutes;
  };

  const getPriorityColor = (minutes: number) => {
    if (minutes > 20) return 'text-red-600 font-bold';
    if (minutes > 10) return 'text-orange-600';
    return 'text-green-600';
  };

  const handleStockManagement = () => {
    window.dispatchEvent(new CustomEvent('navigate:stock-management'));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading kitchen display...</div>;
  }

  return (
    <div className="bg-kitchen-display-module min-h-screen p-6 space-y-6">
      <div className="module-container flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-white drop-shadow-lg" />
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Kitchen Display System</h1>
            <p className="text-gray-200">Kitchen Order Tickets (KOT) • Active orders queue</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="text-sm px-3 py-1.5"
          onClick={handleStockManagement}
        >
          <Package className="h-4 w-4 mr-2" />
          Stock Management
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active orders in the kitchen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const elapsedMinutes = getElapsedTime(order.createdAt);
            const isPriority = elapsedMinutes > 10;

            return (
              <Card key={order.id} className={`${isPriority ? 'border-orange-500 border-2' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          KOT
                        </Badge>
                        <CardTitle className="text-xl">
                          {order.tableNumber ? `Table ${order.tableNumber}` : order.type.toUpperCase()}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        Order #{order.id?.split('-')[1]?.slice(0, 6).toUpperCase() || 'UNKNOWN'}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={order.status === 'placed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      {isPriority && (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-lg">{item.quantity}x</span>
                          <span className="font-medium flex-1 ml-2">{item.name}</span>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <ul className="text-sm text-muted-foreground ml-8 list-disc">
                            {item.customizations.map((custom, i) => (
                              <li key={i}>{custom}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className={`text-sm ${getPriorityColor(elapsedMinutes)}`}>
                        {elapsedMinutes} min ago
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 'placed' && (
                      <Button
                        className="flex-1"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Start Cooking
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        className="flex-1"
                        variant="default"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}