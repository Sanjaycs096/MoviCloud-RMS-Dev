/**
 * Station Assignment Utilities for Kitchen Display System
 * Maps food items to appropriate cooking stations
 */

export type Station = 'FRY' | 'CURRY' | 'GRILL' | 'COLD' | 'BEVERAGE';

export interface StationConfig {
  name: Station;
  color: string;
  bgColor: string;
  borderColor: string;
  keywords: string[];
}

export const STATION_CONFIGS: Record<Station, StationConfig> = {
  FRY: {
    name: 'FRY',
    color: 'text-orange-200',
    bgColor: 'bg-orange-900',
    borderColor: 'border-orange-600',
    keywords: ['fries', 'dosa', 'samosa', 'pakora', 'vada', 'fried', 'fry', 'tempura', 'fritter']
  },
  CURRY: {
    name: 'CURRY',
    color: 'text-yellow-200',
    bgColor: 'bg-yellow-900',
    borderColor: 'border-yellow-600',
    keywords: ['curry', 'paneer', 'dal', 'chicken', 'gravy', 'masala', 'biryani', 'pulao', 'rice']
  },
  GRILL: {
    name: 'GRILL',
    color: 'text-red-200',
    bgColor: 'bg-red-900',
    borderColor: 'border-red-600',
    keywords: ['tikka', 'kebab', 'tandoor', 'grill', 'pizza', 'roast', 'barbecue', 'bbq', 'steak']
  },
  COLD: {
    name: 'COLD',
    color: 'text-blue-200',
    bgColor: 'bg-blue-900',
    borderColor: 'border-blue-600',
    keywords: ['gulab', 'ice cream', 'salad', 'raita', 'kulfi', 'dessert', 'cold', 'chilled', 'yogurt']
  },
  BEVERAGE: {
    name: 'BEVERAGE',
    color: 'text-purple-200',
    bgColor: 'bg-purple-900',
    borderColor: 'border-purple-600',
    keywords: ['lassi', 'coffee', 'tea', 'juice', 'shake', 'smoothie', 'soda', 'water', 'drink']
  }
};

/**
 * Determines the cooking station for a given food item
 */
export function getStationForItem(itemName: string): Station {
  const name = itemName.toLowerCase();
  
  // Check each station's keywords
  for (const [station, config] of Object.entries(STATION_CONFIGS)) {
    if (config.keywords.some(keyword => name.includes(keyword))) {
      return station as Station;
    }
  }
  
  // Default to CURRY station for unmatched items
  return 'CURRY';
}

/**
 * Gets the color classes for a station
 */
export function getStationColors(station: Station): string {
  const config = STATION_CONFIGS[station];
  return `${config.bgColor} ${config.color} ${config.borderColor}`;
}

/**
 * Checks if an item belongs to a specific station
 */
export function isItemInStation(itemName: string, station: Station): boolean {
  return getStationForItem(itemName) === station;
}

/**
 * Groups items by their stations
 */
export function groupItemsByStation<T extends { name: string }>(
  items: T[]
): Record<Station, T[]> {
  const grouped: Record<Station, T[]> = {
    FRY: [],
    CURRY: [],
    GRILL: [],
    COLD: [],
    BEVERAGE: []
  };

  items.forEach(item => {
    const station = getStationForItem(item.name);
    grouped[station].push(item);
  });

  return grouped;
}

/**
 * Gets station statistics from a list of items
 */
export function getStationStats<T extends { name: string; quantity: number }>(
  items: T[]
): Record<Station, { itemCount: number; totalQuantity: number }> {
  const stats: Record<Station, { itemCount: number; totalQuantity: number }> = {
    FRY: { itemCount: 0, totalQuantity: 0 },
    CURRY: { itemCount: 0, totalQuantity: 0 },
    GRILL: { itemCount: 0, totalQuantity: 0 },
    COLD: { itemCount: 0, totalQuantity: 0 },
    BEVERAGE: { itemCount: 0, totalQuantity: 0 }
  };

  items.forEach(item => {
    const station = getStationForItem(item.name);
    stats[station].itemCount++;
    stats[station].totalQuantity += item.quantity;
  });

  return stats;
}
