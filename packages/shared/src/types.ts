export type MenuType = 'DAILY' | 'FRIDAY' | 'BOTH';
export type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'SWISH' | 'CASH';
export type Language = 'en' | 'sv';

export interface Dish {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  ingredientsSv: string;
  pieces: number | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  menuType: MenuType;
  isVegetarian: boolean;
  spiceLevel: SpiceLevel;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  dishId: string;
  dish: Dish;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  mobileNumber: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  pickupMessage: string | null;
  notes: string | null;
  orderItems: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface PickupMessage {
  id: string;
  message: string;
  messageSv: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface CheckoutData {
  customerName: string;
  mobileNumber: string;
  paymentMethod: PaymentMethod;
  items: { dishId: string; quantity: number; price: number }[];
  notes?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  weekRevenue: number;
}

export interface DishFilters {
  search?: string;
  menuType?: MenuType;
  isVegetarian?: boolean;
  spiceLevel?: SpiceLevel;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
}
