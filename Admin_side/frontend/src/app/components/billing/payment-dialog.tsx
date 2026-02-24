import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import { API_BASE_URL } from '@/utils/supabase/info';
import { toast } from 'sonner';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  amount: number;
  onSuccess?: () => void;
}

export function PaymentDialog({ open, onOpenChange, orderId, amount, onSuccess }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'wallet'>('cash');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/billing/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            amount,
            method: paymentMethod,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast.success('Payment processed successfully!');
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: Banknote },
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
    { id: 'upi', name: 'UPI', icon: Smartphone },
    { id: 'wallet', name: 'Digital Wallet', icon: Wallet },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Select payment method and confirm transaction
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted transition-colors ${
                      paymentMethod === method.id ? 'border-primary bg-muted' : ''
                    }`}
                    onClick={() => setPaymentMethod(method.id as any)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      {method.name}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
