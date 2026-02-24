import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Banknote, 
  Receipt, 
  Download, 
  Printer, 
  Plus, 
  Minus, 
  RefreshCcw, 
  CheckCircle, 
  IndianRupee, 
  Calculator, 
  ArrowRight, 
  FileText, 
  History, 
  Search,
  Filter,
  AlertCircle,
  ChevronRight,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  BadgePercent,
  Trash2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import { cn } from '@/app/components/ui/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Progress } from '@/app/components/ui/progress';

// --- Types ---

type OrderStatus = 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED';

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: number;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  timestamp: string;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface PaymentSplit {
  mode: 'Cash' | 'Card' | 'UPI' | 'Wallet';
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  orderId: string;
  customerName: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  payments: PaymentSplit[];
  status: 'Paid' | 'Refunded' | 'Partially Refunded';
}

interface Refund {
  id: string;
  invoiceId: string;
  invoiceNumber: string; 
  amount: number;
  type: 'Full' | 'Partial';
  reason: string;
  date: string;
}

// --- Mock Data ---

const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'ORD-101',
    tableNumber: 4,
    customerName: 'Rahul Sharma',
    items: [
      { id: 'i1', name: 'Butter Chicken', quantity: 1, price: 320 },
      { id: 'i2', name: 'Garlic Naan', quantity: 2, price: 60 },
      { id: 'i3', name: 'Jeera Rice', quantity: 1, price: 180 }
    ],
    totalAmount: 620,
    status: 'SERVED',
    timestamp: new Date().toISOString()
  },
  {
    id: 'ord_2',
    orderNumber: 'ORD-102',
    tableNumber: 7,
    customerName: 'Priya Patel',
    items: [
      { id: 'i4', name: 'Masala Dosa', quantity: 2, price: 120 },
      { id: 'i5', name: 'Filter Coffee', quantity: 2, price: 40 }
    ],
    totalAmount: 320,
    status: 'SERVED',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ord_3',
    orderNumber: 'ORD-103',
    tableNumber: 2,
    customerName: 'Amit Singh',
    items: [
      { id: 'i6', name: 'Veg Biryani', quantity: 1, price: 250 },
      { id: 'i7', name: 'Raita', quantity: 1, price: 50 },
      { id: 'i8', name: 'Paneer Tikka', quantity: 1, price: 280 }
    ],
    totalAmount: 580,
    status: 'SERVED',
    timestamp: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'ord_4',
    orderNumber: 'ORD-104',
    tableNumber: 5,
    customerName: 'Sneha Gupta',
    items: [
      { id: 'i9', name: 'Chicken Soup', quantity: 1, price: 150 }
    ],
    totalAmount: 150,
    status: 'READY', // Should NOT appear in billing
    timestamp: new Date().toISOString()
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2026-001',
    date: new Date(Date.now() - 86400000).toISOString(),
    orderId: 'ORD-099',
    customerName: 'John Doe',
    items: [{ id: 'i0', name: 'Pasta Alfredo', quantity: 1, price: 350 }],
    subtotal: 350,
    taxAmount: 17.5,
    discountAmount: 0,
    grandTotal: 367.5,
    payments: [{ mode: 'Card', amount: 367.5 }],
    status: 'Paid'
  }
];

// --- Component ---

export function BillingPayment() {
  const [activeTab, setActiveTab] = useState('generate');
  
  // State
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [refunds, setRefunds] = useState<Refund[]>([]);

  // Derived Stats for Daily Summary
  const stats = useMemo(() => {
    return invoices.reduce((acc, inv) => {
      acc.revenue += inv.grandTotal;
      acc.tax += inv.taxAmount;
      acc.discounts += inv.discountAmount;
      return acc;
    }, { revenue: 0, tax: 0, discounts: 0, refunds: 0 });
  }, [invoices]);

  // Add refund amounts
  const totalRefunds = useMemo(() => refunds.reduce((sum, r) => sum + r.amount, 0), [refunds]);

  // Handlers
  const handleInvoiceGenerated = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
    // Remove order from served list
    setOrders(prev => prev.filter(o => o.orderNumber !== invoice.orderId));
  };

  const handleRefundProcessed = (refund: Refund) => {
    setRefunds(prev => [refund, ...prev]);
    setInvoices(prev => prev.map(inv => {
      if (inv.id === refund.invoiceId) {
        return {
          ...inv,
          status: refund.type === 'Full' ? 'Refunded' : 'Partially Refunded'
        };
      }
      return inv;
    }));
  };

  const downloadInvoicePdf = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Restaurant Management System', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Movicloud Labs', pageWidth / 2, 27, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${invoice.invoiceNumber}`, pageWidth / 2, 38, { align: 'center' });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);
    
    // Customer & Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoStartY = 50;
    
    doc.text(`Customer: ${invoice.customerName}`, 14, infoStartY);
    doc.text(`Order: ${invoice.orderId}`, 14, infoStartY + 6);
    doc.text(`Date: ${invoice.date}`, pageWidth - 14, infoStartY, { align: 'right' });
    doc.text(`Status: ${invoice.status}`, pageWidth - 14, infoStartY + 6, { align: 'right' });
    
    // Items table
    const tableData = (invoice.items || []).map(item => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: infoStartY + 15,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
    
    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals section
    const totalsX = pageWidth - 14;
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, totalsX - 50, finalY);
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, totalsX, finalY, { align: 'right' });
    
    doc.text(`Tax:`, totalsX - 50, finalY + 6);
    doc.text(`Rs.${invoice.taxAmount.toFixed(2)}`, totalsX, finalY + 6, { align: 'right' });
    
    let currentY = finalY + 12;
    if (invoice.discountAmount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Discount:`, totalsX - 50, currentY);
      doc.text(`-Rs.${invoice.discountAmount.toFixed(2)}`, totalsX, currentY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      currentY += 6;
    }
    
    // Separator line before grand total
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 100, currentY + 2, pageWidth - 14, currentY + 2);
    
    // Grand total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Grand Total:`, totalsX - 50, currentY + 10);
    doc.text(`Rs.${invoice.grandTotal.toFixed(2)}`, totalsX, currentY + 10, { align: 'right' });
    
    // Payment details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    currentY += 25;
    doc.text('Payment Details:', 14, currentY);
    currentY += 6;
    invoice.payments.forEach(payment => {
      doc.text(`${payment.mode}: Rs.${payment.amount.toFixed(2)}`, 14, currentY);
      currentY += 5;
    });
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for dining with us!', pageWidth / 2, currentY + 15, { align: 'center' });
    doc.text('This is a computer generated invoice.', pageWidth / 2, currentY + 20, { align: 'center' });
    
    // Save the PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success(`Invoice ${invoice.invoiceNumber} downloaded as PDF`);
  };

  return (
    <div className="bg-billing-module min-h-screen pb-20">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="module-container flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">Billing & Payment</h1>
            <p className="text-gray-200 mt-1">Process payments and manage invoices for served orders</p>
          </div>
          
          {/* Mini Daily Summary Panel (Innovation #10) */}
          <div className="flex gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
             <div className="px-4 py-2 border-r">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenue</p>
               <p className="text-lg font-bold text-green-700">₹{stats.revenue.toFixed(2)}</p>
             </div>
             <div className="px-4 py-2 border-r">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tax</p>
               <p className="text-lg font-bold text-gray-700">₹{stats.tax.toFixed(2)}</p>
             </div>
             <div className="px-4 py-2 border-r">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Discounts</p>
               <p className="text-lg font-bold text-orange-600">₹{stats.discounts.toFixed(2)}</p>
             </div>
             <div className="px-4 py-2">
               <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Refunds</p>
               <p className="text-lg font-bold text-red-600">₹{totalRefunds.toFixed(2)}</p>
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="w-full overflow-x-auto pb-2">
          <nav className="flex gap-3 min-w-max p-1">
            {[
              { id: 'generate', label: 'Bill Generation', icon: Calculator, description: 'Process served orders' },
              { id: 'invoices', label: 'Invoice History', icon: FileText, description: 'View past transactions' },
              { id: 'refunds', label: 'Refunds', icon: RotateCcw, description: 'Manage refunds' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl transition-all text-left min-w-[220px]',
                    isActive
                      ? 'bg-[#8B5A2B] text-white shadow-md transform scale-[1.02]'
                      : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-sm text-gray-600'
                  )}
                >
                  <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isActive ? 'text-white' : 'text-gray-500')} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-bold', isActive ? 'text-white' : 'text-gray-900')}>
                      {item.label}
                    </p>
                    <p className={cn('text-xs mt-0.5', isActive ? 'text-white/80' : 'text-gray-500')}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="generate" className="mt-0 outline-none animate-in fade-in-50">
            <BillGenerationTab orders={orders} onInvoiceGenerated={handleInvoiceGenerated} />
          </TabsContent>

          <TabsContent value="invoices" className="mt-0 outline-none animate-in fade-in-50">
            <InvoicesTab invoices={invoices} />
          </TabsContent>

          <TabsContent value="refunds" className="mt-0 outline-none animate-in fade-in-50">
            <RefundsTab invoices={invoices} refunds={refunds} onRefundProcessed={handleRefundProcessed} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// --- Tab Components ---

function BillGenerationTab({ orders, onInvoiceGenerated }: { orders: Order[], onInvoiceGenerated: (inv: Invoice) => void }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculation State
  const [taxPercent, setTaxPercent] = useState(5);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  
  // Split Payment State
  const [payments, setPayments] = useState<PaymentSplit[]>([]);
  const [currentPaymentMode, setCurrentPaymentMode] = useState<'Cash' | 'Card' | 'UPI' | 'Wallet'>('Cash');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<string>('');
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  // Innovation: Only show SERVED orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => o.status === 'SERVED')
      .filter(o => 
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.tableNumber.toString().includes(searchTerm)
      );
  }, [orders, searchTerm]);

  // Derived Totals
  const totals = useMemo(() => {
    if (!selectedOrder) return { subtotal: 0, tax: 0, discount: 0, total: 0 };
    
    const subtotal = selectedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = (subtotal * taxPercent) / 100;
    
    let discount = 0;
    if (discountType === 'percent') {
      discount = (subtotal * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    // Ensure discount doesn't exceed total
    discount = Math.min(discount, subtotal + tax);

    return {
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount
    };
  }, [selectedOrder, taxPercent, discountValue, discountType]);

  // Payment Logic
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totals.total - totalPaid;
  const isFullyPaid = Math.abs(balance) < 0.1; // Float tolerance

  // Reset payments when order changes
  useEffect(() => {
    setPayments([]);
    setDiscountValue(0);
    setTaxPercent(5);
  }, [selectedOrder?.id]);

  // Auto-fill amount when selecting mode
  useEffect(() => {
    if (balance > 0) {
      setCurrentPaymentAmount(balance.toFixed(2));
    } else {
      setCurrentPaymentAmount('');
    }
  }, [currentPaymentMode, totals.total, payments.length]); // Re-calc when balance changes

  const addPayment = () => {
    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    if (amount > balance + 0.1) {
      toast.error("Amount exceeds balance");
      return;
    }

    setPayments(prev => [...prev, { mode: currentPaymentMode, amount }]);
    setCurrentPaymentAmount('');
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplySuggestion = (type: 'regular' | 'high_value') => {
    if (type === 'regular') {
       setDiscountType('flat');
       setDiscountValue(50);
       toast.success("Applied Regular Customer Discount");
    } else if (type === 'high_value') {
       setDiscountType('percent');
       setDiscountValue(10);
       toast.success("Applied High Value Discount (10%)");
    }
  };

  const handleFinalizeBill = () => {
    if (!selectedOrder || !isFullyPaid) return;
    
    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString(),
      orderId: selectedOrder.orderNumber,
      customerName: selectedOrder.customerName,
      items: selectedOrder.items,
      subtotal: totals.subtotal,
      taxAmount: totals.tax,
      discountAmount: totals.discount,
      grandTotal: totals.total,
      payments: payments,
      status: 'Paid'
    };

    setGeneratedInvoice(newInvoice);
    setPreviewOpen(true);
    onInvoiceGenerated(newInvoice);
    toast.success("Payment completed successfully!");
    
    // Reset
    setSelectedOrder(null);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      
      {/* Left Panel: Order Selection */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="pb-3 border-b sticky top-0 z-10 bg-white">
            <CardTitle>Served Orders</CardTitle>
            <CardDescription>Select an order to generate bill</CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search Table or Order ID..." 
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0 bg-[#F7F3EE]/50">
             <div className="p-3 space-y-3">
               {filteredOrders.map(order => (
                 <motion.div 
                   key={order.id} 
                   whileHover={{ scale: 1.01 }}
                   onClick={() => setSelectedOrder(order)}
                   className={cn(
                     "p-4 rounded-xl border cursor-pointer transition-all group relative overflow-hidden",
                     selectedOrder?.id === order.id 
                       ? 'bg-white border-[#8B5A2B] shadow-md ring-1 ring-[#8B5A2B]/20' 
                       : 'bg-white border-gray-200 hover:border-[#8B5A2B]/50 hover:shadow-md'
                   )}
                 >
                   <div className="flex justify-between items-start mb-2 relative z-10">
                     <div className="flex items-center gap-2">
                       <Badge variant={selectedOrder?.id === order.id ? 'default' : 'secondary'} className={cn("rounded-md font-bold", selectedOrder?.id === order.id ? 'bg-[#8B5A2B]' : 'bg-gray-100 text-gray-700')}>
                         Table {order.tableNumber}
                       </Badge>
                       <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                     </div>
                     <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] uppercase font-bold tracking-wider">
                       {order.status}
                     </Badge>
                   </div>
                   <div className="flex justify-between items-end relative z-10">
                     <div>
                       <p className="font-semibold text-gray-900 group-hover:text-[#8B5A2B] transition-colors">{order.customerName}</p>
                       <p className="text-xs text-muted-foreground">{order.items?.length || 0} Items</p>
                     </div>
                     <p className="font-bold text-lg text-[#000000]">₹{order.totalAmount}</p>
                   </div>
                   {/* Selection Indicator */}
                   {selectedOrder?.id === order.id && (
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5A2B]" />
                   )}
                 </motion.div>
               ))}
               {filteredOrders.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <Receipt className="h-8 w-8 opacity-20" />
                   </div>
                   <p className="font-medium text-gray-900">No Served Orders</p>
                   <p className="text-sm mt-1">Orders must be marked as 'Served' in kitchen first.</p>
                 </div>
               )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Bill Summary & Payment */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col border-none shadow-md overflow-hidden bg-white">
          {selectedOrder ? (
            <>
              <CardHeader className="border-b pb-4 bg-white sticky top-0 z-20">
                <div className="flex justify-between items-center">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       Bill Summary
                       <Badge variant="outline" className="font-normal text-xs bg-gray-50">
                         {selectedOrder.orderNumber}
                       </Badge>
                     </CardTitle>
                     <CardDescription>Table {selectedOrder.tableNumber} • {format(new Date(), 'dd MMM yyyy')}</CardDescription>
                   </div>
                   <div className="text-right">
                     <p className="text-sm text-muted-foreground">Customer</p>
                     <p className="font-medium text-[#000000]">{selectedOrder.customerName}</p>
                   </div>
                </div>
              </CardHeader>
              
              <div className="flex-1 grid md:grid-cols-12 divide-x h-full overflow-hidden">
                {/* Middle: Item List (Read Only) */}
                <div className="md:col-span-5 flex flex-col bg-gray-50/30 overflow-hidden">
                  <div className="p-3 border-b bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                    <span>Item Details</span>
                    <span>Amt</span>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {(selectedOrder.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-sm group">
                          <div className="flex gap-3">
                            <span className="bg-white border h-6 w-6 rounded flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                              {item.quantity}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                            </div>
                          </div>
                          <p className="font-semibold tabular-nums">₹{item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Calculations & Payment */}
                <div className="md:col-span-7 flex flex-col bg-white overflow-y-auto">
                  <div className="p-6 space-y-6">
                    
                    {/* Discount & Tax Section */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Tax (GST %)</Label>
                          <div className="relative">
                             <Input 
                               type="number" 
                               value={taxPercent} 
                               onChange={(e) => setTaxPercent(Number(e.target.value))}
                               className="h-9 pr-8 text-right font-mono"
                             />
                             <span className="absolute right-3 top-2 text-xs text-muted-foreground">%</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Discount</Label>
                          <div className="flex gap-2">
                             <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                               <SelectTrigger className="h-9 w-[70px]">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="percent">%</SelectItem>
                                 <SelectItem value="flat">₹</SelectItem>
                               </SelectContent>
                             </Select>
                             <Input 
                               type="number" 
                               value={discountValue} 
                               onChange={(e) => setDiscountValue(Number(e.target.value))}
                               className="h-9 text-right font-mono flex-1"
                             />
                          </div>
                        </div>
                      </div>

                      {/* Innovation #4: Smart Suggestions */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-[#8B5A2B]" /> Smart Suggestions
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => handleApplySuggestion('regular')}
                            className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full border border-orange-100 hover:bg-orange-100 transition-colors flex items-center gap-1"
                          >
                            <BadgePercent className="h-3 w-3" /> Flat ₹50 (Regular)
                          </button>
                          {totals.subtotal > 2000 && (
                            <button 
                              onClick={() => handleApplySuggestion('high_value')}
                              className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors flex items-center gap-1"
                            >
                              <TrendingUp className="h-3 w-3" /> 10% Off (High Value)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax ({taxPercent}%)</span>
                        <span>+ ₹{totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- ₹{totals.discount.toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Total Payable</span>
                        <span className="font-bold text-2xl text-[#8B5A2B]">₹{totals.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Innovation #5: Split Payment Support */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                         <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Payment Details</Label>
                         <Badge variant={balance > 0.1 ? "destructive" : "default"} className="text-[10px]">
                           Balance: ₹{balance > 0 ? balance.toFixed(2) : '0.00'}
                         </Badge>
                      </div>

                      {/* Payment Mode Selector */}
                      {balance > 0.1 && (
                        <div className="space-y-3">
                           <div className="grid grid-cols-4 gap-2">
                             {['Cash', 'Card', 'UPI', 'Wallet'].map((mode) => (
                               <button
                                 key={mode}
                                 onClick={() => setCurrentPaymentMode(mode as any)}
                                 className={cn(
                                   "flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all",
                                   currentPaymentMode === mode 
                                     ? "bg-[#8B5A2B] text-white border-[#8B5A2B]" 
                                     : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                 )}
                               >
                                 {mode}
                               </button>
                             ))}
                           </div>
                           <div className="flex gap-2">
                             <div className="relative flex-1">
                               <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-500">₹</span>
                               <Input 
                                 type="number" 
                                 value={currentPaymentAmount} 
                                 onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                                 className="pl-6 h-10 bg-white"
                                 placeholder="Amount"
                               />
                             </div>
                             <Button onClick={addPayment} size="sm" className="bg-gray-900 text-white hover:bg-gray-800">
                               <Plus className="h-4 w-4 mr-1" /> Add
                             </Button>
                           </div>
                        </div>
                      )}

                      {/* Added Payments List */}
                      {payments.length > 0 && (
                        <div className="space-y-2 mt-2 bg-white rounded-lg border divide-y">
                          {payments.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{p.mode}</Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono">₹{p.amount.toFixed(2)}</span>
                                <button onClick={() => removePayment(idx)} className="text-red-500 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full h-12 text-base shadow-lg shadow-[#8B5A2B]/20 mt-4 bg-[#8B5A2B] hover:bg-[#704822] text-white" 
                      onClick={handleFinalizeBill}
                      disabled={!isFullyPaid}
                    >
                      {isFullyPaid ? 'Finalize Bill & Print Invoice' : `Pay Remaining ₹${balance.toFixed(2)}`}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-gray-50/50">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                 <ArrowRight className="h-8 w-8 text-gray-400" />
               </div>
               <h3 className="text-xl font-bold text-gray-900">No Order Selected</h3>
               <p className="max-w-xs mt-2 text-sm text-gray-500">Select a SERVED order from the list on the left to begin the billing process.</p>
             </div>
          )}
        </Card>
      </div>

      {/* Invoice Preview Modal */}
      {generatedInvoice && (
        <InvoicePreviewModal 
          open={previewOpen} 
          onOpenChange={setPreviewOpen} 
          invoice={generatedInvoice} 
        />
      )}
    </div>
  );
}

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const downloadInvoicePdf = (invoice: Invoice) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Restaurant Management System', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Movicloud Labs', pageWidth / 2, 27, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice: ${invoice.invoiceNumber}`, pageWidth / 2, 38, { align: 'center' });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);
    
    // Customer & Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoStartY = 50;
    
    doc.text(`Customer: ${invoice.customerName}`, 14, infoStartY);
    doc.text(`Order: ${invoice.orderId}`, 14, infoStartY + 6);
    doc.text(`Date: ${invoice.date}`, pageWidth - 14, infoStartY, { align: 'right' });
    doc.text(`Status: ${invoice.status}`, pageWidth - 14, infoStartY + 6, { align: 'right' });
    
    // Items table
    const tableData = (invoice.items || []).map(item => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: infoStartY + 15,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
    
    // Get the Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Totals section
    const totalsX = pageWidth - 14;
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, totalsX - 50, finalY);
    doc.text(`Rs.${invoice.subtotal.toFixed(2)}`, totalsX, finalY, { align: 'right' });
    
    doc.text(`Tax:`, totalsX - 50, finalY + 6);
    doc.text(`Rs.${invoice.taxAmount.toFixed(2)}`, totalsX, finalY + 6, { align: 'right' });
    
    let currentY = finalY + 12;
    if (invoice.discountAmount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Discount:`, totalsX - 50, currentY);
      doc.text(`-Rs.${invoice.discountAmount.toFixed(2)}`, totalsX, currentY, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      currentY += 6;
    }
    
    // Separator line before grand total
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 100, currentY + 2, pageWidth - 14, currentY + 2);
    
    // Grand total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Grand Total:`, totalsX - 50, currentY + 10);
    doc.text(`Rs.${invoice.grandTotal.toFixed(2)}`, totalsX, currentY + 10, { align: 'right' });
    
    // Payment details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    currentY += 25;
    doc.text('Payment Details:', 14, currentY);
    currentY += 6;
    (invoice.payments || []).forEach(payment => {
      doc.text(`${payment.mode}: Rs.${payment.amount.toFixed(2)}`, 14, currentY);
      currentY += 5;
    });
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for dining with us!', pageWidth / 2, currentY + 15, { align: 'center' });
    doc.text('This is a computer generated invoice.', pageWidth / 2, currentY + 20, { align: 'center' });
    
    // Save the PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success(`Invoice ${invoice.invoiceNumber} downloaded as PDF`);
  };

  return (
    <div className="space-y-4">
      <Card className="border-none shadow-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and manage all generated invoices.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                 placeholder="Search Invoices..." 
                 className="pl-9 w-[250px]" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono font-medium text-gray-900">{invoice.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(invoice.date), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{invoice.orderId}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {invoice.payments.map((p, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] bg-gray-50">
                          {p.mode}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-gray-900">₹{invoice.grandTotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' : 
                      invoice.status === 'Refunded' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                    }>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewInvoice(invoice)}>
                          <FileText className="mr-2 h-4 w-4" /> View Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadInvoicePdf(invoice)}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.success("Sent to Printer")}>
                          <Printer className="mr-2 h-4 w-4" /> Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {previewInvoice && (
        <InvoicePreviewModal 
          open={!!previewInvoice} 
          onOpenChange={(v) => !v && setPreviewInvoice(null)} 
          invoice={previewInvoice}
          onDownload={downloadInvoicePdf}
        />
      )}
    </div>
  );
}

function RefundsTab({ invoices, refunds, onRefundProcessed }: { invoices: Invoice[], refunds: Refund[], onRefundProcessed: (r: Refund) => void }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refundType, setRefundType] = useState<'Full' | 'Partial'>('Full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleProcessRefund = () => {
    if (!selectedInvoice || !amount || !reason) {
      toast.error("Please complete the refund form.");
      return;
    }
    
    // Validate amount
    const refundAmount = parseFloat(amount);
    if (refundAmount > selectedInvoice.grandTotal) {
      toast.error("Refund amount cannot exceed invoice total.");
      return;
    }

    const refund: Refund = {
      id: `ref_${Date.now()}`,
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      amount: refundAmount,
      type: refundType,
      reason,
      date: new Date().toISOString()
    };
    
    onRefundProcessed(refund);
    toast.success("Refund processed successfully.");
    
    // Reset
    setSelectedInvoice(null);
    setAmount('');
    setReason('');
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
      {/* Left: Process Refund */}
      <div className="lg:col-span-4">
        <Card className="h-full border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle>Process Refund</CardTitle>
            <CardDescription>Issue full or partial refunds for paid invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Invoice</Label>
              <Select onValueChange={(val) => {
                const inv = invoices.find(i => i.id === val);
                setSelectedInvoice(inv || null);
                if (inv) {
                  setRefundType('Full');
                  setAmount(inv.grandTotal.toString());
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Search Invoice..." />
                </SelectTrigger>
                <SelectContent>
                   {invoices.filter(i => i.status === 'Paid').map(inv => (
                     <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - ₹{inv.grandTotal}</SelectItem>
                   ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInvoice && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="p-4 bg-[#F7F3EE] rounded-xl text-sm border border-[#8B5A2B]/10">
                   <div className="flex justify-between mb-1">
                     <span className="text-muted-foreground">Customer:</span>
                     <span className="font-semibold">{selectedInvoice.customerName}</span>
                   </div>
                   <div className="flex justify-between mb-1">
                     <span className="text-muted-foreground">Date:</span>
                     <span>{format(new Date(selectedInvoice.date), 'dd MMM yyyy')}</span>
                   </div>
                   <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                     <span className="font-bold text-gray-900">Total Paid:</span>
                     <span className="font-bold text-[#8B5A2B]">₹{selectedInvoice.grandTotal}</span>
                   </div>
                </div>

                <div className="space-y-3">
                  <Label>Refund Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                       onClick={() => {
                         setRefundType('Full');
                         if (selectedInvoice) setAmount(selectedInvoice.grandTotal.toString());
                       }}
                       className={cn(
                         "flex items-center justify-center p-3 border rounded-lg text-sm transition-all",
                         refundType === 'Full' 
                           ? "bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200" 
                           : "bg-white text-gray-600 hover:bg-gray-50"
                       )}
                    >
                      Full Refund
                    </button>
                    <button 
                       onClick={() => {
                         setRefundType('Partial');
                         setAmount('');
                       }}
                       className={cn(
                         "flex items-center justify-center p-3 border rounded-lg text-sm transition-all",
                         refundType === 'Partial' 
                           ? "bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200" 
                           : "bg-white text-gray-600 hover:bg-gray-50"
                       )}
                    >
                      Partial Refund
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Refund Amount (₹)</Label>
                  <Input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    disabled={refundType === 'Full'}
                    className={cn(refundType === 'Full' ? 'bg-gray-100' : '')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason for Refund</Label>
                  <Input 
                    placeholder="e.g. Wrong item served, Customer complaint" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleProcessRefund}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: History */}
      <div className="lg:col-span-8">
        <Card className="h-full border-none shadow-md flex flex-col bg-white">
          <CardHeader>
             <CardTitle>Refund History</CardTitle>
             <CardDescription>Log of all processed refunds</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
             <div className="overflow-auto h-full">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-gray-50 hover:bg-gray-50">
                     <TableHead>Date</TableHead>
                     <TableHead>Invoice ID</TableHead>
                     <TableHead>Reason</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead className="text-right">Amount</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {refunds.map(refund => (
                     <TableRow key={refund.id}>
                       <TableCell>{format(new Date(refund.date), 'dd MMM, HH:mm')}</TableCell>
                       <TableCell className="font-mono">{refund.invoiceNumber}</TableCell>
                       <TableCell>{refund.reason}</TableCell>
                       <TableCell><Badge variant="outline">{refund.type}</Badge></TableCell>
                       <TableCell className="text-right text-red-600 font-medium">- ₹{refund.amount}</TableCell>
                     </TableRow>
                   ))}
                   {refunds.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                         <div className="flex flex-col items-center justify-center">
                           <History className="h-10 w-10 mb-2 opacity-20" />
                           <p>No refunds processed yet.</p>
                         </div>
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Invoice Preview Modal ---

function InvoicePreviewModal({ open, onOpenChange, invoice, onDownload }: { open: boolean, onOpenChange: (v: boolean) => void, invoice: Invoice, onDownload?: (invoice: Invoice) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl">
        <div className="p-8 bg-white" id="invoice-content">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[#8B5A2B] rounded-full mx-auto flex items-center justify-center mb-3">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-[#000000]">Restaurant Name</h2>
            <p className="text-xs text-muted-foreground mt-1">123, Food Street, Gourmet City</p>
            <p className="text-xs text-muted-foreground">GSTIN: 29ABCDE1234F1Z5</p>
          </div>

          <div className="border-b border-dashed border-gray-300 pb-4 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice No:</span>
              <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{format(new Date(invoice.date), 'dd/MM/yyyy HH:mm')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Ref:</span>
              <span className="font-medium">{invoice.orderId}</span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
             {(invoice.items || []).map((item, i) => (
               <div key={i} className="flex justify-between text-sm">
                 <div className="flex gap-2">
                   <span className="text-gray-500 font-medium">{item.quantity} x</span>
                   <span className="text-gray-900">{item.name}</span>
                 </div>
                 <span className="font-mono text-gray-900">₹{item.price * item.quantity}</span>
               </div>
             ))}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
               <span>Subtotal</span>
               <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-xs">
               <span>Tax</span>
               <span>₹{invoice.taxAmount.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600 text-xs">
                 <span>Discount</span>
                 <span>-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-gray-200">
               <span>Total Paid</span>
               <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
             <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Payment Details</p>
             <div className="space-y-1">
               {invoice.payments.map((p, i) => (
                 <div key={i} className="flex justify-between text-xs">
                   <span>{p.mode}</span>
                   <span className="font-mono">₹{p.amount.toFixed(2)}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground">
             <p>Thank you for dining with us!</p>
             <p className="mt-1">Visit again</p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 flex gap-3 border-t">
          {onDownload && (
            <Button className="flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-100" variant="outline" onClick={() => onDownload(invoice)}>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          )}
          <Button className="flex-1 bg-white border-gray-200 text-gray-900 hover:bg-gray-100" variant="outline" onClick={() => toast.info("Printing Invoice...")}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button className="flex-1 bg-[#8B5A2B] hover:bg-[#704822] text-white" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}