export const APP_NAME = 'Tasty Bites';
export const APP_TAGLINE = 'Authentic Indian Food';
export const APP_DESCRIPTION = 'Finger licking homemade Indian food';

export const DISH_CATEGORIES = [
  'Biryani',
  'Curry',
  'Snacks',
  'Bread',
  'Rice',
  'Dessert',
  'Drinks',
  'Thali',
  'Starter',
  'Side Dish',
] as const;

export const SPICE_LEVELS = {
  MILD: 'Mild',
  MEDIUM: 'Medium',
  HOT: 'Hot',
  EXTRA_HOT: 'Extra Hot',
} as const;

export const MENU_TYPES = {
  DAILY: 'Daily Menu',
  FRIDAY: 'Friday Special',
  BOTH: 'Both Menus',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'Pending',
  PREPARING: 'Preparing',
  READY: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const MARKETING_MESSAGES = [
  'Finger licking homemade Indian food',
  'Freshly prepared with authentic Indian spices',
  'Made with love for Indian and Swedish food lovers',
  'Taste India in every bite',
  'Traditional Indian flavors delivered fresh',
] as const;

export const GREETING_MESSAGES = {
  en: [
    'Namaste! Welcome to Tasty Bites 🙏',
    'Hello! Ready for authentic Indian flavors? 🌶️',
    'Welcome! Taste the warmth of India today 🍛',
    'Good to see you! Fresh Indian food awaits 🥘',
    'Greetings! Explore our authentic menu 🌿',
  ],
  sv: [
    'Namaste! Välkommen till Tasty Bites 🙏',
    'Hej! Redo för äkta indiska smaker? 🌶️',
    'Välkommen! Smaka Indiens värme idag 🍛',
    'Kul att se dig! Färsk indisk mat väntar 🥘',
    'Hälsningar! Utforska vår autentiska meny 🌿',
  ],
} as const;
