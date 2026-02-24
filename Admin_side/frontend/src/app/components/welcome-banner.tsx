import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { X, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('rms-welcome-dismissed');
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('rms-welcome-dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Welcome to Restaurant Management System</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-700">
          Complete RMS Solution for Movicloud Labs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm mb-2 text-blue-900">Core Modules Implemented:</h4>
            <ul className="text-sm space-y-1 text-blue-800">
              <li>✓ Admin Dashboard with Analytics</li>
              <li>✓ Menu Management (CRUD)</li>
              <li>✓ Order Management & Tracking</li>
              <li>✓ Kitchen Display System</li>
              <li>✓ Table Management</li>
              <li>✓ Customer View & Ordering</li>
              <li>✓ Inventory Tracking</li>
              <li>✓ Staff Management</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2 text-blue-900">Getting Started:</h4>
            <ol className="text-sm space-y-1 text-blue-800 list-decimal list-inside">
              <li>Click "Dashboard" tab to view analytics</li>
              <li>Use "Load Sample Data" button to populate demo data</li>
              <li>Explore each module using the navigation tabs</li>
              <li>Try placing an order from the Customer Menu</li>
              <li>Monitor orders in the Kitchen tab</li>
            </ol>
          </div>
        </div>
        <div className="pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            <strong>Tech Stack:</strong> React + TypeScript • Supabase Backend • Tailwind CSS • Recharts for Analytics
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
