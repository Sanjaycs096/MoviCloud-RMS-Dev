import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Database, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '@/utils/supabase/info';
import { toast } from 'sonner';

export function DataSeeder() {
  const [loading, setLoading] = useState(false);

  const seedSampleData = async () => {
    setLoading(true);
    try {
      // Sample Menu Items
      const sampleMenuItems = [
        {
          name: 'Classic Burger',
          category: 'main-course',
          price: 12.99,
          description: 'Juicy beef patty with fresh lettuce, tomato, and special sauce',
          available: true,
        },
        {
          name: 'Margherita Pizza',
          category: 'main-course',
          price: 14.99,
          description: 'Fresh mozzarella, basil, and tomato sauce on crispy crust',
          available: true,
        },
        {
          name: 'Caesar Salad',
          category: 'appetizers',
          price: 8.99,
          description: 'Crisp romaine lettuce with parmesan and homemade Caesar dressing',
          available: true,
        },
        {
          name: 'Chicken Wings',
          category: 'appetizers',
          price: 10.99,
          description: 'Crispy wings tossed in your choice of sauce',
          available: true,
        },
        {
          name: 'Chocolate Lava Cake',
          category: 'desserts',
          price: 6.99,
          description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
          available: true,
        },
        {
          name: 'Tiramisu',
          category: 'desserts',
          price: 7.99,
          description: 'Classic Italian dessert with coffee-soaked ladyfingers',
          available: true,
        },
        {
          name: 'Fresh Lemonade',
          category: 'beverages',
          price: 3.99,
          description: 'Freshly squeezed lemonade with a hint of mint',
          available: true,
        },
        {
          name: 'Iced Coffee',
          category: 'beverages',
          price: 4.99,
          description: 'Cold brew coffee served over ice',
          available: true,
        },
      ];

      // Create menu items
      for (const item of sampleMenuItems) {
        await fetch(
          `${API_BASE_URL}/menu`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          }
        );
      }

      // Sample Tables
      const sampleTables = [
        { number: 1, capacity: 2, status: 'available' },
        { number: 2, capacity: 4, status: 'available' },
        { number: 3, capacity: 4, status: 'available' },
        { number: 4, capacity: 6, status: 'available' },
        { number: 5, capacity: 2, status: 'available' },
        { number: 6, capacity: 8, status: 'available' },
      ];

      // Create tables
      for (const table of sampleTables) {
        await fetch(
          `${API_BASE_URL}/tables`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(table),
          }
        );
      }

      // Sample Staff
      const sampleStaff = [
        {
          name: 'John Smith',
          role: 'chef',
          phone: '555-0101',
          email: 'john.smith@restaurant.com',
          shift: 'morning',
        },
        {
          name: 'Sarah Johnson',
          role: 'waiter',
          phone: '555-0102',
          email: 'sarah.johnson@restaurant.com',
          shift: 'afternoon',
        },
        {
          name: 'Mike Davis',
          role: 'cashier',
          phone: '555-0103',
          email: 'mike.davis@restaurant.com',
          shift: 'evening',
        },
        {
          name: 'Emily Wilson',
          role: 'manager',
          phone: '555-0104',
          email: 'emily.wilson@restaurant.com',
          shift: 'morning',
        },
      ];

      // Create staff members
      for (const member of sampleStaff) {
        await fetch(
          `${API_BASE_URL}/staff`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(member),
          }
        );
      }

      // Sample Inventory
      const sampleInventory = [
        {
          itemName: 'Ground Beef',
          quantity: 25,
          unit: 'kg',
          lowStockThreshold: 10,
          supplierId: 'SUP-001',
        },
        {
          itemName: 'Mozzarella Cheese',
          quantity: 15,
          unit: 'kg',
          lowStockThreshold: 5,
          supplierId: 'SUP-002',
        },
        {
          itemName: 'Tomatoes',
          quantity: 30,
          unit: 'kg',
          lowStockThreshold: 10,
          supplierId: 'SUP-003',
        },
        {
          itemName: 'Lettuce',
          quantity: 20,
          unit: 'kg',
          lowStockThreshold: 8,
          supplierId: 'SUP-003',
        },
      ];

      // Create inventory items
      for (const item of sampleInventory) {
        await fetch(
          `${API_BASE_URL}/inventory`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          }
        );
      }

      // Sample Order
      const sampleOrder = {
        customerName: 'Demo Customer',
        tableNumber: 2,
        type: 'dine-in',
        items: [
          { name: 'Classic Burger', quantity: 2, price: 12.99 },
          { name: 'Fresh Lemonade', quantity: 2, price: 3.99 },
        ],
        total: 33.96,
        status: 'placed',
      };

      await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sampleOrder),
        }
      );

      toast.success('Sample data loaded successfully!');
    } catch (error) {
      console.error('Error seeding data:', error);
      toast.error('Failed to load sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Quick Start - Load Sample Data
        </CardTitle>
        <CardDescription>
          Load sample menu items, tables, staff, inventory, and a demo order to quickly explore the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={seedSampleData} disabled={loading} className="w-full">
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Loading Sample Data...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Load Sample Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
