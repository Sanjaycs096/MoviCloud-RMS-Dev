// Menu Data for Restaurant Management System

export const categories = [
  'All',
  'Starters',
  'Main Course',
  'Breads',
  'Rice & Biryani',
  'Desserts',
  'Beverages',
  'Chinese',
  'Italian',
  'Continental'
];

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isVeg: boolean;
  offer?: string;
  popular?: boolean;
  spicy?: boolean;
}

export const menuData: MenuItem[] = [
  // Starters
  {
    id: '1',
    name: 'Paneer Tikka',
    category: 'Starters',
    price: 280,
    description: 'Marinated cottage cheese cubes grilled to perfection with aromatic spices',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
    isVeg: true,
    popular: true,
    spicy: true
  },
  {
    id: '2',
    name: 'Chicken Tikka',
    category: 'Starters',
    price: 320,
    description: 'Tender chicken pieces marinated in yogurt and spices, char-grilled',
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
    isVeg: false,
    popular: true,
    spicy: true
  },
  {
    id: '3',
    name: 'Veg Spring Rolls',
    category: 'Starters',
    price: 180,
    description: 'Crispy rolls filled with fresh vegetables and served with sweet chili sauce',
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=400',
    isVeg: true
  },
  {
    id: '4',
    name: 'Chicken Wings',
    category: 'Starters',
    price: 340,
    description: 'Spicy buffalo wings served with ranch dipping sauce',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
    isVeg: false,
    spicy: true,
    offer: '15% OFF'
  },
  {
    id: '5',
    name: 'Mushroom Soup',
    category: 'Starters',
    price: 150,
    description: 'Creamy soup made with fresh mushrooms and herbs',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
    isVeg: true
  },

  // Main Course
  {
    id: '6',
    name: 'Butter Chicken',
    category: 'Main Course',
    price: 380,
    description: 'Tender chicken in rich tomato and butter gravy with aromatic spices',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
    isVeg: false,
    popular: true
  },
  {
    id: '7',
    name: 'Paneer Butter Masala',
    category: 'Main Course',
    price: 320,
    description: 'Cottage cheese cubes in creamy tomato gravy',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '8',
    name: 'Dal Makhani',
    category: 'Main Course',
    price: 260,
    description: 'Black lentils cooked overnight in butter and cream',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '9',
    name: 'Chicken Korma',
    category: 'Main Course',
    price: 360,
    description: 'Mild curry with chicken in creamy cashew and yogurt gravy',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400',
    isVeg: false
  },
  {
    id: '10',
    name: 'Palak Paneer',
    category: 'Main Course',
    price: 290,
    description: 'Cottage cheese in spinach gravy with Indian spices',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    isVeg: true
  },

  // Breads
  {
    id: '11',
    name: 'Butter Naan',
    category: 'Breads',
    price: 60,
    description: 'Soft leavened bread brushed with butter',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '12',
    name: 'Garlic Naan',
    category: 'Breads',
    price: 70,
    description: 'Naan topped with fresh garlic and coriander',
    image: 'https://images.unsplash.com/photo-1619681674851-aba1bc2e7e75?w=400',
    isVeg: true
  },
  {
    id: '13',
    name: 'Tandoori Roti',
    category: 'Breads',
    price: 40,
    description: 'Whole wheat bread cooked in tandoor',
    image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
    isVeg: true
  },
  {
    id: '14',
    name: 'Cheese Naan',
    category: 'Breads',
    price: 90,
    description: 'Naan stuffed with cheese',
    image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=400',
    isVeg: true,
    offer: '10% OFF'
  },

  // Rice & Biryani
  {
    id: '15',
    name: 'Veg Biryani',
    category: 'Rice & Biryani',
    price: 280,
    description: 'Aromatic basmati rice cooked with mixed vegetables and spices',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '16',
    name: 'Chicken Biryani',
    category: 'Rice & Biryani',
    price: 350,
    description: 'Fragrant rice layered with marinated chicken and aromatic spices',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    isVeg: false,
    popular: true
  },
  {
    id: '17',
    name: 'Jeera Rice',
    category: 'Rice & Biryani',
    price: 180,
    description: 'Basmati rice tempered with cumin seeds',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400',
    isVeg: true
  },
  {
    id: '18',
    name: 'Mutton Biryani',
    category: 'Rice & Biryani',
    price: 420,
    description: 'Premium biryani with tender mutton pieces',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    isVeg: false,
    offer: '20% OFF'
  },

  // Desserts
  {
    id: '19',
    name: 'Gulab Jamun',
    category: 'Desserts',
    price: 120,
    description: 'Soft milk solid dumplings soaked in rose-flavored sugar syrup',
    image: 'https://images.unsplash.com/photo-1589119908995-c6c8f58a0dc4?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '20',
    name: 'Rasmalai',
    category: 'Desserts',
    price: 140,
    description: 'Soft cottage cheese patties in sweetened milk with cardamom',
    image: 'https://images.unsplash.com/photo-1631777779184-3d1915c0c6b0?w=400',
    isVeg: true
  },
  {
    id: '21',
    name: 'Ice Cream Sundae',
    category: 'Desserts',
    price: 150,
    description: 'Vanilla ice cream with chocolate sauce and nuts',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    isVeg: true
  },
  {
    id: '22',
    name: 'Chocolate Lava Cake',
    category: 'Desserts',
    price: 180,
    description: 'Warm chocolate cake with molten center',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    isVeg: true,
    offer: '15% OFF'
  },

  // Beverages
  {
    id: '23',
    name: 'Mango Lassi',
    category: 'Beverages',
    price: 100,
    description: 'Refreshing yogurt drink with mango pulp',
    image: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '24',
    name: 'Fresh Lime Soda',
    category: 'Beverages',
    price: 70,
    description: 'Sparkling water with fresh lime and mint',
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=400',
    isVeg: true
  },
  {
    id: '25',
    name: 'Masala Chai',
    category: 'Beverages',
    price: 50,
    description: 'Indian spiced tea with milk',
    image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400',
    isVeg: true
  },
  {
    id: '26',
    name: 'Cold Coffee',
    category: 'Beverages',
    price: 120,
    description: 'Chilled coffee with ice cream',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    isVeg: true
  },

  // Chinese
  {
    id: '27',
    name: 'Veg Hakka Noodles',
    category: 'Chinese',
    price: 220,
    description: 'Stir-fried noodles with fresh vegetables',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '28',
    name: 'Chilli Chicken',
    category: 'Chinese',
    price: 300,
    description: 'Spicy chicken tossed with bell peppers and onions',
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400',
    isVeg: false,
    spicy: true
  },
  {
    id: '29',
    name: 'Veg Manchurian',
    category: 'Chinese',
    price: 240,
    description: 'Vegetable dumplings in spicy Manchurian sauce',
    image: 'https://images.unsplash.com/photo-1626504829036-f0c345d5adc2?w=400',
    isVeg: true,
    spicy: true
  },
  {
    id: '30',
    name: 'Chicken Fried Rice',
    category: 'Chinese',
    price: 260,
    description: 'Fried rice with chicken and vegetables',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    isVeg: false
  },

  // Italian
  {
    id: '31',
    name: 'Margherita Pizza',
    category: 'Italian',
    price: 320,
    description: 'Classic pizza with tomato sauce, mozzarella and basil',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    isVeg: true,
    popular: true
  },
  {
    id: '32',
    name: 'Chicken Alfredo Pasta',
    category: 'Italian',
    price: 360,
    description: 'Creamy pasta with grilled chicken',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    isVeg: false,
    popular: true
  },
  {
    id: '33',
    name: 'Penne Arrabbiata',
    category: 'Italian',
    price: 280,
    description: 'Pasta in spicy tomato sauce with garlic',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    isVeg: true,
    spicy: true
  },
  {
    id: '34',
    name: 'Lasagna',
    category: 'Italian',
    price: 380,
    description: 'Layered pasta with meat sauce and cheese',
    image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400',
    isVeg: false
  },

  // Continental
  {
    id: '35',
    name: 'Grilled Chicken Steak',
    category: 'Continental',
    price: 450,
    description: 'Juicy chicken breast with mashed potatoes and vegetables',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400',
    isVeg: false,
    popular: true
  },
  {
    id: '36',
    name: 'Fish & Chips',
    category: 'Continental',
    price: 420,
    description: 'Crispy fried fish with french fries',
    image: 'https://images.unsplash.com/photo-1579208570378-8c970854bc23?w=400',
    isVeg: false
  },
  {
    id: '37',
    name: 'Veggie Burger',
    category: 'Continental',
    price: 280,
    description: 'Grilled vegetable patty with cheese and sauces',
    image: 'https://images.unsplash.com/photo-1525059696034-4967a729002a?w=400',
    isVeg: true
  },
  {
    id: '38',
    name: 'Caesar Salad',
    category: 'Continental',
    price: 240,
    description: 'Fresh lettuce with Caesar dressing and croutons',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    isVeg: true
  }
];
