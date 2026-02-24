import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { ScrollArea } from '@/app/components/ui/scroll-area';
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
  Search,
  RefreshCcw,
  CheckCircle,
  XCircle,
  IndianRupee,
  Calendar,
  User,
  Percent,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/supabase/info';
import { mockApi } from '@/app/services/mock-api';

interface Order {
  id: string;
  table_number: number;
  customer_name: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
}

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  table_number: number;
  items: BillItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  discount_amount: number;
  grand_total: number;
  payment_mode: string;
  status: string;
  created_at: string;
}

export function BillingPayment() {
  const [activeTab, setActiveTab] = useState('generate');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(5);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchInvoices();
  }, []);

  useEffect(() => {
    const total = billItems.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(total);
  }, [billItems]);

  const fetchOrders = async () => {
    try {
      // Use mock API
      const result = await mockApi.getOrders();
      if (result.success) {
        // Filter for completed orders only
        const completedOrders = result.data.filter((order: any) => 
          order.status === 'completed' || order.status === 'ready'
        );
        setOrders(completedOrders as any);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchInvoices = async () => {
    // Mock invoice data - replace with actual API call
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        invoice_number: 'INV-2026-0001',
        customer_name: 'John Doe',
        table_number: 5,
        items: [
          { id: '1', name: 'Butter Chicken', quantity: 2, price: 320, total: 640 },
          { id: '2', name: 'Naan', quantity: 4, price: 40, total: 160 },
        ],
        subtotal: 800,
        tax_rate: 5,
        tax_amount: 40,
        discount_type: 'percentage',
        discount_value: 10,
        discount_amount: 80,
        grand_total: 760,
        payment_mode: 'UPI',
        status: 'paid',
        created_at: new Date().toISOString(),
      },
    ];
    setInvoices(mockInvoices);
  };

  const loadOrderIntoBill = (order: Order) => {
    setSelectedOrder(order);
    const items: BillItem[] = (order.items || []).map((item, idx) => ({
      id: `item-${idx}`,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.quantity * item.price,
    }));
    setBillItems(items);
    toast.success(`Order loaded for Table ${order.table_number}`);
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    setBillItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.price,
          };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (itemId: string) => {
    setBillItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const taxAmount = (subtotal * taxRate) / 100;
    let discountAmount = 0;
    
    if (discountType === 'flat') {
      discountAmount = discountValue;
    } else {
      discountAmount = (subtotal * discountValue) / 100;
    }

    const grandTotal = subtotal + taxAmount - discountAmount;
    
    return {
      subtotal,
      taxAmount,
      discountAmount,
      grandTotal: Math.max(0, grandTotal),
    };
  };

  const generateInvoice = () => {
    if (billItems.length === 0) {
      toast.error('Please add items to the bill');
      return;
    }

    const totals = calculateTotals();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoice_number: invoiceNumber,
      customer_name: selectedOrder?.customer_name || 'Walk-in Customer',
      table_number: selectedOrder?.table_number || 0,
      items: billItems,
      subtotal: totals.subtotal,
      tax_rate: taxRate,
      tax_amount: totals.taxAmount,
      discount_type: discountType,
      discount_value: discountValue,
      discount_amount: totals.discountAmount,
      grand_total: totals.grandTotal,
      payment_mode: paymentMode,
      status: 'paid',
      created_at: new Date().toISOString(),
    };

    setInvoices([invoice, ...invoices]);
    setPreviewInvoice(invoice);
    setShowInvoicePreview(true);
    
    // Reset form
    setBillItems([]);
    setSelectedOrder(null);
    setDiscountValue(0);
    
    toast.success(`Invoice ${invoiceNumber} generated successfully!`);
  };

  const downloadInvoice = (invoice: Invoice) => {
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
    doc.text(`Invoice: ${invoice.invoice_number}`, pageWidth / 2, 38, { align: 'center' });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);
    
    // Customer & Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoStartY = 50;
    
    doc.text(`Customer: ${invoice.customer_name}`, 14, infoStartY);
    doc.text(`Table: ${invoice.table_number}`, 14, infoStartY + 6);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleString()}`, pageWidth - 14, infoStartY, { align: 'right' });
    doc.text(`Payment: ${invoice.payment_mode.toUpperCase()}`, pageWidth - 14, infoStartY + 6, { align: 'right' });
    
    // Items table
    const tableData = (invoice.items || []).map(item => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${item.total.toFixed(2)}`
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
    
    doc.text(`GST (${invoice.tax_rate}%):`, totalsX - 50, finalY + 6);
    doc.text(`Rs.${invoice.tax_amount.toFixed(2)}`, totalsX, finalY + 6, { align: 'right' });
    
    let currentY = finalY + 12;
    if (invoice.discount_amount > 0) {
      doc.setTextColor(0, 128, 0);
      doc.text(`Discount:`, totalsX - 50, currentY);
      doc.text(`-Rs.${invoice.discount_amount.toFixed(2)}`, totalsX, currentY, { align: 'right' });
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
    doc.text(`Rs.${invoice.grand_total.toFixed(2)}`, totalsX, currentY + 10, { align: 'right' });
    
    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for dining with us!', pageWidth / 2, currentY + 25, { align: 'center' });
    doc.text('This is a computer generated invoice.', pageWidth / 2, currentY + 30, { align: 'center' });
    
    // Save the PDF
    doc.save(`${invoice.invoice_number}.pdf`);
    toast.success(`Invoice ${invoice.invoice_number} downloaded as PDF`);
  };

  const printInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoice');
      return;
    }
    
    const itemRows = (invoice.items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; }
          .info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .info div { font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #333; color: white; padding: 10px; text-align: left; }
          .totals { text-align: right; }
          .totals div { margin: 5px 0; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
          .discount { color: green; }
          .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Restaurant Management System</h1>
          <p>Movicloud Labs</p>
          <p style="font-weight: bold; margin-top: 10px;">Invoice: ${invoice.invoice_number}</p>
        </div>
        
        <div class="info">
          <div>
            <p><strong>Customer:</strong> ${invoice.customer_name}</p>
            <p><strong>Table:</strong> ${invoice.table_number}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString()}</p>
            <p><strong>Payment:</strong> ${invoice.payment_mode.toUpperCase()}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>
        
        <div class="totals">
          <div>Subtotal: ₹${invoice.subtotal.toFixed(2)}</div>
          <div>GST (${invoice.tax_rate}%): ₹${invoice.tax_amount.toFixed(2)}</div>
          ${invoice.discount_amount > 0 ? `<div class="discount">Discount: -₹${invoice.discount_amount.toFixed(2)}</div>` : ''}
          <div class="grand-total">Grand Total: ₹${invoice.grand_total.toFixed(2)}</div>
        </div>
        
        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>This is a computer generated invoice.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(`Invoice ${invoice.invoice_number} sent to printer`);
  };

  const totals = calculateTotals();

  return (
    <div className="bg-billing-module min-h-screen space-y-6 p-6">
      <div className="module-container flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg">Billing & Payment</h2>
          <p className="text-sm text-gray-200 mt-1">
            Generate bills, manage payments, and process refunds
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="generate">Bill Generation</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        {/* Bill Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Order</CardTitle>
                <CardDescription>Choose a completed order</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {orders.map(order => (
                      <Card
                        key={order.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedOrder?.id === order.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => loadOrderIntoBill(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Table {order.table_number}</span>
                            <Badge variant="outline">{order.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{order.customer_name}</p>
                          <p className="text-sm font-medium">
                            <IndianRupee className="h-3 w-3 inline" />
                            {order.total}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No completed orders</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Bill Items */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Bill Items</CardTitle>
                <CardDescription>
                  {selectedOrder 
                    ? `Table ${selectedOrder.table_number} - ${selectedOrder.customer_name}` 
                    : 'No order selected'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Items List */}
                <div className="space-y-3">
                  {billItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-24 text-right font-medium">
                          ₹{item.total}
                        </div>
                      </div>
                    </div>
                  ))}
                  {billItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Select an order to start billing</p>
                    </div>
                  )}
                </div>

                {billItems.length > 0 && (
                  <>
                    <Separator />

                    {/* Tax & Discount */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Tax Selection */}
                      <div className="space-y-2">
                        <Label>GST Rate</Label>
                        <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(Number(v))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% - No GST</SelectItem>
                            <SelectItem value="5">5% GST</SelectItem>
                            <SelectItem value="12">12% GST</SelectItem>
                            <SelectItem value="18">18% GST</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Discount */}
                      <div className="space-y-2">
                        <Label>Discount</Label>
                        <div className="flex gap-2">
                          <Select value={discountType} onValueChange={(v: 'flat' | 'percentage') => setDiscountType(v)}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="flat">₹</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{totals.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>GST ({taxRate}%)</span>
                        <span>₹{totals.taxAmount.toFixed(2)}</span>
                      </div>
                      {totals.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-₹{totals.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Grand Total</span>
                        <span>₹{totals.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Mode Selection */}
                    <div className="space-y-3">
                      <Label>Payment Mode</Label>
                      <RadioGroup value={paymentMode} onValueChange={setPaymentMode}>
                        <div className="grid grid-cols-2 gap-3">
                          <Label
                            htmlFor="cash"
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              paymentMode === 'cash' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <RadioGroupItem value="cash" id="cash" />
                            <Banknote className="h-5 w-5" />
                            <span>Cash</span>
                          </Label>

                          <Label
                            htmlFor="card"
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              paymentMode === 'card' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <RadioGroupItem value="card" id="card" />
                            <CreditCard className="h-5 w-5" />
                            <span>Card</span>
                          </Label>

                          <Label
                            htmlFor="upi"
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              paymentMode === 'upi' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <RadioGroupItem value="upi" id="upi" />
                            <Smartphone className="h-5 w-5" />
                            <span>UPI</span>
                          </Label>

                          <Label
                            htmlFor="wallet"
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              paymentMode === 'wallet' ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                          >
                            <RadioGroupItem value="wallet" id="wallet" />
                            <Wallet className="h-5 w-5" />
                            <span>Wallet</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Button onClick={generateInvoice} className="w-full" size="lg">
                      <Receipt className="h-5 w-5 mr-2" />
                      Generate Invoice & Process Payment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>View and manage all generated invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Payment Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>Table {invoice.table_number}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.payment_mode.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{invoice.grand_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPreviewInvoice(invoice);
                              setShowInvoicePreview(true);
                            }}
                          >
                            <Receipt className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printInvoice(invoice)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refund Management</CardTitle>
              <CardDescription>Process refunds for invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices.map(invoice => (
                          <SelectItem key={invoice.id} value={invoice.invoice_number}>
                            {invoice.invoice_number} - ₹{invoice.grand_total.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Refund Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select refund type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Refund</SelectItem>
                        <SelectItem value="partial">Partial Refund</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Refund Amount (₹)</Label>
                    <Input type="number" placeholder="Enter amount" />
                  </div>

                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input placeholder="Reason for refund" />
                  </div>
                </div>

                <Button className="w-full">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Process Refund
                </Button>

                <Separator className="my-6" />

                {/* Refund History */}
                <div>
                  <h3 className="font-medium mb-4">Refund History</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice No.</TableHead>
                        <TableHead>Refund Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={5}>
                          No refunds processed yet
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Invoice details and summary</DialogDescription>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-2xl font-bold">Restaurant Management System</h2>
                <p className="text-sm text-muted-foreground">Movicloud Labs</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Invoice: {previewInvoice.invoice_number}
                </p>
              </div>

              {/* Customer Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{previewInvoice.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table Number</p>
                  <p className="font-medium">Table {previewInvoice.table_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{new Date(previewInvoice.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Mode</p>
                  <p className="font-medium">{previewInvoice.payment_mode.toUpperCase()}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-3">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(previewInvoice.items || []).map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.price}</TableCell>
                        <TableCell className="text-right">₹{item.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{previewInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({previewInvoice.tax_rate}%)</span>
                  <span>₹{previewInvoice.tax_amount.toFixed(2)}</span>
                </div>
                {previewInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{previewInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Grand Total</span>
                  <span>₹{previewInvoice.grand_total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={() => downloadInvoice(previewInvoice)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={() => printInvoice(previewInvoice)} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
