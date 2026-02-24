import { useState } from 'react';
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  ArrowRight,
  IndianRupee,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { cn } from '@/app/components/ui/utils';

// --- Types ---
type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

interface RefundRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amountPaid: number;
  orderPlacedTime: string;
  refundRequestedTime: string;
  reason: string;
  suggestedRefund: {
    type: 'Full Refund' | 'Partial Refund' | 'Not Eligible';
    amount: number;
    percentage?: number;
  };
  status: RequestStatus;
}

// --- Helper Functions ---
const getDuration = (start: string, end: string): string => {
  const minutes = differenceInMinutes(new Date(end), new Date(start));
  const hours = differenceInHours(new Date(end), new Date(start));
  
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    const remainingMins = minutes % 60;
    return remainingMins > 0 
      ? `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`
      : `${hours} hr${hours !== 1 ? 's' : ''}`;
  }
};

// --- Mock Data ---
const MOCK_REFUND_REQUESTS: RefundRequest[] = [
  {
    id: 'REF-2026-001',
    orderId: 'ORD-205',
    customerName: 'Rohit Sharma',
    customerPhone: '+91 98765 43210',
    amountPaid: 1250,
    orderPlacedTime: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
    refundRequestedTime: new Date(Date.now() - 120000).toISOString(), // 2 mins ago
    reason: 'Changed mind about the order. Want to cancel.',
    suggestedRefund: {
      type: 'Full Refund',
      amount: 1250,
      percentage: 100
    },
    status: 'Pending'
  },
  {
    id: 'REF-2026-002',
    orderId: 'BK-2026-015',
    customerName: 'Anita Roy',
    customerPhone: '+91 98765 12345',
    amountPaid: 850,
    orderPlacedTime: new Date(Date.now() - 5400000).toISOString(), // 90 mins ago
    refundRequestedTime: new Date(Date.now() - 300000).toISOString(), // 5 mins ago
    reason: 'Food was delayed by more than 45 minutes. Not satisfied with service.',
    suggestedRefund: {
      type: 'Partial Refund',
      amount: 425,
      percentage: 50
    },
    status: 'Pending'
  },
  {
    id: 'REF-2026-003',
    orderId: 'ORD-198',
    customerName: 'Kabir Singh',
    customerPhone: '+91 91234 56789',
    amountPaid: 2100,
    orderPlacedTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    refundRequestedTime: new Date(Date.now() - 180000).toISOString(), // 3 mins ago
    reason: 'Food quality was poor. Items were cold on arrival.',
    suggestedRefund: {
      type: 'Partial Refund',
      amount: 1050,
      percentage: 50
    },
    status: 'Pending'
  },
  {
    id: 'REF-2026-004',
    orderId: 'ORD-187',
    customerName: 'Sneha Patel',
    customerPhone: '+91 98123 45678',
    amountPaid: 680,
    orderPlacedTime: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    refundRequestedTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    reason: 'Already consumed the food but want refund.',
    suggestedRefund: {
      type: 'Not Eligible',
      amount: 0,
      percentage: 0
    },
    status: 'Pending'
  }
];

export function RefundManagement() {
  const [requests, setRequests] = useState<RefundRequest[]>(MOCK_REFUND_REQUESTS);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const historyRequests = requests.filter(r => r.status !== 'Pending');

  const handleApprove = (id: string) => {
    const request = requests.find(r => r.id === id);
    setRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'Approved' as RequestStatus } : r
    ));
    toast.success(`Refund of ₹${request?.suggestedRefund.amount} approved and will be processed within 3-5 business days.`);
  };

  const handleRejectClick = (id: string) => {
    setSelectedRequest(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setRequests(prev => prev.map(r => 
      r.id === selectedRequest ? { ...r, status: 'Rejected' as RequestStatus } : r
    ));
    
    toast.success('Refund request rejected. Customer will be notified with reason.');
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedRequest(null);
  };

  return (
    <div className="bg-billing-module min-h-screen space-y-6 p-6">
      <div className="module-container flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">Refund Management</h2>
          <p className="text-gray-200 mt-1">Review and process customer refund requests</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">{pendingRequests.length} Pending</span>
        </div>
      </div>

      {/* Policy Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-lg p-2 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                Refund Policy Guidelines
              </h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                  <div className="font-semibold text-green-700 mb-1 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Full Refund (100%)
                  </div>
                  <p className="text-xs text-gray-600">Order placed within last 15 minutes, not yet prepared</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                  <div className="font-semibold text-orange-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Partial Refund (50%)
                  </div>
                  <p className="text-xs text-gray-600">Food prepared but not delivered, or service quality issues</p>
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
                  <div className="font-semibold text-red-700 mb-1 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />
                    Not Eligible
                  </div>
                  <p className="text-xs text-gray-600">Food already consumed or delivered without complaints</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
            Pending Approvals
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="text-xs">{pendingRequests.length}</Badge>
            )}
          </h3>
          
          {pendingRequests.map(req => (
            <RefundRequestCard 
              key={req.id} 
              request={req} 
              onApprove={handleApprove}
              onReject={handleRejectClick}
            />
          ))}
          
          {pendingRequests.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="font-medium text-gray-900">All refund requests processed!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending requests at the moment</p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div>
          <Card className="bg-white shadow-sm sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Actions</CardTitle>
              <CardDescription className="text-xs">Last 10 processed requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {historyRequests.slice(0, 10).map(req => (
                  <div key={req.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-medium text-sm text-gray-900">{req.customerName}</span>
                      <Badge 
                        variant={req.status === 'Approved' ? 'default' : 'destructive'} 
                        className={cn(
                          "text-[10px] font-bold",
                          req.status === 'Approved' ? 'bg-green-600' : 'bg-red-600'
                        )}
                      >
                        {req.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 font-mono">{req.orderId}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Paid: ₹{req.amountPaid}</span>
                      {req.status === 'Approved' && (
                        <span className="text-green-700 font-bold">
                          Refunded: ₹{req.suggestedRefund.amount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {historyRequests.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-xs">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p>No history yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this refund. The customer will receive this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection *</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Order already delivered and consumed, No quality issues reported within delivery time..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectConfirm}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RefundRequestCard({ 
  request, 
  onApprove, 
  onReject 
}: { 
  request: RefundRequest; 
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const duration = getDuration(request.orderPlacedTime, request.refundRequestedTime);

  const suggestionColors = {
    'Full Refund': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    'Partial Refund': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    'Not Eligible': {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800'
    }
  };

  const colors = suggestionColors[request.suggestedRefund.type];

  return (
    <Card className="border-l-4 border-l-[#8B5A2B] shadow-sm hover:shadow-md transition-shadow bg-white">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-lg text-gray-900">{request.customerName}</h4>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="font-mono bg-gray-50 text-gray-700">
                {request.orderId}
              </Badge>
              <span className="text-xs">{request.customerPhone}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Amount Paid</p>
            <p className="font-bold text-xl text-gray-900">₹{request.amountPaid}</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 justify-center md:justify-start">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-semibold uppercase tracking-wider">Order Placed</span>
              </div>
              <p className="font-bold text-blue-900">
                {format(new Date(request.orderPlacedTime), 'hh:mm a')}
              </p>
              <p className="text-xs text-blue-700">
                {format(new Date(request.orderPlacedTime), 'dd MMM yyyy')}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-blue-300 to-purple-300"></div>
                <div className="bg-white rounded-full px-3 py-1.5 border-2 border-purple-300 shadow-sm">
                  <span className="text-xs font-bold text-purple-700">{duration}</span>
                </div>
                <div className="h-px w-8 bg-gradient-to-r from-purple-300 to-blue-300"></div>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 justify-center md:justify-end">
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="font-semibold uppercase tracking-wider">Refund Requested</span>
              </div>
              <p className="font-bold text-purple-900">
                {format(new Date(request.refundRequestedTime), 'hh:mm a')}
              </p>
              <p className="text-xs text-purple-700">
                {format(new Date(request.refundRequestedTime), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Customer Reason</p>
          <p className="text-sm text-gray-900 leading-relaxed">{request.reason}</p>
        </div>

        {/* System Suggestion & Actions */}
        <div className={cn("rounded-lg p-4 border-2", colors.bg, colors.border)}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                System Suggestion
              </p>
              <div className="flex items-center gap-2">
                <Badge className={cn("font-bold text-sm", colors.badge)}>
                  {request.suggestedRefund.type}
                </Badge>
                <span className={cn("font-bold text-2xl", colors.text)}>
                  ₹{request.suggestedRefund.amount}
                </span>
                {request.suggestedRefund.percentage !== undefined && request.suggestedRefund.percentage > 0 && (
                  <span className={cn("text-sm font-semibold", colors.text)}>
                    ({request.suggestedRefund.percentage}%)
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 md:flex-none border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                onClick={() => onReject(request.id)}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
              <Button 
                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => onApprove(request.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Approve Refund
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
