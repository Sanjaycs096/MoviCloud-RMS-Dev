import { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Star, 
  History, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Ban,
  CheckCircle,
  Trophy,
  ArrowUpRight,
  UserPlus,
  User,
  FileText
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/app/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { toast } from 'sonner';

// --- Types ---

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: 'Active' | 'Blocked' | 'Inactive';
  type: 'New' | 'Regular' | 'VIP';
  joinDate: string;
  lastVisit: string;
  totalOrders: number;
  totalSpend: number;
  loyaltyPoints: number;
  tags: string[];
}

interface OrderHistory {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: 'Completed' | 'Refunded' | 'Cancelled';
}

// --- Mock Data ---

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Arjun Mehta',
    email: 'arjun.m@example.com',
    phone: '+91 98765 43210',
    status: 'Active',
    type: 'VIP',
    joinDate: '2023-08-15',
    lastVisit: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    totalOrders: 45,
    totalSpend: 28500,
    loyaltyPoints: 1250,
    tags: ['High Spender', 'Wine Lover']
  },
  {
    id: 'c2',
    name: 'Priya Sharma',
    email: 'priya.s@example.com',
    phone: '+91 98765 12345',
    status: 'Active',
    type: 'Regular',
    joinDate: '2023-11-20',
    lastVisit: new Date(Date.now() - 86400000 * 5).toISOString(),
    totalOrders: 12,
    totalSpend: 4800,
    loyaltyPoints: 320,
    tags: ['Weekend Visitor']
  },
  {
    id: 'c3',
    name: 'Rahul Verma',
    email: 'rahul.v@example.com',
    phone: '+91 99887 76655',
    status: 'Inactive',
    type: 'New',
    joinDate: '2024-01-10',
    lastVisit: '2024-01-10',
    totalOrders: 1,
    totalSpend: 850,
    loyaltyPoints: 50,
    tags: []
  },
  {
    id: 'c4',
    name: 'Sneha Gupta',
    email: 'sneha.g@example.com',
    phone: '+91 88990 01122',
    status: 'Blocked',
    type: 'Regular',
    joinDate: '2023-05-05',
    lastVisit: '2023-12-25',
    totalOrders: 8,
    totalSpend: 3200,
    loyaltyPoints: 0,
    tags: ['No-Show Risk']
  }
];

const MOCK_HISTORY: OrderHistory[] = [
  { id: 'ord_101', date: new Date(Date.now() - 86400000 * 2).toISOString(), items: ['Butter Chicken', 'Garlic Naan', 'Coke'], total: 850, status: 'Completed' },
  { id: 'ord_98', date: new Date(Date.now() - 86400000 * 10).toISOString(), items: ['Paneer Tikka', 'Biryani'], total: 620, status: 'Completed' },
  { id: 'ord_85', date: new Date(Date.now() - 86400000 * 25).toISOString(), items: ['Pasta Alfredo'], total: 450, status: 'Completed' },
];

export function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'Active').length,
    vip: customers.filter(c => c.type === 'VIP').length,
    newThisMonth: 12 // Mock
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  const handleStatusChange = (id: string, newStatus: Customer['status']) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    toast.success(`Customer status updated to ${newStatus}`);
  };

  return (
    <div className="bg-customer-module space-y-6 max-w-[1600px] mx-auto p-6 min-h-screen">
      {/* Header */}
      <div className="module-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">Customer Management</h1>
          <p className="text-gray-200 mt-1">CRM, insights, and loyalty tracking.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button className="bg-primary text-primary-foreground">
            <UserPlus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">+8% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Ordered in last 30 days</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">VIP Members</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vip}</div>
            <p className="text-xs text-muted-foreground mt-1">High value customers</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New (This Month)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Growing steadily</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-md overflow-hidden bg-white">
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Loyalty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleViewCustomer(customer)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200">
                        <AvatarImage src={customer.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {customer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${customer.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        customer.status === 'Blocked' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-gray-100 text-gray-700 border-gray-200'}
                    `}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.totalOrders}</TableCell>
                  <TableCell className="font-medium">₹{customer.totalSpend.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(customer.lastVisit), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-amber-600 font-medium">
                      <Star className="h-3.5 w-3.5 fill-amber-600" />
                      {customer.loyaltyPoints}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {customer.status !== 'Blocked' ? (
                          <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(customer.id, 'Blocked')}>
                            <Ban className="mr-2 h-4 w-4" /> Block Customer
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600" onClick={() => handleStatusChange(customer.id, 'Active')}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Unblock Customer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Customer Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selectedCustomer && (
            <div className="flex flex-col h-full">
              {/* Profile Header */}
              <div className="bg-slate-900 text-white p-6 pb-8">
                <div className="flex justify-between items-start mb-6">
                  <Badge className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                    {selectedCustomer.type} Customer
                  </Badge>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setIsSheetOpen(false)}>
                    {/* Close icon handle by Sheet default, but custom actions here */}
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-slate-800 shadow-xl">
                    <AvatarImage src={selectedCustomer.avatar} />
                    <AvatarFallback className="bg-blue-600 text-2xl text-white">
                      {selectedCustomer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                    <div className="flex flex-col gap-1 mt-1 text-slate-300 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" /> {selectedCustomer.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" /> {selectedCustomer.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 divide-x border-b bg-white">
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Spend</p>
                  <p className="text-lg font-bold text-slate-900">₹{selectedCustomer.totalSpend.toLocaleString()}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Orders</p>
                  <p className="text-lg font-bold text-slate-900">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Points</p>
                  <p className="text-lg font-bold text-amber-600 flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-amber-600" />
                    {selectedCustomer.loyaltyPoints}
                  </p>
                </div>
              </div>

              {/* Content Tabs */}
              <div className="p-6 bg-gray-50 flex-1">
                {/* Tab Navigation */}
                <div className="w-full overflow-x-auto pb-4">
                  <nav className="flex gap-2 min-w-max p-1">
                    {[
                      { id: 'history', label: 'Order History', icon: History, description: 'Past transactions' },
                      { id: 'info', label: 'Details', icon: User, description: 'Profile info' },
                      { id: 'notes', label: 'Notes', icon: FileText, description: 'Internal remarks' },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            'flex items-start gap-2 p-2 rounded-lg transition-colors text-left min-w-[160px]',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-white border border-border hover:bg-muted shadow-sm'
                          )}
                        >
                          <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', isActive ? '' : 'text-muted-foreground')} />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium', isActive ? '' : '')}>
                              {item.label}
                            </p>
                            <p className={cn('text-[10px] leading-tight mt-0.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  {/* TabsList removed and replaced by horizontal nav above */}

                  <TabsContent value="history" className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Recent Orders</h3>
                    <div className="space-y-3">
                      {MOCK_HISTORY.map((order) => (
                        <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold">₹{order.total}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(order.date), 'dd MMM yyyy, hh:mm a')}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100">
                                {order.status}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <p className="text-sm text-slate-600 truncate">
                              {order.items.join(', ')}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="info">
                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Member Since</span>
                          <span className="text-sm font-medium">{format(new Date(selectedCustomer.joinDate), 'PPP')}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Last Visit</span>
                          <span className="text-sm font-medium">{format(new Date(selectedCustomer.lastVisit), 'PPP')}</span>
                        </div>
                        <div className="space-y-2 pt-2">
                          <span className="text-sm text-muted-foreground">Tags</span>
                          <div className="flex flex-wrap gap-2">
                            {selectedCustomer.tags.map(tag => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                            <Badge variant="outline" className="border-dashed cursor-pointer hover:bg-gray-100">+ Add Tag</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="notes">
                    <Card>
                      <CardContent className="p-4">
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                          No notes added yet.
                        </div>
                        <Button className="w-full mt-4" variant="outline">Add Note</Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
