import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Switch } from '@/app/components/ui/switch';
import { Separator } from '@/app/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { cn } from '@/app/components/ui/utils';
import { LoadingBilling } from '@/app/components/ui/loading-spinner';
import {
  DollarSign, CreditCard, Smartphone, Wallet, Receipt,
  CheckCircle, Clock, AlertCircle, Percent, IndianRupee,
  Printer, Download, Coffee, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { mockApi, type MockOrder, type MockInvoice } from '@/app/services/mock-api';

// ============================================================================
// BILL GENERATION CARD COMPONENT
// ============================================================================

interface BillCardProps {
  order: MockOrder;
  onGenerateBill: (order: MockOrder) => void;
}

function BillCard({ order, onGenerateBill }: BillCardProps) {
  const ageMinutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000 / 60);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="hover:shadow-lg transition-shadow border-2 border-amber-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {order.displayId}
                <Badge className="bg-orange-100 text-orange-800">
                  Bill Requested
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {order.customerName}
                {order.tableNumber && ` • Table ${order.tableNumber}`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-3 h-3" />
              <span>{ageMinutes}m ago</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Items */}
          <div className="space-y-1">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Subtotal</span>
            <span className="font-bold text-xl text-gray-900">₹{order.totalAmount}</span>
          </div>

          {/* Action */}
          <Button
            className="w-full bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
            onClick={() => onGenerateBill(order)}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Generate Bill
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// BILL CALCULATOR DIALOG
// ============================================================================

interface BillCalculatorProps {
  open: boolean;
  onClose: () => void;
  order: MockOrder | null;
  onComplete: (invoice: Partial<MockInvoice>) => void;
}

function BillCalculator({ open, onClose, order, onComplete }: BillCalculatorProps) {
  const [taxPercent, setTaxPercent] = useState(5);
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('Cash');

  if (!order) return null;

  const subtotal = order.totalAmount;
  const taxAmount = (subtotal * taxPercent) / 100;
  
  let discountAmount = 0;
  if (discountType === 'flat') {
    discountAmount = discountValue;
  } else {
    discountAmount = (subtotal * discountValue) / 100;
  }

  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleGenerateInvoice = () => {
    const invoice: Partial<MockInvoice> = {
      orderId: order.id,
      tableId: order.tableId,
      tableNumber: order.tableNumber || 'N/A',
      customerName: order.customerName,
      items: (order.items || []).map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      taxPercent,
      taxAmount,
      discountType,
      discountValue,
      discountAmount,
      grandTotal,
      paymentMethod
    };

    onComplete(invoice);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="w-6 h-6 text-[#8B5A2B]" />
            Generate Invoice - {order.displayId}
          </DialogTitle>
          <DialogDescription>
            {order.customerName} • Table {order.tableNumber || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-bold text-gray-900">Order Items</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tax */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tax (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">
                = ₹{taxAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Discount</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="discount-type" className="text-xs text-gray-600">
                  Type:
                </Label>
                <RadioGroup
                  value={discountType}
                  onValueChange={(v) => setDiscountType(v as 'flat' | 'percent')}
                  className="flex gap-3"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="flat" id="flat" />
                    <Label htmlFor="flat" className="text-sm cursor-pointer">
                      Flat (₹)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="percent" id="percent" />
                    <Label htmlFor="percent" className="text-sm cursor-pointer">
                      Percent (%)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={0}
                step={discountType === 'flat' ? 10 : 1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">
                = ₹{discountAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Grand Total */}
          <div className="bg-[#8B5A2B] text-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-3xl font-bold">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Method</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as 'Cash' | 'Card' | 'UPI')}
              className="grid grid-cols-3 gap-3"
            >
              <div>
                <RadioGroupItem value="Cash" id="cash" className="peer sr-only" />
                <Label
                  htmlFor="cash"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#8B5A2B] peer-data-[state=checked]:bg-amber-50 cursor-pointer"
                >
                  <Wallet className="mb-2 h-6 w-6" />
                  <span className="font-medium">Cash</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Card" id="card" className="peer sr-only" />
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#8B5A2B] peer-data-[state=checked]:bg-amber-50 cursor-pointer"
                >
                  <CreditCard className="mb-2 h-6 w-6" />
                  <span className="font-medium">Card</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="UPI" id="upi" className="peer sr-only" />
                <Label
                  htmlFor="upi"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-[#8B5A2B] peer-data-[state=checked]:bg-amber-50 cursor-pointer"
                >
                  <Smartphone className="mb-2 h-6 w-6" />
                  <span className="font-medium">UPI</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#8B5A2B] hover:bg-[#6B4520] text-white"
              onClick={handleGenerateInvoice}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// INVOICE HISTORY CARD
// ============================================================================

interface InvoiceCardProps {
  invoice: MockInvoice;
  onPrint: (invoice: MockInvoice) => void;
  onDownload: (invoice: MockInvoice) => void;
}

function InvoiceCard({ invoice, onPrint, onDownload }: InvoiceCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {invoice.id}
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Paid
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                {invoice.customerName} • Table {invoice.tableNumber}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900">₹{invoice.grandTotal.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{invoice.paymentMethod}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({invoice.taxPercent}%):</span>
              <span>₹{invoice.taxAmount.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onDownload(invoice)}
            >
              <Download className="w-3 h-3 mr-2" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onPrint(invoice)}
            >
              <Printer className="w-3 h-3 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BillingPaymentComprehensive() {
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MockOrder | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        mockApi.getOrders(),
        mockApi.getInvoices()
      ]);
      
      if (ordersRes.success) setOrders(ordersRes.data);
      if (invoicesRes.success) setInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBillCalculator = (order: MockOrder) => {
    setSelectedOrder(order);
    setCalculatorOpen(true);
  };

  const handleCompletePayment = async (invoiceData: Partial<MockInvoice>) => {
    if (!selectedOrder) return;

    try {
      // Create invoice
      const invoiceResult = await mockApi.createInvoice(invoiceData);
      
      // Update order status to completed
      await mockApi.updateOrderStatus(selectedOrder.id, 'completed');
      await mockApi.updatePaymentStatus(selectedOrder.id, 'paid');

      // Update table to Cleaning status
      if (selectedOrder.tableId) {
        await mockApi.updateTable(selectedOrder.tableId, {
          status: 'Cleaning',
          cleaningEndTime: Date.now() + 300000, // 5 minutes from now
          kitchenStatus: 'Idle',
          currentOrderId: null
        });
      }

      toast.success('Payment completed! Table set to cleaning.', {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });

      setCalculatorOpen(false);
      setSelectedOrder(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to complete payment');
    }
  };

  const handlePrintInvoice = (invoice: MockInvoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoice');
      return;
    }
    
    const itemRows = invoice.items?.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('') || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.id}</title>
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
          <p style="font-weight: bold; margin-top: 10px;">Invoice: ${invoice.id}</p>
        </div>
        
        <div class="info">
          <div>
            <p><strong>Customer:</strong> ${invoice.customerName}</p>
            <p><strong>Table:</strong> ${invoice.tableNumber}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Date:</strong> ${new Date(invoice.createdAt || Date.now()).toLocaleString()}</p>
            <p><strong>Payment:</strong> ${invoice.paymentMethod}</p>
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
          <div>GST (${invoice.taxPercent}%): ₹${invoice.taxAmount.toFixed(2)}</div>
          ${invoice.discountAmount > 0 ? `<div class="discount">Discount: -₹${invoice.discountAmount.toFixed(2)}</div>` : ''}
          <div class="grand-total">Grand Total: ₹${invoice.grandTotal.toFixed(2)}</div>
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
    toast.success(`Invoice ${invoice.id} sent to printer`);
  };

  const handleDownloadInvoice = (invoice: MockInvoice) => {
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
    doc.text(`Invoice: ${invoice.id}`, pageWidth / 2, 38, { align: 'center' });
    
    // Separator line
    doc.setLineWidth(0.5);
    doc.line(14, 42, pageWidth - 14, 42);
    
    // Customer & Invoice info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoStartY = 50;
    
    doc.text(`Customer: ${invoice.customerName}`, 14, infoStartY);
    doc.text(`Table: ${invoice.tableNumber}`, 14, infoStartY + 6);
    doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleString()}`, pageWidth - 14, infoStartY, { align: 'right' });
    doc.text(`Payment: ${invoice.paymentMethod}`, pageWidth - 14, infoStartY + 6, { align: 'right' });
    
    // Items table
    const tableData = invoice.items?.map(item => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.price.toFixed(2)}`,
      `Rs.${(item.price * item.quantity).toFixed(2)}`
    ]) || [];
    
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
    
    doc.text(`GST (${invoice.taxPercent}%):`, totalsX - 50, finalY + 6);
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
    
    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for dining with us!', pageWidth / 2, currentY + 25, { align: 'center' });
    doc.text('This is a computer generated invoice.', pageWidth / 2, currentY + 30, { align: 'center' });
    
    // Save the PDF
    doc.save(`${invoice.id}.pdf`);
    toast.success(`Invoice ${invoice.id} downloaded as PDF`);
  };

  const billRequestedOrders = orders.filter(o => o.status === 'bill_requested');

  if (loading) {
    return <LoadingBilling />;
  }

  return (
    <div className="bg-billing-module min-h-screen space-y-6">
      {/* Header */}
      <div className="module-container flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Billing & Payment</h1>
          <p className="text-gray-200 mt-1">Manage bills and process payments</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2 border-amber-300 bg-amber-50 text-amber-900">
          <DollarSign className="w-4 h-4 mr-2" />
          {billRequestedOrders.length} Pending Bills
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-white">
          <TabsTrigger value="pending">
            <AlertCircle className="w-4 h-4 mr-2" />
            Bill Generation ({billRequestedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="w-4 h-4 mr-2" />
            Invoice History ({invoices.length})
          </TabsTrigger>
        </TabsList>

        {/* Bill Generation Tab */}
        <TabsContent value="pending" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {billRequestedOrders.map(order => (
                <BillCard
                  key={order.id}
                  order={order}
                  onGenerateBill={handleOpenBillCalculator}
                />
              ))}
            </AnimatePresence>
          </div>

          {billRequestedOrders.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <Receipt className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-bold">No pending bills</p>
              <p className="text-gray-400 mt-2">All bills are processed</p>
            </div>
          )}
        </TabsContent>

        {/* Invoice History Tab */}
        <TabsContent value="history" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {invoices.map(invoice => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPrint={handlePrintInvoice}
                  onDownload={handleDownloadInvoice}
                />
              ))}
            </AnimatePresence>
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <FileText className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-xl font-bold">No invoices yet</p>
              <p className="text-gray-400 mt-2">Completed invoices will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bill Calculator Dialog */}
      <BillCalculator
        open={calculatorOpen}
        onClose={() => {
          setCalculatorOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onComplete={handleCompletePayment}
      />
    </div>
  );
}
