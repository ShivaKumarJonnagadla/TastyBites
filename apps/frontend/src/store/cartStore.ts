import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartDish {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  isVegetarian: boolean;
  category: string;
  allowSpiceSelection: boolean;
}

export interface CartItem {
  dish: CartDish;
  quantity: number;
  selectedSpiceLevel?: string; // only set when dish.allowSpiceSelection is true
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (dish: CartDish, selectedSpiceLevel?: string) => void;
  removeItem: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
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

      addItem: (dish, selectedSpiceLevel) => {
        set((state) => {
          const existing = state.items.find((i) => i.dish.id === dish.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                dish,
                quantity: 1,
                ...(selectedSpiceLevel ? { selectedSpiceLevel } : {}),
              },
            ],
          };
        });
      },

      removeItem: (dishId) =>
        set((state) => ({ items: state.items.filter((i) => i.dish.id !== dishId) })),

      updateQuantity: (dishId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(dishId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.dish.id === dishId ? { ...i, quantity } : i
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
