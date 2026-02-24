import { useState } from 'react';
import { 
  CreditCard, 
  Utensils, 
  RotateCcw,
  CalendarCheck
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { BillingPayment } from './billing-payment';
import { SeatBooking } from './SeatBooking';
import { RefundManagement } from './RefundManagement';

export function BillingModule() {
  const [activeModule, setActiveModule] = useState('booking');

  return (
    <div className="bg-billing-module min-h-screen pb-20">
      {/* Module Navigation Header */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <Tabs value={activeModule} onValueChange={setActiveModule} className="w-full">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 font-bold text-xl text-[#8B5A2B]">
                <CreditCard className="h-6 w-6" />
                <span>Admin Billing & Payments</span>
              </div>
              
              <TabsList className="bg-transparent h-16 p-0 gap-6">
                <TabsTrigger 
                  value="booking" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5A2B] data-[state=active]:text-[#8B5A2B] data-[state=active]:bg-transparent px-2 font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <CalendarCheck className="h-4 w-4 mr-2" />
                  Seat Booking
                </TabsTrigger>
                <TabsTrigger 
                  value="dining" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5A2B] data-[state=active]:text-[#8B5A2B] data-[state=active]:bg-transparent px-2 font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Utensils className="h-4 w-4 mr-2" />
                  Dining Billing
                </TabsTrigger>
                <TabsTrigger 
                  value="refunds" 
                  className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#8B5A2B] data-[state=active]:text-[#8B5A2B] data-[state=active]:bg-transparent px-2 font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refunds
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="py-6">
              <TabsContent value="booking" className="mt-0 outline-none animate-in fade-in-50">
                <SeatBooking />
              </TabsContent>
              
              <TabsContent value="dining" className="mt-0 outline-none animate-in fade-in-50">
                <BillingPayment />
              </TabsContent>
              
              <TabsContent value="refunds" className="mt-0 outline-none animate-in fade-in-50">
                <RefundManagement />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}