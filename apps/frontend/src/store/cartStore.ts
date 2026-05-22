import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartDish {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isVegetarian: boolean;
  category: string;
}

export interface CartItem {
  dish: CartDish;
  quantity: number;
  spiceLevel?: string;
}

// Unique key per cart entry: same dish in different spice levels = separate items
export function cartItemKey(dishId: string, spiceLevel?: string) {
  return spiceLevel ? `${dishId}::${spiceLevel}` : dishId;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (dish: CartDish, spiceLevel?: string) => void;
  removeItem: (dishId: string, spiceLevel?: string) => void;
  updateQuantity: (dishId: string, quantity: number, spiceLevel?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (dish, spiceLevel) => {
        set((state) => {
          const key = cartItemKey(dish.id, spiceLevel);
          const existing = state.items.find((i) => cartItemKey(i.dish.id, i.spiceLevel) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i.dish.id, i.spiceLevel) === key ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { dish, quantity: 1, spiceLevel }] };
        });
      },

      removeItem: (dishId, spiceLevel) =>
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i.dish.id, i.spiceLevel) !== cartItemKey(dishId, spiceLevel)),
        })),

      updateQuantity: (dishId, quantity, spiceLevel) => {
        if (quantity <= 0) {
          get().removeItem(dishId, spiceLevel);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i.dish.id, i.spiceLevel) === cartItemKey(dishId, spiceLevel) ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalAmount: () => get().items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0),
    }),
    {
      name: 'tastybites-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
