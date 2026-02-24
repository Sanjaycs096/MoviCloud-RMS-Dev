export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  category: string;
  available: boolean;
  popular?: boolean;
  todaysSpecial?: boolean; // Dynamic tag for daily featured items
  calories: number; // Calories in kcal
  prepTime: string; // Preparation time (e.g., "15-20 mins")
  offer?: string; // Optional offer/deal (e.g., "10% OFF")
}
