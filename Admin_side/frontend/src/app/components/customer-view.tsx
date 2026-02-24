import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ShoppingCart, Plus, Minus, Trash2, Clock, CreditCard, IndianRupee } from 'lucide-react';
import { menuApi, ordersApi } from '@/utils/api';
import { USE_MOCK_DATA, mockMenuItems } from '@/utils/mock-data';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image?: string;
  available: boolean;
  prepTime?: number; // in minutes
}

interface CartItem extends MenuItem {
  quantity: number;
}

export function CustomerView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    customerName: '',
    tableNumber: '',
    type: 'dine-in',
  });

  useEffect(() => {
    if (USE_MOCK_DATA) {
      const itemsWithPrepTime = mockMenuItems.map((item) => ({
        ...item,
        prepTime: (item as any).prepTime || Math.floor(Math.random() * 20) + 10,
      }));
      setMenuItems(itemsWithPrepTime.filter((item) => item.available));
      setLoading(false);
    } else {
      fetchMenu();
    }
  }, []);

  const fetchMenu = async () => {
    try {
      const data = await menuApi.list();
      // Add default prep times if not present
      const itemsWithPrepTime = (Array.isArray(data) ? data : []).map((item: MenuItem) => ({
        ...item,
        prepTime: item.prepTime || Math.floor(Math.random() * 20) + 10, // 10-30 mins
      }));
      setMenuItems(itemsWithPrepTime.filter((item: MenuItem) => item.available !== false));
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch menu. Please check your connection.');
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    const itemName = item.name || 'Unknown Item';
    const itemPrice = Number(item.price) || 0;
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, name: itemName, price: itemPrice, quantity: 1 }]);
    }
    toast.success(`${itemName} added to cart`);
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0);
  };

  const getTotalPrepTime = () => {
    if (cart.length === 0) return 0;
    // Max prep time from cart items
    return Math.max(...cart.map(item => item.prepTime || 15));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      await ordersApi.create({
        customerName: orderDetails.customerName || 'Guest',
        tableNumber: orderDetails.tableNumber ? parseInt(orderDetails.tableNumber) : undefined,
        type: orderDetails.type,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          menuItemId: item.id, // Include menu item ID for inventory deduction
        })),
        total: getTotalPrice(),
        status: 'placed',
      });

      toast.success('Order placed successfully!');
      setCart([]);
      setCheckoutOpen(false);
      setPaymentOpen(false);
      setOrderDetails({
        customerName: '',
        tableNumber: '',
        type: 'dine-in',
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    }
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-customer-module">
      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">Customer Menu</h1>
              <p className="text-muted-foreground">Browse our delicious offerings and place your order</p>
            </div>

            <Tabs defaultValue={categories[0] || 'all'} className="w-full">
              <TabsList className="flex-wrap h-auto bg-white border shadow-sm">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category} 
                    className="capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category.replace('-', ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {menuItems
                      .filter(item => item.category === category)
                      .map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-all border-border/50">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                    <IndianRupee className="h-3 w-3 mr-0.5" />
                                    {item.price.toFixed(2)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {item.prepTime} mins
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            <Button
                              onClick={() => addToCart(item)}
                              className="w-full rounded-lg"
                              size="sm"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Cart Section - Sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card className="border-border/50 shadow-md">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Cart
                    {cart.length > 0 && (
                      <Badge className="ml-auto">{cart.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">Your cart is empty</p>
                      <p className="text-xs text-muted-foreground mt-1">Add items to get started</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <IndianRupee className="h-3 w-3" />
                                {item.price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="text-sm font-semibold flex items-center">
                                  <IndianRupee className="h-3 w-3" />
                                  {(item.price * item.quantity).toFixed(2)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated prep time:</span>
                          <span className="font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTotalPrepTime()} mins
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total:</span>
                          <span className="text-2xl font-bold flex items-center">
                            <IndianRupee className="h-5 w-5" />
                            {getTotalPrice().toFixed(2)}
                          </span>
                        </div>
                        <Button
                          onClick={() => setPaymentOpen(true)}
                          className="w-full rounded-lg h-11"
                          size="lg"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Proceed to Payment
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Complete Your Order</DialogTitle>
            <DialogDescription>Enter your details to place the order</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{cart.length} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prep time:</span>
                <span className="font-medium">{getTotalPrepTime()} mins</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-xl font-bold flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {getTotalPrice().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Order Details Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name</Label>
                <Input
                  id="customerName"
                  value={orderDetails.customerName}
                  onChange={(e) => setOrderDetails({ ...orderDetails, customerName: e.target.value })}
                  placeholder="Enter your name"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number (For Dine-in)</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={orderDetails.tableNumber}
                  onChange={(e) => setOrderDetails({ ...orderDetails, tableNumber: e.target.value })}
                  placeholder="Enter table number"
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Order Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['dine-in', 'takeaway', 'delivery'].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={orderDetails.type === type ? 'default' : 'outline'}
                      onClick={() => setOrderDetails({ ...orderDetails, type })}
                      className="capitalize rounded-lg"
                    >
                      {type.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setPaymentOpen(false)}
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCheckout}
                className="flex-1 rounded-lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
