import { useEffect, useState } from "react";
import { Button } from '@admin/app/components/ui/button';
import {
  Card,
  CardContent,
} from '@admin/app/components/ui/card';
import { Input } from '@admin/app/components/ui/input';
import { Label } from '@admin/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@admin/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@admin/app/components/ui/select';
import { Badge } from '@admin/app/components/ui/badge';
import { Switch } from '@admin/app/components/ui/switch';
import { Checkbox } from '@admin/app/components/ui/checkbox';
import { cn } from '@admin/app/components/ui/utils";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  Pizza,
  Flame,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner';
import { menuApi } from '@admin/utils/api";

type CuisineType = "South Indian" | "North Indian" | "Chinese" | "Italian" | "Continental";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  cuisine: CuisineType;
  price: number;
  description: string;
  image: string;
  available: boolean;
  prepTime: string;
  dietType: "veg" | "non-veg";
  calories: number;
  spiceLevel: string;
  addons: string[];
  offerLabel?: string;
  offerDiscount?: string;
  badges?: string[];
}

interface ComboMeal {
  id: string;
  name: string;
  description: string;
  cuisine: CuisineType;
  originalPrice: number;
  discountedPrice: number;
  image: string;
  available: boolean;
  calories: number;
  prepTime: string;
}

const SPICE_LEVELS = ["None", "Mild", "Medium", "Hot", "Extra Hot"];
const AVAILABLE_ADDONS = ["Ketchup", "Mayonnaise", "Green Sauce", "Pepper Dip", "Raita", "Sweet Chili"];

const normalizeMenuItems = (items: any[]): MenuItem[] =>
  items.map((item) => ({
    id: item._id ?? item.id ?? `menu-${Math.random().toString(36).slice(2)}`,
    name: item.name ?? "Unnamed Item",
    category: item.category ?? "Main Course",
    cuisine: item.cuisine ?? "North Indian",
    price: Number(item.price ?? 0),
    description: item.description ?? "",
    image: item.image ?? "",
    available: item.available ?? true,
    prepTime: item.prepTime ?? "",
    dietType: item.dietType ?? "veg",
    calories: Number(item.calories ?? 0),
    spiceLevel: item.spiceLevel ?? "Mild",
    addons: Array.isArray(item.addons) ? item.addons : [],
    offerLabel: item.offerLabel,
    offerDiscount: item.offerDiscount,
    badges: Array.isArray(item.badges) ? item.badges : [],
  }));

const normalizeComboMeals = (items: any[]): ComboMeal[] =>
  items.map((combo) => ({
    id: combo._id ?? combo.id ?? `combo-${Math.random().toString(36).slice(2)}`,
    name: combo.name ?? "Unnamed Combo",
    description: combo.description ?? "",
    cuisine: combo.cuisine ?? "North Indian",
    originalPrice: Number(combo.originalPrice) || Number(combo.discountedPrice) || Number(combo.price) || 0,
    discountedPrice: Number(combo.discountedPrice) || Number(combo.price) || Number(combo.originalPrice) || 0,
    image: combo.image ?? "",
    available: combo.available ?? true,
    calories: Number(combo.calories ?? 0),
    prepTime: combo.prepTime ?? "",
  }));

export function MenuManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("items");
  const [activeCuisine, setActiveCuisine] = useState<"all" | "South Indian" | "North Indian" | "Chinese" | "Italian" | "Continental">("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeDiet, setActiveDiet] = useState<"all" | "veg" | "non-veg">("all");
  const [filterByOffer, setFilterByOffer] = useState(false);
  const [filterByChefSpecial, setFilterByChefSpecial] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comboDialogOpen, setComboDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCombo, setEditingCombo] = useState<ComboMeal | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // DATA: Menu Items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [comboMeals, setComboMeals] = useState<ComboMeal[]>([]);

useEffect(() => {
  const loadMenuData = async () => {
    try {
      const [menuRes, comboRes] = await Promise.all([
        menuApi.list(),
        menuApi.listCombos()
      ]);

      const menuData = Array.isArray(menuRes) ? menuRes : (menuRes as any)?.data || [];
      const comboData = Array.isArray(comboRes) ? comboRes : [];

      setMenuItems(normalizeMenuItems(menuData));
      setComboMeals(normalizeComboMeals(comboData));

    } catch (error) {
      console.error("Failed to load menu data:", error);
      toast.error("Failed to load menu data from server");
    }
  };

  loadMenuData();
}, []);


  const categories = [
    { id: "all", name: "ALL" },
    { id: "Starters", name: "STARTERS" },
    { id: "Main Course", name: "MAIN COURSE" },
    { id: "Breads", name: "BREADS" },
    { id: "Desserts", name: "DESSERTS" },
    { id: "Beverages", name: "BEVERAGES" }
  ];

  const cuisines = [
    { id: "all", name: "ALL CUISINE" },
    { id: "South Indian", name: "South Indian" },
    { id: "North Indian", name: "North Indian" },
    { id: "Italian", name: "Italian" },
    { id: "Chinese", name: "Chinese" },
    { id: "Continental", name: "Continental" }
  ];

  const handleUpdateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const dietType = (fd.get("diet") as "veg" | "non-veg") ?? "veg";
    const baseBadges = editingItem?.badges ?? (dietType === "veg" ? ["VEG"] : ["NON-VEG"]);
    const payload = {
      name: fd.get("name") as string,
      cuisine: fd.get("cuisine") as CuisineType,
      category: fd.get("category") as string,
      price: parseFloat(fd.get("price") as string),
      calories: parseInt(fd.get("calories") as string),
      prepTime: fd.get("prepTime") as string,
      dietType: dietType,
      description: fd.get("description") as string,
      spiceLevel: fd.get("spiceLevel") as string,
      offerDiscount: (fd.get("offerDiscount") as string) || undefined,
      offerLabel: (fd.get("offerLabel") as string) || undefined,
      addons: selectedAddons,
      image: editingItem?.image ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      available: editingItem?.available ?? true,
      badges: baseBadges,
    };

    try {
      if (editingItem) {
        await menuApi.update(editingItem.id, payload);

        const updated: MenuItem = { ...editingItem, ...payload };
        setMenuItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success("Item Updated Successfully!");
      } else {
        const result = await menuApi.create(payload);

        const createdId = result?._id ?? result?.id ?? Date.now().toString();
        const newItem: MenuItem = { id: createdId, ...payload };
        setMenuItems((prev) => [...prev, newItem]);
        toast.success("New Item Added Successfully!");
      }

      setDialogOpen(false);
      setEditingItem(null);
      setSelectedAddons([]);
    } catch (error) {
      console.error("Failed to save menu item:", error);
      toast.error("Failed to save menu item");
    }
  };

  const handleUpdateCombo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Parse prices with validation
    const discountedPrice = parseFloat(fd.get("price") as string) || 0;
    const originalPrice = parseFloat(fd.get("originalPrice") as string) || 0;

    if (discountedPrice <= 0 || originalPrice <= 0) {
      toast.error("Please enter valid prices (must be greater than 0)");
      return;
    }

    const payload = {
      name: fd.get("name") as string,
      cuisine: fd.get("cuisine") as CuisineType,
      discountedPrice: discountedPrice,
      calories: parseInt(fd.get("calories") as string) || 0,
      prepTime: fd.get("prepTime") as string,
      description: fd.get("desc") as string,
      originalPrice: originalPrice,
      image: editingCombo?.image ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
      available: editingCombo?.available ?? true,
    };

    try {
      if (editingCombo) {
        await menuApi.updateCombo(editingCombo.id, payload);

        const updated: ComboMeal = { ...editingCombo, ...payload };
        setComboMeals((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success("Combo Updated Successfully!");
      } else {
        const result = await menuApi.createCombo(payload);

        const createdId = result?._id ?? result?.id ?? Date.now().toString();
        const newCombo: ComboMeal = { id: createdId, ...payload };
        setComboMeals((prev) => [...prev, newCombo]);
        toast.success("New Combo Added Successfully!");
      }

      setComboDialogOpen(false);
      setEditingCombo(null);
    } catch (error) {
      console.error("Failed to save combo:", error);
      toast.error("Failed to save combo");
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem, available: boolean) => {
    try {
      await menuApi.update(item.id, { available });
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, available } : i)));
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update item availability");
    }
  };

  const handleToggleComboAvailability = async (combo: ComboMeal, available: boolean) => {
    try {
      await menuApi.updateCombo(combo.id, { available });
      setComboMeals((prev) => prev.map((c) => (c.id === combo.id ? { ...c, available } : c)));
    } catch (error) {
      console.error("Failed to update availability:", error);
      toast.error("Failed to update combo availability");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await menuApi.delete(itemId);
      setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item Deleted Successfully!");
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleDeleteCombo = async (comboId: string) => {
    try {
      await menuApi.deleteCombo(comboId);
      setComboMeals((prev) => prev.filter((c) => c.id !== comboId));
      toast.success("Combo Deleted Successfully!");
    } catch (error) {
      console.error("Failed to delete combo:", error);
      toast.error("Failed to delete combo");
    }
  };

  const filteredItems = menuItems.filter(i => {
    const searchMatch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cuisineMatch = activeCuisine === "all" || i.cuisine === activeCuisine;
    const categoryMatch = activeCategory === "all" || i.category === activeCategory;
    const dietMatch = activeDiet === "all" || i.dietType === activeDiet;
    const offerMatch = !filterByOffer || (i.offerDiscount && i.offerDiscount.trim() !== "");
    const chefSpecialMatch = !filterByChefSpecial || i.badges?.includes('CHEF'S SPECIAL");
    return searchMatch && cuisineMatch && categoryMatch && dietMatch && offerMatch && chefSpecialMatch;
  });

  const filteredCombos = comboMeals.filter(c => {
    const searchMatch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const cuisineMatch = activeCuisine === "all" || c.cuisine === activeCuisine;
    return searchMatch && cuisineMatch;
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex justify-center" style={{ padding: '32px' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shine {
          background: linear-gradient(90deg, transparent, rgba(139,90,43,0.08), transparent);
          background-size: 200% 100%;
          animation: shine 3s infinite;
        }
        .card-float {
          transition: transform 0.3s ease;
        }
        .card-float:hover {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
      
      <div style={{ width: '1200px', minHeight: '720px' }}>
        
        {/* Header Section with Buttons */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[#2D2D2D] tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Restaurant Menu
            </h1>
            <p className="text-base text-[#6B6B6B] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Manage your menu items and combo deals
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => { setEditingItem(null); setSelectedAddons([]); setDialogOpen(true); }}
              className="h-11 px-6 bg-[#8B5A2B] hover:bg-[#6D421E] text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
            <Button 
              onClick={() => { setEditingCombo(null); setComboDialogOpen(true); }}
              className="h-11 px-6 bg-white hover:bg-gray-50 text-[#8B5A2B] border-2 border-[#8B5A2B] rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Combo
            </Button>
          </div>
        </div>

        {/* Main White Container with Shine Effect */}
        <Card className="bg-white rounded-2xl shadow-lg border-none overflow-hidden animate-float mb-8" style={{ backgroundColor: '#F5F3F0' }}>
          <div className="p-8 space-y-6 relative overflow-hidden">
            {/* Shine effect overlay */}
            <div className="absolute inset-0 animate-shine pointer-events-none"></div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search menu items..." 
                className="pl-12 h-14 text-base rounded-xl border-gray-300 bg-white focus:ring-2 focus:ring-[#8B5A2B] focus:border-[#8B5A2B] shadow-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>

            {/* Browse Cuisines Section */}
            <div>
              <div className="flex items-center gap-2 text-[#6B6B6B] mb-4" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                <Pizza className="h-5 w-5 text-[#8B5A2B]" />
                <span className="font-semibold">Browse Cuisines</span>
              </div>
              
              {/* Cuisine Pills */}
              <div className="flex flex-wrap gap-3">
                {cuisines.map((cuisine) => (
                  <button
                    key={cuisine.id}
                    onClick={() => setActiveCuisine(cuisine.id as any)}
                    className={cn(
                      "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                      activeCuisine === cuisine.id
                        ? "bg-[#2A1A05] text-white"
                        : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {cuisine.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Categories Section */}
            <div>
              <div className="flex items-center gap-2 text-[#6B6B6B] mb-4" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                <ChevronRight className="h-5 w-5 text-[#8B5A2B]" />
                <span className="font-semibold">Select Categories</span>
              </div>
              
              {/* Category Pills - First Row */}
              <div className="flex flex-wrap gap-3 mb-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-6 h-10 rounded-full font-medium text-sm transition-all duration-200 shadow-sm",
                      activeCategory === cat.id
                        ? "bg-[#8B5A2B] text-white"
                        : "bg-white text-[#6B6B6B] border border-gray-300 hover:border-[#8B5A2B]"
                    )}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Diet Type Pills - Second Row */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveDiet("all")}
                  className={cn(
                    "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                    activeDiet === "all"
                      ? "bg-[#2A1A05] text-white"
                      : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  ALL
                </button>
                <button
                  onClick={() => setActiveDiet("veg")}
                  className={cn(
                    "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                    activeDiet === "veg"
                      ? "bg-[#2A1A05] text-white"
                      : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  VEG
                </button>
                <button
                  onClick={() => setActiveDiet("non-veg")}
                  className={cn(
                    "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                    activeDiet === "non-veg"
                      ? "bg-[#2A1A05] text-white"
                      : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  NON-VEG
                </button>
                <button
                  onClick={() => setFilterByOffer(!filterByOffer)}
                  className={cn(
                    "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                    filterByOffer
                      ? "bg-[#2A1A05] text-white"
                      : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  OFFERS
                </button>
                <button
                  onClick={() => setFilterByChefSpecial(!filterByChefSpecial)}
                  className={cn(
                    "px-5 h-10 rounded-full text-sm font-medium transition-all duration-200 shadow-sm",
                    filterByChefSpecial
                      ? "bg-[#2A1A05] text-white"
                      : "bg-white text-[#6B6B6B] border border-gray-300 hover:bg-gray-50"
                  )}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  CHEF'S SPECIAL
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Tab Switcher */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab("items")}
            className={cn(
              "px-8 h-12 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm",
              activeTab === "items"
                ? "bg-[#8B5A2B] text-white"
                : "bg-white text-[#6B6B6B] hover:bg-gray-50"
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Menu Items ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab("combos")}
            className={cn(
              "px-8 h-12 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm",
              activeTab === "combos"
                ? "bg-[#8B5A2B] text-white"
                : "bg-white text-[#6B6B6B] hover:bg-gray-50"
            )}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Combo Meals ({filteredCombos.length})
          </button>
        </div>

        {/* Menu Items Grid with Float Effect */}
        {activeTab === "items" && (
          <div className="flex flex-wrap" style={{ gap: '32px 24px' }}>
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 card-float"
                style={{ 
                  width: '260px', 
                  height: '424px', 
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {/* Image Section */}
                <div className="relative overflow-hidden" style={{ width: '260px', height: '176px' }}>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* VEG/NON-VEG Badge - Top Left */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      className={cn(
                        "text-white text-xs px-3 py-1 font-bold",
                        item.dietType === "veg" ? "bg-green-600" : "bg-red-600"
                      )}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {item.dietType === "veg" ? "VEG" : "NON-VEG"}
                    </Badge>
                  </div>

                  {/* BESTSELLER Badge - Top Right */}
                  {item.badges?.includes("BESTSELLER") && (
                    <Badge className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-3 py-1 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      BESTSELLER
                    </Badge>
                  )}

                  {/* CHEF'S SPECIAL Badge */}
                  {item.badges?.includes("CHEF'S SPECIAL") && (
                    <Badge className="absolute top-10 right-2 bg-purple-600 text-white text-xs px-3 py-1 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      CHEF'S SPECIAL
                    </Badge>
                  )}

                  {/* Offer Discount - Bottom Right */}
                  {item.offerDiscount && (
                    <Badge className="absolute bottom-2 right-2 bg-red-600 text-white text-xs px-3 py-1 font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.offerDiscount}
                    </Badge>
                  )}
                </div>

                {/* Dark Brown Container - Bottom Section */}
                <div className="p-4 space-y-2" style={{ height: '248px', backgroundColor: '#2A1A05' }}>
                  {/* Title - WHITE COLOR */}
                  <h3 className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-sm line-clamp-2 leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.description}
                  </p>

                  {/* Info Row - Calories and Time */}
                  <div className="flex items-center justify-between text-white text-xs pt-1">
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }}>{item.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }}>{item.prepTime}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/20 my-2" />

                  {/* Price and Cuisine Section */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-gray-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>PRICE</p>
                      <p className="text-white font-bold text-xl leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{item.price}</p>
                    </div>
                    
                    {/* Cuisine Badge */}
                    <Badge 
                      className="bg-[#8B5A2B] text-white text-xs px-3 py-1.5"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {item.cuisine}
                    </Badge>
                  </div>

                  {/* Admin Actions Row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Available</span>
                      <Switch 
                        checked={item.available}
                        onCheckedChange={(checked) => {
                          void handleToggleItemAvailability(item, checked);
                        }}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/10"
                        onClick={() => { 
                          setEditingItem(item); 
                          setSelectedAddons(item.addons); 
                          setDialogOpen(true); 
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/10 hover:text-red-400"
                        onClick={() => {
                          void handleDeleteItem(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Combo Meals Grid with Float Effect */}
        {activeTab === "combos" && (
          <div className="flex flex-wrap" style={{ gap: '32px 24px' }}>
            {filteredCombos.map((combo) => (
              <div 
                key={combo.id} 
                className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 card-float"
                style={{ 
                  width: '260px', 
                  height: '424px', 
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {/* Image Section */}
                <div className="relative overflow-hidden" style={{ width: '260px', height: '176px' }}>
                  <img 
                    src={combo.image} 
                    alt={combo.name} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* COMBO DEAL Badge - Top Left */}
                  <div className="absolute top-2 left-2">
                    <Badge 
                      className="bg-purple-600 text-white text-xs px-3 py-1 font-bold"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      COMBO DEAL
                    </Badge>
                  </div>
                </div>

                {/* Dark Brown Container - Bottom Section */}
                <div className="p-3 flex flex-col overflow-hidden" style={{ height: '248px', backgroundColor: '#2A1A05' }}>
                  {/* Title - WHITE COLOR */}
                  <h3 className="text-white font-bold text-sm leading-tight truncate" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>
                    {combo.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-xs line-clamp-2 leading-snug mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {combo.description}
                  </p>

                  {/* Info Row - Calories and Time */}
                  <div className="flex items-center justify-between text-white text-xs mt-2">
                    <div className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }}>{combo.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span style={{ fontFamily: 'Inter, sans-serif' }}>{combo.prepTime}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/20 my-2 flex-shrink-0" />

                  {/* Price Section with Strikethrough */}
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <p className="text-gray-400 text-xs line-through" style={{ fontFamily: 'Inter, sans-serif' }}>₹{combo.originalPrice}</p>
                      <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Save ₹{combo.originalPrice - combo.discountedPrice}
                      </Badge>
                    </div>
                    <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>₹{combo.discountedPrice}</p>
                  </div>

                  {/* Spacer to push admin actions to bottom */}
                  <div className="flex-grow" />

                  {/* Admin Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Available</span>
                      <Switch 
                        checked={combo.available}
                        onCheckedChange={(checked) => {
                          void handleToggleComboAvailability(combo, checked);
                        }}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/10"
                        onClick={() => { 
                          setEditingCombo(combo); 
                          setComboDialogOpen(true); 
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-white hover:bg-white/10 hover:text-red-400"
                        onClick={() => {
                          void handleDeleteCombo(combo.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Poppins, sans-serif' }}>
              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {editingItem ? "Update the details of your menu item" : "Add a new item to your menu"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" style={{ fontFamily: 'Inter, sans-serif' }}>Item Name</Label>
                <Input id="name" name="name" defaultValue={editingItem?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine" style={{ fontFamily: 'Inter, sans-serif' }}>Cuisine</Label>
                <Select name="cuisine" defaultValue={editingItem?.cuisine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="South Indian">South Indian</SelectItem>
                    <SelectItem value="North Indian">North Indian</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Continental">Continental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" style={{ fontFamily: 'Inter, sans-serif' }}>Category</Label>
                <Select name="category" defaultValue={editingItem?.category}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starters">Starters</SelectItem>
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Breads">Breads</SelectItem>
                    <SelectItem value="Desserts">Desserts</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" style={{ fontFamily: 'Inter, sans-serif' }}>Price (₹)</Label>
                <Input id="price" name="price" type="number" defaultValue={editingItem?.price} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" style={{ fontFamily: 'Inter, sans-serif' }}>Description</Label>
              <Input id="description" name="description" defaultValue={editingItem?.description} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories" style={{ fontFamily: 'Inter, sans-serif' }}>Calories</Label>
                <Input id="calories" name="calories" type="number" defaultValue={editingItem?.calories} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prepTime" style={{ fontFamily: 'Inter, sans-serif' }}>Prep Time</Label>
                <Input id="prepTime" name="prepTime" defaultValue={editingItem?.prepTime} placeholder="e.g., 15-20 mins" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diet" style={{ fontFamily: 'Inter, sans-serif' }}>Diet Type</Label>
                <Select name="diet" defaultValue={editingItem?.dietType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Customization Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Customization Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Spice Level */}
                <div className="space-y-2">
                  <Label htmlFor="spiceLevel" style={{ fontFamily: 'Inter, sans-serif' }}>Spice Level</Label>
                  <Select name="spiceLevel" defaultValue={editingItem?.spiceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select spice level" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPICE_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="offerDiscount" style={{ fontFamily: 'Inter, sans-serif' }}>Offer Discount</Label>
                  <Input id="offerDiscount" name="offerDiscount" defaultValue={editingItem?.offerDiscount} placeholder="e.g., 10% OFF" />
                </div>
              </div>
              
              {/* Addons as Checkboxes */}
              <div className="space-y-2 mt-4">
                <Label style={{ fontFamily: 'Inter, sans-serif' }}>Available Addons (Select Multiple)</Label>
                <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                  {AVAILABLE_ADDONS.map(addon => (
                    <div key={addon} className="flex items-center space-x-2">
                      <Checkbox 
                        id={addon}
                        checked={selectedAddons.includes(addon)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAddons([...selectedAddons, addon]);
                          } else {
                            setSelectedAddons(selectedAddons.filter(a => a !== addon));
                          }
                        }}
                      />
                      <label htmlFor={addon} className="text-sm cursor-pointer" style={{ fontFamily: 'Inter, sans-serif' }}>{addon}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-[#8B5A2B] hover:bg-[#6D421E]">
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); setEditingItem(null); setSelectedAddons([]); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Combo Dialog */}
      <Dialog open={comboDialogOpen} onOpenChange={setComboDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Poppins, sans-serif' }}>
              {editingCombo ? "Edit Combo Meal" : "Add New Combo Meal"}
            </DialogTitle>
            <DialogDescription style={{ fontFamily: 'Inter, sans-serif' }}>
              {editingCombo ? "Update the details of your combo" : "Create a new combo meal"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCombo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comboName" style={{ fontFamily: 'Inter, sans-serif' }}>Combo Name</Label>
              <Input id="comboName" name="name" defaultValue={editingCombo?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comboDesc" style={{ fontFamily: 'Inter, sans-serif' }}>Description</Label>
              <Input id="comboDesc" name="desc" defaultValue={editingCombo?.description} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comboCuisine" style={{ fontFamily: 'Inter, sans-serif' }}>Cuisine</Label>
              <Select name="cuisine" defaultValue={editingCombo?.cuisine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="South Indian">South Indian</SelectItem>
                  <SelectItem value="North Indian">North Indian</SelectItem>
                  <SelectItem value="Chinese">Chinese</SelectItem>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="Continental">Continental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice" style={{ fontFamily: 'Inter, sans-serif' }}>Original Price (₹)</Label>
                <Input id="originalPrice" name="originalPrice" type="number" defaultValue={editingCombo?.originalPrice || ''} min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comboPrice" style={{ fontFamily: 'Inter, sans-serif' }}>Discounted Price (₹)</Label>
                <Input id="comboPrice" name="price" type="number" defaultValue={editingCombo?.discountedPrice || ''} min="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comboCalories" style={{ fontFamily: 'Inter, sans-serif' }}>Calories</Label>
                <Input id="comboCalories" name="calories" type="number" defaultValue={editingCombo?.calories} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comboPrepTime" style={{ fontFamily: 'Inter, sans-serif' }}>Prep Time</Label>
              <Input id="comboPrepTime" name="prepTime" defaultValue={editingCombo?.prepTime} placeholder="e.g., 25mins" required />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-[#8B5A2B] hover:bg-[#6D421E]">
                {editingCombo ? "Update Combo" : "Add Combo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setComboDialogOpen(false); setEditingCombo(null); }}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}