import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/app/components/ui/utils';
import { 
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Users,
  Trophy,
  Clock,
  Calendar,
  Download,
  FileText,
  Star,
  Activity,
} from 'lucide-react';

export function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState('sales');
  const [timeRange, setTimeRange] = useState('week');

  // Mock data for sales chart
  const salesData = [
    { name: 'Mon', sales: 12500, orders: 42 },
    { name: 'Tue', sales: 15200, orders: 51 },
    { name: 'Wed', sales: 18400, orders: 62 },
    { name: 'Thu', sales: 14800, orders: 48 },
    { name: 'Fri', sales: 22100, orders: 75 },
    { name: 'Sat', sales: 28500, orders: 98 },
    { name: 'Sun', sales: 26200, orders: 88 },
  ];

  // Mock data for popular items
  const popularItems = [
    { name: 'Butter Chicken', orders: 156, revenue: 49920, trend: 15 },
    { name: 'Paneer Tikka', orders: 142, revenue: 35500, trend: 8 },
    { name: 'Biryani', orders: 128, revenue: 38400, trend: -3 },
    { name: 'Dal Makhani', orders: 98, revenue: 21560, trend: 12 },
    { name: 'Naan', orders: 256, revenue: 10240, trend: 5 },
    { name: 'Gulab Jamun', orders: 86, revenue: 6020, trend: 22 },
    { name: 'Masala Dosa', orders: 76, revenue: 15200, trend: -5 },
    { name: 'Samosa', orders: 145, revenue: 7250, trend: 18 },
  ];

  // Mock data for peak hours
  const peakHoursData = [
    { hour: '9 AM', orders: 5 },
    { hour: '10 AM', orders: 8 },
    { hour: '11 AM', orders: 12 },
    { hour: '12 PM', orders: 28 },
    { hour: '1 PM', orders: 45 },
    { hour: '2 PM', orders: 38 },
    { hour: '3 PM', orders: 15 },
    { hour: '4 PM', orders: 18 },
    { hour: '5 PM', orders: 22 },
    { hour: '6 PM', orders: 32 },
    { hour: '7 PM', orders: 52 },
    { hour: '8 PM', orders: 65 },
    { hour: '9 PM', orders: 48 },
    { hour: '10 PM', orders: 25 },
  ];

  // Mock staff performance data
  const staffPerformance = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      role: 'Waiter',
      orders_handled: 145,
      avg_service_time: '8 mins',
      rating: 4.8,
      attendance: '98%',
      performance_score: 95,
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Cashier',
      orders_handled: 168,
      avg_service_time: '5 mins',
      rating: 4.9,
      attendance: '100%',
      performance_score: 98,
    },
    {
      id: '3',
      name: 'Chef Arjun',
      role: 'Chef',
      orders_handled: 256,
      avg_service_time: '15 mins',
      rating: 4.7,
      attendance: '96%',
      performance_score: 92,
    },
    {
      id: '4',
      name: 'Ankit Verma',
      role: 'Waiter',
      orders_handled: 132,
      avg_service_time: '9 mins',
      rating: 4.6,
      attendance: '94%',
      performance_score: 88,
    },
  ];

  // Category distribution data
  const categoryData = [
    { name: 'Main Course', value: 45, color: '#3b82f6' },
    { name: 'Appetizers', value: 25, color: '#10b981' },
    { name: 'Desserts', value: 15, color: '#f59e0b' },
    { name: 'Beverages', value: 15, color: '#8b5cf6' },
  ];

  return (
    <div className="bg-analytics-module min-h-screen px-4 md:px-6 py-6 space-y-6">
      <div className="module-container flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">Reports & Analytics</h2>
          <p className="text-sm text-gray-200 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 !bg-white !text-gray-700 border border-white/90 hover:!bg-white shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="!bg-white !text-gray-700 border border-white/90 hover:!bg-white shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="w-full overflow-x-auto pb-4">
        <nav className="flex gap-3 min-w-max p-1">
          {[
            { id: 'sales', label: 'Sales', icon: TrendingUp, description: 'Revenue & orders' },
            { id: 'items', label: 'Popular Items', icon: ShoppingBag, description: 'Top performing dishes' },
            { id: 'peak', label: 'Peak Hours', icon: Clock, description: 'Busy time analysis' },
            { id: 'staff', label: 'Staff', icon: Users, description: 'Employee performance' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors text-left min-w-[220px]',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted shadow-sm'
                )}
              >
                <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isActive ? '' : 'text-muted-foreground')} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', isActive ? '' : '')}>
                    {item.label}
                  </p>
                  <p className={cn('text-xs mt-0.5', isActive ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* TabsList removed and replaced by horizontal nav above */}

        {/* Sales Reports Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹1,37,700</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12.5% from last week</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">464</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+8.2% from last week</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹297</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+4.1% from last week</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customer Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">328</div>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>+6.7% from last week</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Trend</CardTitle>
              <CardDescription>Daily sales and order count for the week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales (₹)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${entry.value}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Dine-in Orders</span>
                  </div>
                  <span className="font-semibold">285 (61%)</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Takeaway Orders</span>
                  </div>
                  <span className="font-semibold">123 (27%)</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Delivery Orders</span>
                  </div>
                  <span className="font-semibold">56 (12%)</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Avg. Prep Time</span>
                  </div>
                  <span className="font-semibold">18 mins</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Popular Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Most popular dishes ordered this week</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {index < 3 ? (
                          <Trophy className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.orders}</TableCell>
                      <TableCell>₹{item.revenue.toLocaleString()}</TableCell>
                      <TableCell>
                        {item.trend > 0 ? (
                          <Badge className="bg-green-500">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {item.trend}%
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {Math.abs(item.trend)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${(item.orders / 256) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round((item.orders / 256) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Items Chart</CardTitle>
              <CardDescription>Visual comparison of order volumes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularItems}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peak Hours Tab */}
        <TabsContent value="peak" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peak Hours Analysis</CardTitle>
              <CardDescription>Order distribution throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8b5cf6" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Peak Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">8 PM</div>
                <p className="text-sm text-muted-foreground mt-1">65 orders during this hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rush Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">12-2 PM</div>
                <p className="text-sm text-muted-foreground mt-1">Lunch rush period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dinner Peak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">7-9 PM</div>
                <p className="text-sm text-muted-foreground mt-1">Evening rush period</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Performance Tab */}
        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance Ranking</CardTitle>
              <CardDescription>Employee performance metrics and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Orders Handled</TableHead>
                    <TableHead>Avg. Service Time</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffPerformance.map((staff, index) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        {index < 3 ? (
                          <Trophy className={`h-5 w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                        ) : (
                          <span className="text-muted-foreground">{index + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>{staff.orders_handled}</TableCell>
                      <TableCell>{staff.avg_service_time}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{staff.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={staff.attendance === '100%' ? 'bg-green-500' : 'bg-blue-500'}>
                          {staff.attendance}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${staff.performance_score}%` }}
                            />
                          </div>
                          <span className="font-semibold w-8 text-right">{staff.performance_score}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
