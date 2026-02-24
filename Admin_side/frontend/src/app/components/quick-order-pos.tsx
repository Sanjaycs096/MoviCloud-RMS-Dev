import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/app/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { 
  Plus, Minus, X, IndianRupee, UtensilsCrossed, Zap, 
  Search, Sparkles, ShoppingBag, CheckCircle, ChevronDown, 
  ChevronUp, Tag as TagIcon, Flame, Package2, Clock, 
  AlertTriangle, ChefHat, Repeat, Volume2, VolumeX, 
  ArrowRight, ArrowLeft, Ban, Edit, Trash2, Check, 
  Timer, TrendingUp, Package
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/supabase/info';
import { tablesApi } from '@/utils/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { restaurantState } from '@/app/services/restaurant-state';
import { Switch } from '@/app/components/ui/switch';
import { Progress } from '@/app/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';

// ==================== INTERFACES ====================

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  dietType?: 'veg' | 'non-veg';
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  calories?: number;
  preparationTime?: number;
}

interface ComboMeal {
  id: string;
  name: string;
  description: string;
  items: string[]; // menu item IDs
  originalPrice: number;
  discountedPrice: number;
  image: string;
  available: boolean;
  calories?: number;
}

interface QuickOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  isCombo?: boolean;
  comboItems?: MenuItem[]; // expanded combo items
  customization?: string;
  category?: string;
  cookingStation?: 'grill' | 'wok' | 'tandoor' | 'fryer' | 'salad';
}

interface OrderTimeline {
  status: 'placed' | 'accepted' | 'preparing' | 'ready' | 'served';
  timestamp: Date;
  duration?: number;
}

interface RecentOrder {
  id: string;
  items: QuickOrderItem[];
  total: number;
  timestamp: Date;
}

interface TableData {
  _id: string;
  name: string;
  displayNumber: string;
  capacity: number;
  location: string;
  segment: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  reservationType?: string;
  guestCount?: number;
  waiterName?: string | null;
  waiterId?: string | null;
}

interface QuickOrderPOSProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

// ==================== CONSTANTS ====================

const QUICK_TAGS = ['Extra Spicy', 'No Onion', 'No Garlic', 'Priority', 'VIP', 'Allergy'];

const ORDER_STATUSES: OrderTimeline['status'][] = ['placed', 'accepted', 'preparing', 'ready', 'served'];

const STATUS_COLORS = {
  placed: 'bg-blue-500',
  accepted: 'bg-yellow-500',
  preparing: 'bg-orange-500',
  ready: 'bg-green-500',
  served: 'bg-gray-500',
};

const COOKING_STATIONS = {
  grill: { label: 'Grill', icon: Flame, color: 'text-red-600 bg-red-50' },
  wok: { label: 'Wok', icon: ChefHat, color: 'text-orange-600 bg-orange-50' },
  tandoor: { label: 'Tandoor', icon: Flame, color: 'text-yellow-600 bg-yellow-50' },
  fryer: { label: 'Fryer', icon: Package, color: 'text-amber-600 bg-amber-50' },
  salad: { label: 'Salad', icon: Package2, color: 'text-green-600 bg-green-50' },
};

// Feature #13: Sound Effects
const playSound = (type: 'add' | 'remove' | 'complete' | 'error', soundEnabled: boolean) => {
  if (!soundEnabled) return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  const frequencies = {
    add: 800,
    remove: 400,
    complete: 1000,
    error: 200,
  };
  
  oscillator.frequency.value = frequencies[type];
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
};

// ==================== MAIN COMPONENT ====================

export function QuickOrderPOS({ open, onOpenChange, onOrderCreated }: QuickOrderPOSProps) {
  // ========== STATE MANAGEMENT ==========
  
  // Order Info State
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [availableTables, setAvailableTables] = useState<TableData[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  // Menu Data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [comboMeals, setComboMeals] = useState<ComboMeal[]>([]);
  const [loading, setLoading] = useState(true);

  // Item Selection State
  const [activeTab, setActiveTab] = useState<'combos' | 'items' | 'recent'>('combos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Order Items State
  const [orderItems, setOrderItems] = useState<QuickOrderItem[]>([]);

  // Progressive Disclosure State
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Feature #1: Live Order Timeline State
  const [orderTimeline, setOrderTimeline] = useState<OrderTimeline[]>([
    { status: 'placed', timestamp: new Date(), duration: 0 }
  ]);
  const [currentStatus, setCurrentStatus] = useState<OrderTimeline['status']>('placed');

  // Feature #2: Bottleneck Detection State
  const [isBottleneck, setIsBottleneck] = useState(false);
  const [preparingDuration, setPreparingDuration] = useState(0);
  const BOTTLENECK_THRESHOLD = 15; // minutes

  // Feature #3: Smart KOT Grouping State
  const [groupedItems, setGroupedItems] = useState<Record<string, QuickOrderItem[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Feature #4: Rollback Protection State
  const [rollbackDialog, setRollbackDialog] = useState(false);

  // Feature #5: Drag Gesture State
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Feature #6: Combo Split Select State
  const [expandedCombo, setExpandedCombo] = useState<string | null>(null);

  // Feature #8: Recent Orders State
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  // Feature #13: Sound Feedback State
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Role State for access control
  const [currentRole, setCurrentRole] = useState<'admin' | 'waiter'>('admin');

  // Feature #11: Inline Search (already implemented with searchQuery)

  // Feature #12: Gesture Shortcuts State
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Refs for gesture handling
  const orderCardRef = useRef<HTMLDivElement>(null);

  // ========== EFFECTS ==========

  // Check current role on open
  useEffect(() => {
    if (open) {
      const role = restaurantState.getRole();
      setCurrentRole(role);
    }
  }, [open]);

  // Fetch menu items and combos from Menu Management
  useEffect(() => {
    if (open) {
      fetchMenuData();
      loadRecentOrders();
      fetchAvailableTables();
    }
  }, [open]);

  // Feature #2: Bottleneck Detection - Monitor preparing duration
  useEffect(() => {
    if (currentStatus === 'preparing') {
      const interval = setInterval(() => {
        setPreparingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= BOTTLENECK_THRESHOLD) {
            setIsBottleneck(true);
            // Feature #10: Smart Notification
            if (newDuration === BOTTLENECK_THRESHOLD) {
              toast.warning('⚠️ Order taking longer than usual', { duration: 3000 });
            }
          }
          return newDuration;
        });
      }, 60000); // every minute
      
      return () => clearInterval(interval);
    } else {
      setPreparingDuration(0);
      setIsBottleneck(false);
    }
  }, [currentStatus]);

  // Feature #3: Smart KOT Grouping - Group items by cooking station
  useEffect(() => {
    const grouped: Record<string, QuickOrderItem[]> = {};
    
    orderItems.forEach(item => {
      const station = item.cookingStation || 'other';
      if (!grouped[station]) {
        grouped[station] = [];
      }
      grouped[station].push(item);
    });
    
    setGroupedItems(grouped);
  }, [orderItems]);

  // ========== DATA FETCHING ==========

  const fetchMenuData = async () => {
    setLoading(true);
    
    // Mock data with cooking stations
    const mockMenuItems: MenuItem[] = [
      {
        id: '1',
        name: 'Paneer Tikka',
        category: 'appetizers',
        price: 280,
        description: 'Grilled cottage cheese with spices',
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
        available: true,
        dietType: 'veg',
        spiceLevel: 'medium',
        calories: 350,
        preparationTime: 15
      },
      {
        id: '2',
        name: 'Butter Chicken',
        category: 'main-course',
        price: 350,
        description: 'Creamy tomato-based chicken curry',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
        available: true,
        dietType: 'non-veg',
        spiceLevel: 'mild',
        calories: 520,
        preparationTime: 25
      },
      {
        id: '3',
        name: 'Dal Makhani',
        category: 'main-course',
        price: 220,
        description: 'Creamy black lentils',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        available: true,
        dietType: 'veg',
        spiceLevel: 'mild',
        calories: 280,
        preparationTime: 20
      },
      {
        id: '4',
        name: 'Butter Naan',
        category: 'breads',
        price: 50,
        description: 'Soft flatbread with butter',
        image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400',
        available: true,
        dietType: 'veg',
        calories: 150,
        preparationTime: 5
      },
      {
        id: '5',
        name: 'Gulab Jamun',
        category: 'desserts',
        price: 80,
        description: 'Sweet milk dumplings in syrup',
        image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400',
        available: true,
        dietType: 'veg',
        calories: 200,
        preparationTime: 5
      },
      {
        id: '6',
        name: 'Biryani',
        category: 'main-course',
        price: 320,
        description: 'Fragrant rice with spices',
        image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
        available: true,
        dietType: 'non-veg',
        spiceLevel: 'hot',
        calories: 450,
        preparationTime: 30
      },
      {
        id: '7',
        name: 'Masala Dosa',
        category: 'main-course',
        price: 180,
        description: 'Crispy rice crepe with potato filling',
        image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400',
        available: true,
        dietType: 'veg',
        spiceLevel: 'medium',
        calories: 320,
        preparationTime: 15
      },
      {
        id: '8',
        name: 'Chicken Tikka',
        category: 'appetizers',
        price: 320,
        description: 'Grilled chicken marinated in spices',
        image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
        available: true,
        dietType: 'non-veg',
        spiceLevel: 'hot',
        calories: 280,
        preparationTime: 20
      }
    ];

    const mockCombos: ComboMeal[] = [
      {
        id: 'combo1',
        name: 'Family Feast',
        description: 'Butter Chicken + Biryani + 4 Naan + Gulab Jamun',
        items: ['2', '6', '4', '5'],
        originalPrice: 1200,
        discountedPrice: 999,
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
        available: true,
        calories: 1400
      },
      {
        id: 'combo2',
        name: 'Veg Delight',
        description: 'Paneer Tikka + Dal Makhani + 3 Naan',
        items: ['1', '3', '4'],
        originalPrice: 700,
        discountedPrice: 599,
        image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
        available: true,
        calories: 780
      }
    ];

    try {
      // Try fetching from API first
      let menuFetched = false;
      let comboFetched = false;

      try {
        const menuResponse = await fetch(
          `${API_BASE_URL}/menu`,
        );

        if (menuResponse.ok) {
          const menuResult = await menuResponse.json();
          // Handle both array response and {success, data} format
          const menuData = Array.isArray(menuResult) ? menuResult : (menuResult.data || []);
          if (menuData.length > 0) {
            // Map _id to id for frontend compatibility
            const availableItems = menuData
              .filter((item: MenuItem) => item.available !== false)
              .map((item: any) => ({
                ...item,
                id: item._id || item.id,
              }));
            setMenuItems(availableItems);
            menuFetched = true;
          }
        }
      } catch (menuError) {
        console.log('Menu API not available, using mock data');
      }

      try {
        const comboResponse = await fetch(
          `${API_BASE_URL}/menu/combos`,
        );

        if (comboResponse.ok) {
          const comboResult = await comboResponse.json();
          // Handle both array response and {success, data} format
          const comboData = Array.isArray(comboResult) ? comboResult : (comboResult.data || []);
          if (comboData.length >= 0) {
            // Map _id to id for frontend compatibility and normalize prices
            const availableCombos = comboData
              .filter((combo: ComboMeal) => combo.available !== false)
              .map((combo: any) => ({
                ...combo,
                id: combo._id || combo.id,
                items: combo.items || [],
                originalPrice: Number(combo.originalPrice) || Number(combo.discountedPrice) || Number(combo.price) || 0,
                discountedPrice: Number(combo.discountedPrice) || Number(combo.price) || Number(combo.originalPrice) || 0,
              }));
            setComboMeals(availableCombos);
            comboFetched = true;
          }
        }
      } catch (comboError) {
        console.log('Combo API not available, using mock data');
      }

      // Use mock data if API fetch failed
      if (!menuFetched) {
        setMenuItems(mockMenuItems);
      }
      if (!comboFetched) {
        setComboMeals(mockCombos);
      }

      // Feature #7: Menu Sync - Show sync badge
      if (menuFetched && comboFetched) {
        toast.success('✓ Menu synced', { duration: 2000 });
      }

    } catch (error) {
      console.error('Error fetching menu data:', error);
      setMenuItems(mockMenuItems);
      setComboMeals(mockCombos);
      toast.info('Using sample menu data');
    } finally {
      setLoading(false);
    }
  };

  // Feature #8: Load Recent Orders
  const loadRecentOrders = () => {
    // Mock recent orders (would be fetched from API in production)
    const mockRecentOrders: RecentOrder[] = [
      {
        id: 'recent1',
        items: [
          { id: 'r1', name: 'Butter Chicken', quantity: 1, price: 350 },
          { id: 'r2', name: 'Butter Naan', quantity: 3, price: 50 }
        ],
        total: 500,
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
      },
      {
        id: 'recent2',
        items: [
          { id: 'r3', name: 'Paneer Tikka', quantity: 2, price: 280 },
          { id: 'r4', name: 'Dal Makhani', quantity: 1, price: 220 }
        ],
        total: 780,
        timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      }
    ];
    
    setRecentOrders(mockRecentOrders);
  };

  // Fetch available tables from API
  const fetchAvailableTables = async () => {
    setTablesLoading(true);
    try {
      const result = await tablesApi.list();
      const tables: TableData[] = result.data || [];
      // Filter out occupied, reserved, and cleaning tables - only show available (case-insensitive)
      const available = tables.filter(t => t.status?.toLowerCase() === 'available');
      // Sort by location and name
      available.sort((a, b) => {
        if (a.location !== b.location) return a.location.localeCompare(b.location);
        return a.name.localeCompare(b.name);
      });
      setAvailableTables(available);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
      setAvailableTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  // ========== ORDER ITEM MANAGEMENT ==========

  // Feature #12: Double Tap to Add
  const handleDoubleTap = (item: MenuItem) => {
    const now = Date.now();
    if (now - lastTap < 300) {
      addItemToOrder(item);
    }
    setLastTap(now);
  };

  // Feature #12: Long Press to Customize
  const handleLongPressStart = (item: MenuItem) => {
    const timer = setTimeout(() => {
      // Open customization dialog
      toast.info(`Customize ${item.name}`, { duration: 2000 });
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Add item to order
  const addItemToOrder = (item: MenuItem) => {
    const station = getCookingStation(item.category);
    const existingItem = orderItems.find(
      (oi) => oi.name === item.name && !oi.isCombo
    );

    // Ensure price is a valid number
    const itemPrice = Number(item.price) || 0;
    const itemName = item.name || 'Unknown Item';

    if (existingItem) {
      setOrderItems(
        orderItems.map((oi) =>
          oi.id === existingItem.id
            ? { ...oi, quantity: oi.quantity + 1 }
            : oi
        )
      );
    } else {
      const newItem: QuickOrderItem = {
        id: `${Date.now()}-${Math.random()}`,
        name: itemName,
        quantity: 1,
        price: itemPrice,
        isCombo: false,
        category: item.category,
        cookingStation: station,
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Feature #10: Smart Notification
    toast.success(`${itemName} added!`, { duration: 1500 });
    
    // Feature #13: Sound Feedback
    playSound('add', soundEnabled);
  };

  // Feature #6: Add combo to order with split select capability
  const addComboToOrder = (combo: ComboMeal) => {
    const comboItemsDetails = (combo.items || []).map(itemId => 
      menuItems.find(mi => mi.id === itemId)
    ).filter(Boolean) as MenuItem[];

    // Ensure price is a valid number - use discountedPrice, fall back to originalPrice or price
    const comboPrice = Number(combo.discountedPrice) || Number(combo.originalPrice) || Number((combo as any).price) || 0;
    const comboName = combo.name || 'Unknown Combo';

    const newCombo: QuickOrderItem = {
      id: `combo-${Date.now()}-${Math.random()}`,
      name: comboName,
      quantity: 1,
      price: comboPrice,
      isCombo: true,
      comboItems: comboItemsDetails,
    };

    setOrderItems([...orderItems, newCombo]);
    
    // Feature #10: Smart Notification
    toast.success(`${comboName} combo added!`, { duration: 1500 });
    
    // Feature #13: Sound Feedback
    playSound('add', soundEnabled);
  };

  // Feature #6: Toggle combo expansion
  const toggleComboExpansion = (comboId: string) => {
    setExpandedCombo(expandedCombo === comboId ? null : comboId);
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) => {
          if (item.id === itemId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
    
    // Feature #13: Sound Feedback
    playSound(delta > 0 ? 'add' : 'remove', soundEnabled);
  };

  // Remove item from order
  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
    
    // Feature #10: Smart Notification
    toast.info('Item removed', { duration: 1500 });
    
    // Feature #13: Sound Feedback
    playSound('remove', soundEnabled);
  };

  // Feature #8: Repeat recent order
  const repeatOrder = (order: RecentOrder) => {
    const validatedItems = order.items.map(item => ({
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      name: item.name || 'Unknown Item',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1
    }));
    
    setOrderItems([...orderItems, ...validatedItems]);
    
    // Feature #10: Smart Notification
    toast.success('Order repeated!', { duration: 2000 });
    
    // Feature #13: Sound Feedback
    playSound('add', soundEnabled);
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Helper: Get cooking station based on category
  const getCookingStation = (category: string): QuickOrderItem['cookingStation'] => {
    const stationMap: Record<string, QuickOrderItem['cookingStation']> = {
      'appetizers': 'fryer',
      'main-course': 'grill',
      'breads': 'tandoor',
      'desserts': 'salad',
      'beverages': 'salad',
    };
    return stationMap[category] || 'grill';
  };

  // ========== ORDER STATUS MANAGEMENT ==========

  // Feature #5: Drag gesture handlers
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragOffset(clientX - dragStartX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    // Swipe right for next status
    if (dragOffset > 100) {
      moveToNextStatus();
    }
    // Swipe left for cancel
    else if (dragOffset < -100) {
      handleCancelOrder();
    }
    
    setDragOffset(0);
    setIsDragging(false);
  };

  // Feature #4: Move to next status with rollback protection
  const moveToNextStatus = () => {
    const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
    if (currentIndex < ORDER_STATUSES.length - 1) {
      const nextStatus = ORDER_STATUSES[currentIndex + 1];
      
      // Feature #4: Rollback Protection - show confirmation before PREPARING
      if (nextStatus === 'preparing' && currentStatus === 'accepted') {
        setRollbackDialog(true);
      } else {
        updateOrderStatus(nextStatus);
      }
    }
  };

  const updateOrderStatus = (newStatus: OrderTimeline['status']) => {
    setCurrentStatus(newStatus);
    setOrderTimeline(prev => [
      ...prev,
      { status: newStatus, timestamp: new Date() }
    ]);
    
    // Feature #10: Smart Notification
    toast.success(`Order moved to ${newStatus}`, { duration: 2000 });
    
    // Feature #13: Sound Feedback
    playSound('complete', soundEnabled);
  };

  // ========== ORDER CREATION ==========

  // Safely parse numeric values
  const safeNumber = (val: any, fallback: number = 0): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
  };

  // Calculate totals with safe number handling
  const subtotal = orderItems.reduce(
    (sum, item) => sum + (safeNumber(item.price) * safeNumber(item.quantity, 1)),
    0
  );
  const totalItems = orderItems.reduce((sum, item) => sum + safeNumber(item.quantity, 1), 0);

  // Feature #9: Order Flow Restriction - Validation
  const isOrderValid =
    orderItems.length > 0 &&
    (orderType === 'takeaway' || (orderType === 'dine-in' && tableNumber));

  // Reset form
  const resetForm = () => {
    setOrderType('dine-in');
    setTableNumber('');
    setCustomerName('');
    setOrderItems([]);
    setNotes('');
    setTags([]);
    setSearchQuery('');
    setShowSpecialInstructions(false);
    setActiveTab('combos');
    setCurrentStatus('placed');
    setOrderTimeline([{ status: 'placed', timestamp: new Date(), duration: 0 }]);
    setExpandedCombo(null);
  };

  // Cancel order
  const handleCancelOrder = () => {
    resetForm();
    onOpenChange(false);
    toast.info('Order cancelled', { duration: 2000 });
  };

  // Create order
  const handleCreateOrder = async () => {
    // Role check: Only waiters and admins can create orders
    const currentRole = restaurantState.getRole();
    if (currentRole !== 'waiter' && currentRole !== 'admin') {
      toast.error('Only waiters and admins can create and send orders to kitchen', {
        description: 'Please switch to waiter or admin mode to create orders',
        duration: 4000,
      });
      playSound('error', soundEnabled);
      return;
    }

    if (!isOrderValid) {
      toast.error('Please add items and select table (for dine-in)');
      playSound('error', soundEnabled);
      return;
    }

    try {
      const orderData = {
        type: orderType,
        tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
        customerName: customerName || undefined,
        items: orderItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          menuItemId: item.id, // Include menu item ID for inventory deduction
        })),
        total: subtotal,
        status: 'placed',
        tags: tags.length > 0 ? tags : undefined,
        notes: notes || undefined,
      };

      const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        }
      );

      const result = await response.json();
      // Check if order was created (API returns the order object with _id)
      if (result && (result._id || result.id || result.success)) {
        // Mark table as occupied (walk-in) for dine-in orders
        if (orderType === 'dine-in' && tableNumber) {
          const selectedTable = availableTables.find(t => 
            (t.displayNumber || t.name) === tableNumber
          );
          if (selectedTable) {
            try {
              await tablesApi.updateStatus(selectedTable._id, 'occupied', 2);
            } catch (tableError) {
              console.warn('Failed to update table status:', tableError);
            }
          }
        }
        
        // Feature #10: Smart Notification
        toast.success('🎉 Order created successfully!', { duration: 3000 });
        
        // Feature #13: Sound Feedback
        playSound('complete', soundEnabled);
        
        onOrderCreated();
        resetForm();
        onOpenChange(false);
      } else {
        throw new Error(result.detail || 'Failed to create order');
      }
    } catch (error: any) {
      let errorMsg = 'Failed to create order';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else if (error && error.detail) {
        errorMsg = error.detail;
      }
      console.error('Error creating order:', error);
      toast.error(`Order creation failed: ${errorMsg}`);
      playSound('error', soundEnabled);
    }
  };

  // ========== FILTERING ==========

  // Filter menu items with Feature #11: Inline Item Search
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [
    'all',
    ...Array.from(new Set(menuItems.map((item) => item.category))),
  ];

  // ========== RENDER ==========

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[95vw] lg:max-w-[1400px] p-0 overflow-hidden"
        >
          {/* Header - Matching Orders Page Theme */}
          <div className="sticky top-0 z-20 bg-[#8B5E34] text-white px-8 py-6 shadow-lg">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl text-white font-bold">
                      Quick Order (POS Mode)
                    </SheetTitle>
                    <SheetDescription className="text-white/80 text-base">
                      Fast, flexible order creation
                    </SheetDescription>
                  </div>
                </div>
                
                {/* Feature #7: Menu Sync Badge + Role Warning */}
                <div className="flex items-center gap-3">
                  {currentRole === 'waiter' && (
                    <Badge className="bg-green-500/20 text-white border-white/30">
                      <Check className="h-3 w-3 mr-1" />
                      Waiter Mode Active
                    </Badge>
                  )}
                  {currentRole === 'admin' && (
                    <Badge className="bg-yellow-500/20 text-white border-white/30">
                      <Check className="h-3 w-3 mr-1" />
                      Admin Mode Active
                    </Badge>
                  )}
                  <Badge className="bg-blue-500/20 text-white border-white/30">
                    <Check className="h-3 w-3 mr-1" />
                    Menu Synced
                  </Badge>
                  
                  {/* Feature #13: Sound Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="text-white hover:bg-white/20"
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-5 w-5" />
                    ) : (
                      <VolumeX className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* 2-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8 h-[calc(100vh-180px)] overflow-y-auto bg-[#F7F3EE]">
            {/* LEFT PANEL: Order Creation */}
            <div className="lg:col-span-7 space-y-6">
              {/* Order Information Card */}
              <Card className="shadow-md border-2 border-[#8B5E34]/10">
                <CardHeader className="bg-gradient-to-r from-[#F6F2ED] to-white pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#8B5E34]">
                    <UtensilsCrossed className="h-5 w-5" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Order Type */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Order Type *
                    </Label>
                    <Select
                      value={orderType}
                      onValueChange={(value: 'dine-in' | 'takeaway') =>
                        setOrderType(value)
                      }
                    >
                      <SelectTrigger className="h-12 text-base font-medium border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dine-in">🍽️ Dine-In</SelectItem>
                        <SelectItem value="takeaway">📦 Takeaway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table Number (conditional) */}
                  {orderType === 'dine-in' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Select Table *
                      </Label>
                      <Select
                        value={tableNumber}
                        onValueChange={(value) => setTableNumber(value)}
                      >
                        <SelectTrigger className="h-12 text-base font-medium border-2">
                          <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select a table"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTables.length === 0 ? (
                            <SelectItem value="no-tables" disabled>
                              {tablesLoading ? "Loading..." : "No tables available"}
                            </SelectItem>
                          ) : (
                            <>
                              {/* Group tables by location */}
                              {['VIP', 'Main Hall', 'AC Hall'].map(location => {
                                const locationTables = availableTables.filter(t => t.location === location);
                                if (locationTables.length === 0) return null;
                                return (
                                  <div key={location}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                      {location}
                                    </div>
                                    {locationTables.map(table => (
                                      <SelectItem key={table._id} value={table.displayNumber || table.name}>
                                        <span className="flex items-center gap-2">
                                          <span className="font-bold">{table.displayNumber || table.name}</span>
                                          <span className="text-muted-foreground text-xs">
                                            ({table.capacity} seats)
                                          </span>
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      {availableTables.length === 0 && !tablesLoading && (
                        <p className="text-xs text-amber-600">
                          All tables are currently occupied. Please wait or use takeaway.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Customer Name */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Customer Name
                    </Label>
                    <Input
                      placeholder="Optional"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-12 border-2"
                    />
                  </div>

                  {/* Progressive Disclosure: Special Instructions */}
                  {!showSpecialInstructions ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowSpecialInstructions(true)}
                      className="w-full h-11 gap-2 border-dashed border-2"
                    >
                      <TagIcon className="h-4 w-4" />
                      Add special instructions
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    </Button>
                  ) : (
                    <div className="space-y-4 pt-2 border-t-2 border-dashed">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Special Instructions
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSpecialInstructions(false);
                            setNotes('');
                            setTags([]);
                          }}
                          className="h-7 text-xs"
                        >
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Hide
                        </Button>
                      </div>

                      {/* Tags */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_TAGS.map((tag) => (
                            <Button
                              key={tag}
                              size="sm"
                              variant={tags.includes(tag) ? 'default' : 'outline'}
                              onClick={() => toggleTag(tag)}
                              className="h-8 text-xs"
                            >
                              {tag}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Notes</Label>
                        <Textarea
                          placeholder="e.g., No onion, Extra spicy..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="resize-none border-2"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Item Selection Card */}
              <Card className="shadow-md border-2 border-[#8B5E34]/10 flex-1 flex flex-col">
                <CardHeader className="bg-gradient-to-r from-[#F6F2ED] to-white pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#8B5E34]">
                    <ShoppingBag className="h-5 w-5" />
                    Select Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col overflow-hidden">
                  {/* Tabs: Combos | Individual Items | Recent Orders */}
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as 'combos' | 'items' | 'recent')
                    }
                    className="flex-1 flex flex-col"
                  >
                    <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
                      <TabsTrigger value="combos" className="text-sm font-semibold">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Combos
                      </TabsTrigger>
                      <TabsTrigger value="items" className="text-sm font-semibold">
                        <Package2 className="h-4 w-4 mr-2" />
                        Items
                      </TabsTrigger>
                      <TabsTrigger value="recent" className="text-sm font-semibold">
                        <Repeat className="h-4 w-4 mr-2" />
                        Recent
                      </TabsTrigger>
                    </TabsList>

                    {/* Combos Tab */}
                    <TabsContent value="combos" className="flex-1 overflow-hidden mt-0 space-y-2">
                      {/* Task 2: Show Total Combo Count */}
                      {!loading && comboMeals.length > 0 && (
                        <div className="flex items-center text-sm px-1">
                          <span className="text-muted-foreground">
                            <Sparkles className="inline h-4 w-4 mr-1" />
                            <strong className="text-[#8B5E34]">{comboMeals.length}</strong> combo meals available
                          </span>
                        </div>
                      )}
                      
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-[#8B5E34] border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-muted-foreground">Loading combos...</p>
                          </div>
                        </div>
                      ) : comboMeals.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center max-w-sm">
                            <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Combos Available</h3>
                            <p className="text-sm text-muted-foreground">
                              Create combo meals in Menu Management
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ScrollArea className="h-[450px] pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {comboMeals.map((combo) => {
                              const savings = combo.originalPrice - combo.discountedPrice;
                              const discountPercent = Math.round(
                                (savings / combo.originalPrice) * 100
                              );
                              const isExpanded = expandedCombo === combo.id;

                              return (
                                <Card
                                  key={combo.id}
                                  className="cursor-pointer hover:shadow-lg transition-shadow duration-150 border-2 hover:border-[#8B5E34]/50 group active:scale-[0.98]"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex gap-4">
                                      {/* Combo Image */}
                                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 relative">
                                        <img
                                          src={combo.image}
                                          alt={combo.name}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                          style={{ aspectRatio: '1', objectFit: 'cover' }}
                                        />
                                        {combo.calories && (
                                          <div className="absolute bottom-1 right-1 bg-black/70 text-[#FF7F50] text-xs px-2 py-0.5 rounded">
                                            {combo.calories} cal
                                          </div>
                                        )}
                                      </div>

                                      {/* Combo Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                          <h4 className="font-semibold text-base line-clamp-1">
                                            {combo.name}
                                          </h4>
                                          {discountPercent > 0 && (
                                            <Badge className="bg-green-100 text-green-700 text-xs flex-shrink-0">
                                              {discountPercent}% OFF
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                          {combo.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          {combo.originalPrice > combo.discountedPrice && (
                                            <span className="text-xs text-muted-foreground line-through flex items-center">
                                              <IndianRupee className="h-3 w-3" />
                                              {combo.originalPrice}
                                            </span>
                                          )}
                                          <span className="text-lg font-bold text-[#8B5E34] flex items-center">
                                            <IndianRupee className="h-4 w-4" />
                                            {combo.discountedPrice}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Feature #6: Split Select - Expand combo items */}
                                    <div className="mt-3 space-y-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleComboExpansion(combo.id)}
                                        className="w-full text-xs"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="h-3 w-3 mr-1" />
                                            Hide Items
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                            View Items ({(combo.items || []).length})
                                          </>
                                        )}
                                      </Button>

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="border rounded p-2 space-y-1 text-xs bg-gray-50">
                                              {(combo.items || []).map(itemId => {
                                                const item = menuItems.find(mi => mi.id === itemId);
                                                return item ? (
                                                  <div key={itemId} className="flex justify-between">
                                                    <span>• {item.name}</span>
                                                    <span className="text-muted-foreground flex items-center">
                                                      <IndianRupee className="h-3 w-3" />
                                                      {item.price}
                                                    </span>
                                                  </div>
                                                ) : null;
                                              })}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      <Button
                                        size="sm"
                                        onClick={() => addComboToOrder(combo)}
                                        className="w-full h-9 gap-2 bg-[#8B5E34] hover:bg-[#8B5E34]/90"
                                      >
                                        <Plus className="h-4 w-4" />
                                        Add Combo
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    {/* Individual Items Tab */}
                    <TabsContent value="items" className="flex-1 overflow-hidden mt-0 space-y-4">
                      {/* Feature #11: Inline Item Search */}
                      <div className="space-y-2">
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search dishes..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 h-11 border-2"
                            />
                          </div>
                          <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger className="w-[180px] h-11 border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category === 'all'
                                    ? 'All Categories'
                                    : category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Task 2: Show Total Menu Item Count */}
                        {!loading && (
                          <div className="flex items-center justify-between text-sm px-1">
                            <span className="text-muted-foreground">
                              {filteredMenuItems.length === menuItems.length ? (
                                <>
                                  <Package className="inline h-4 w-4 mr-1" />
                                  <strong className="text-[#8B5E34]">{menuItems.length}</strong> items available
                                </>
                              ) : (
                                <>
                                  Showing <strong className="text-[#8B5E34]">{filteredMenuItems.length}</strong> of{' '}
                                  <strong className="text-[#8B5E34]">{menuItems.length}</strong> items
                                </>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-[#8B5E34] border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-sm text-muted-foreground">Loading items...</p>
                          </div>
                        </div>
                      ) : filteredMenuItems.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center max-w-sm">
                            <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your search or filters
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ScrollArea className="h-[450px] pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {filteredMenuItems.map((item) => (
                              <Card
                                key={item.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow duration-150 border-2 hover:border-[#8B5E34]/50 group active:scale-[0.98]"
                                onClick={() => addItemToOrder(item)}
                                onDoubleClick={() => handleDoubleTap(item)}
                                onTouchStart={() => handleLongPressStart(item)}
                                onTouchEnd={handleLongPressEnd}
                                onMouseDown={() => handleLongPressStart(item)}
                                onMouseUp={handleLongPressEnd}
                                onMouseLeave={handleLongPressEnd}
                              >
                                <CardContent className="p-4">
                                  <div className="flex gap-4">
                                    {/* Item Image */}
                                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100 relative">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        style={{ aspectRatio: '1', objectFit: 'cover' }}
                                      />
                                      {item.calories && (
                                        <div className="absolute bottom-1 right-1 bg-black/70 text-[#FF7F50] text-xs px-1.5 py-0.5 rounded">
                                          {item.calories} cal
                                        </div>
                                      )}
                                    </div>

                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-semibold text-sm line-clamp-1">
                                          {item.name}
                                        </h4>
                                        {item.dietType && (
                                          <Badge
                                            variant="outline"
                                            className={`text-xs flex-shrink-0 ${
                                              item.dietType === 'veg'
                                                ? 'border-green-500 text-green-700'
                                                : 'border-red-500 text-red-700'
                                            }`}
                                          >
                                            {item.dietType === 'veg' ? '🌱' : '🍖'}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {item.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <span className="text-base font-bold text-[#8B5E34] flex items-center">
                                          <IndianRupee className="h-4 w-4" />
                                          {item.price}
                                        </span>
                                        {item.preparationTime && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {item.preparationTime}m
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>

                    {/* Feature #8: Recent Orders Tab */}
                    <TabsContent value="recent" className="flex-1 overflow-hidden mt-0">
                      {recentOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center max-w-sm">
                            <Repeat className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold mb-2">No Recent Orders</h3>
                            <p className="text-sm text-muted-foreground">
                              Your recent orders will appear here
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-4 pb-4">
                            {recentOrders.map((order) => (
                              <Card
                                key={order.id}
                                className="border-2 hover:border-[#8B5E34]/50 transition-colors"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1">
                                        {order.items.length} items
                                      </h4>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(order.timestamp).toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <span className="text-base font-bold text-[#8B5E34] flex items-center">
                                      <IndianRupee className="h-4 w-4" />
                                      {order.total}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1 mb-3">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                                        <span>• {item.name} x{item.quantity}</span>
                                        <span className="flex items-center">
                                          <IndianRupee className="h-3 w-3" />
                                          {item.price * item.quantity}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  <Button
                                    size="sm"
                                    onClick={() => repeatOrder(order)}
                                    className="w-full h-9 gap-2 bg-[#8B5E34] hover:bg-[#8B5E34]/90"
                                  >
                                    <Repeat className="h-4 w-4" />
                                    Repeat Order
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT PANEL: Live Order Preview + Timeline */}
            <div className="lg:col-span-5 space-y-6">
              {/* Feature #1: Live Order Timeline */}
              <Card className="shadow-md border-2 border-[#8B5E34]/10">
                <CardHeader className="bg-gradient-to-r from-[#F6F2ED] to-white pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-[#8B5E34]">
                    <Timer className="h-5 w-5" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="flex justify-between mb-2">
                        {ORDER_STATUSES.map((status) => {
                          const statusIndex = ORDER_STATUSES.indexOf(status);
                          const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
                          const isActive = statusIndex <= currentIndex;
                          
                          return (
                            <div key={status} className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                  isActive
                                    ? STATUS_COLORS[status] + ' text-white scale-110'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {isActive && <CheckCircle className="h-5 w-5" />}
                              </div>
                              <span className="text-xs mt-1 capitalize">{status}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <Progress
                        value={(ORDER_STATUSES.indexOf(currentStatus) / (ORDER_STATUSES.length - 1)) * 100}
                        className="h-2"
                      />
                    </div>

                    {/* Feature #2: Bottleneck Detection */}
                    {isBottleneck && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-3"
                      >
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-900">
                            Bottleneck Detected
                          </p>
                          <p className="text-xs text-red-700">
                            Order has been in preparing for {preparingDuration} minutes
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Timeline Details */}
                    <div className="space-y-2">
                      {orderTimeline.map((tl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                        >
                          <span className="capitalize font-medium">{tl.status}</span>
                          <span className="text-muted-foreground text-xs">
                            {tl.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Preview Card */}
              <Card className="shadow-md border-2 border-[#8B5E34]/10 flex-1 flex flex-col">
                <CardHeader className="bg-gradient-to-r from-[#F6F2ED] to-white pb-4">
                  <CardTitle className="text-lg flex items-center justify-between text-[#8B5E34]">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Items ({totalItems})
                    </div>
                    <span className="text-base flex items-center font-bold">
                      <IndianRupee className="h-5 w-5" />
                      {subtotal}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  {orderItems.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center max-w-xs">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Items Added</h3>
                        <p className="text-sm text-muted-foreground">
                          Start adding items to create an order
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                      {/* Feature #3: Smart KOT Grouping */}
                      <div className="space-y-4">
                        {Object.entries(groupedItems).map(([station, items]) => {
                          const stationInfo = COOKING_STATIONS[station as keyof typeof COOKING_STATIONS];
                          const isExpanded = expandedGroups.has(station);
                          const StationIcon = stationInfo?.icon || Package;

                          return (
                            <Collapsible
                              key={station}
                              open={isExpanded}
                              onOpenChange={(open) => {
                                const newExpanded = new Set(expandedGroups);
                                if (open) {
                                  newExpanded.add(station);
                                } else {
                                  newExpanded.delete(station);
                                }
                                setExpandedGroups(newExpanded);
                              }}
                            >
                              <Card className="border-2">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded ${stationInfo?.color || 'text-gray-600 bg-gray-100'}`}>
                                          <StationIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold">
                                            {stationInfo?.label || station.toUpperCase()}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {items.length} items
                                          </p>
                                        </div>
                                      </div>
                                      <ChevronDown
                                        className={`h-5 w-5 transition-transform ${
                                          isExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="pt-0">
                                    <div className="space-y-3">
                                      {items.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{item.name}</p>
                                            {item.isCombo && (
                                              <Badge className="mt-1 text-xs" variant="outline">
                                                Combo
                                              </Badge>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                              <IndianRupee className="h-3 w-3" />
                                              {item.price} x {item.quantity}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 border rounded-lg">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateItemQuantity(item.id, -1)}
                                                className="h-8 w-8 p-0"
                                              >
                                                <Minus className="h-3 w-3" />
                                              </Button>
                                              <span className="text-sm font-semibold w-8 text-center">
                                                {item.quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => updateItemQuantity(item.id, 1)}
                                                className="h-8 w-8 p-0"
                                              >
                                                <Plus className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeItemFromOrder(item.id)}
                                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Feature #5: Drag Gesture Hint */}
                  {orderItems.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <p className="text-xs text-blue-900">
                        💡 Swipe right to advance status, left to cancel
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature #9: Sticky Bottom Action Bar - Order Flow Restriction */}
          <div className="sticky bottom-0 z-20 bg-white border-t-2 border-[#8B5E34]/20 px-8 py-4 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancelOrder}
                className="h-12 px-6 border-2"
              >
                <Ban className="h-5 w-5 mr-2" />
                Cancel
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-[#8B5E34] flex items-center justify-center">
                  <IndianRupee className="h-6 w-6" />
                  {subtotal}
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleCreateOrder}
                disabled={!isOrderValid}
                className={`h-12 px-8 text-base font-semibold ${
                  isOrderValid
                    ? 'bg-[#8B5E34] hover:bg-[#8B5E34]/90'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Create Order
                {!isOrderValid && (
                  <span className="ml-2 text-xs">
                    ({orderItems.length === 0 ? 'Add items' : 'Select table'})
                  </span>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Feature #4: Rollback Protection Dialog */}
      <Dialog open={rollbackDialog} onOpenChange={setRollbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Moving order to PREPARING. This action will send the order to the kitchen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">Would you like to:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRollbackDialog(false);
                  // Open edit mode
                  toast.info('Edit order', { duration: 2000 });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRollbackDialog(false);
                  handleCancelOrder();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRollbackDialog(false)}
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                updateOrderStatus('preparing');
                setRollbackDialog(false);
              }}
              className="bg-[#8B5E34] hover:bg-[#8B5E34]/90"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue to Preparing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
