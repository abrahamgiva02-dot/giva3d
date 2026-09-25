import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product } from '@/types';
import { calculateUnitPrice } from '../pricing';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (product: Product, quantity: number, selectedColor?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => set({ isOpen }),

      addItem: (product, quantity, selectedColor) => {
        const id = `${product.id}-${selectedColor || 'default'}`;
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex((item) => item.id === id);

        if (existingIndex > -1) {
          const existingItem = currentItems[existingIndex];
          const newQty = existingItem.quantity + quantity;
          const newUnitPrice = calculateUnitPrice(product, newQty);
          
          const updatedItems = [...currentItems];
          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: newQty,
            unitPrice: newUnitPrice,
            subtotal: newQty * newUnitPrice,
          };
          set({ items: updatedItems, isOpen: true });
        } else {
          const unitPrice = calculateUnitPrice(product, quantity);
          const newItem: CartItem = {
            id,
            productId: product.id,
            product,
            quantity,
            selectedColor,
            unitPrice,
            subtotal: quantity * unitPrice,
          };
          set({ items: [...currentItems, newItem], isOpen: true });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const currentItems = get().items;
        const updated = currentItems.map((item) => {
          if (item.id === id) {
            const unitPrice = calculateUnitPrice(item.product, quantity);
            return {
              ...item,
              quantity,
              unitPrice,
              subtotal: quantity * unitPrice,
            };
          }
          return item;
        });

        set({ items: updated });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((acc, item) => acc + item.subtotal, 0);
      },
    }),
    {
      name: 'giva3d-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
