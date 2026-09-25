import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Banner, Category } from '@/types';
import { INITIAL_BANNERS } from '../data/banners';
import { INITIAL_CATEGORIES } from '../data/categories';
import { slugify } from '../slug';

interface CatalogStore {
  products: Product[];
  banners: Banner[];
  categories: Category[];
  isHydrated: boolean;
  setHydrated: (val: boolean) => void;

  // Product Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id'> & { id?: string }) => Product;
  updateProduct: (id: string, productData: Partial<Product>) => void;
  toggleProductActive: (id: string) => void;
  deleteProduct: (id: string) => void;

  // Banner Actions
  setBanners: (banners: Banner[]) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => Banner;
  updateBanner: (id: string, bannerData: Partial<Banner>) => void;
  toggleBannerActive: (id: string) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (newOrder: Banner[]) => void;

  // Utility
  resetToDefaults: () => void;
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set, get) => ({
      products: [],
      banners: INITIAL_BANNERS,
      categories: INITIAL_CATEGORIES,
      isHydrated: false,
      setHydrated: (val) => set({ isHydrated: val }),

      // Products
      setProducts: (products) => {
        set({
          products: products.map((p) => ({
            ...p,
            slug: slugify(p.slug || p.name),
            categorySlug: slugify(p.categorySlug || ''),
          })),
        });
      },
      addProduct: (newProdData) => {
        const id = newProdData.id || `prod-${Date.now()}`;
        const cleanSlug = slugify(newProdData.slug || newProdData.name) || `producto-${Date.now()}`;
        const newProduct: Product = {
          ...newProdData,
          slug: cleanSlug,
          id,
          createdAt: newProdData.createdAt || new Date().toISOString(),
        };
        set({ products: [newProduct, ...get().products] });
        return newProduct;
      },

      updateProduct: (id, productData) => {
        const cleanData = { ...productData };
        if (cleanData.slug) {
          cleanData.slug = slugify(cleanData.slug);
        } else if (cleanData.name && !cleanData.slug) {
          // If name changed without explicit slug, keep or regenerate
        }
        set({
          products: get().products.map((p) => {
            if (p.id !== id) return p;
            const updatedSlug = cleanData.slug ? slugify(cleanData.slug) : slugify(p.slug || p.name);
            return {
              ...p,
              ...cleanData,
              slug: updatedSlug,
            };
          }),
        });
      },

      toggleProductActive: (id) => {
        set({
          products: get().products.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive } : p
          ),
        });
      },

      deleteProduct: (id) => {
        set({
          products: get().products.filter((p) => p.id !== id),
        });
      },

      // Banners
      setBanners: (banners) => set({ banners }),

      addBanner: (newBannerData) => {
        const id = `banner-${Date.now()}`;
        const newBanner: Banner = {
          ...newBannerData,
          id,
        };
        set({ banners: [...get().banners, newBanner] });
        return newBanner;
      },

      updateBanner: (id, bannerData) => {
        set({
          banners: get().banners.map((b) => (b.id === id ? { ...b, ...bannerData } : b)),
        });
      },

      toggleBannerActive: (id) => {
        set({
          banners: get().banners.map((b) =>
            b.id === id ? { ...b, isActive: !b.isActive } : b
          ),
        });
      },

      deleteBanner: (id) => {
        set({
          banners: get().banners.filter((b) => b.id !== id),
        });
      },

      reorderBanners: (newOrder) => {
        set({ banners: newOrder });
      },

      resetToDefaults: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('giva3d-catalog-storage');
          } catch {
            // ignore
          }
        }
        set({
          products: [],
          banners: INITIAL_BANNERS,
          categories: INITIAL_CATEGORIES,
        });
      },
    }),
    {
      name: 'giva3d-catalog-storage',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value);
          } catch (e: any) {
            if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.number === -2147024882) {
              console.warn('[GIVA 3D] localStorage quota exceeded. Purging giva3d-catalog-storage to recover...');
              try {
                localStorage.removeItem(name);
              } catch {
                // ignore
              }
            }
          }
        },
        removeItem: (name: string) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      })),
      // DO NOT persist products to localStorage. Products strictly come from Supabase.
      partialize: (state) => ({
        banners: state.banners.map((b) => ({
          ...b,
          imageUrl: b.imageUrl?.startsWith('data:') ? '' : b.imageUrl,
          mobileImageUrl: b.mobileImageUrl?.startsWith('data:') ? '' : b.mobileImageUrl,
        })),
        categories: state.categories,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Guarantee that hydrated state never contains legacy demo products
          state.products = [];
          state.setHydrated(true);
        }
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('giva3d-catalog-storage');
            if (raw && (raw.includes('dragon-articulado') || raw.includes('lagartija-articulada') || raw.includes('data:image') || raw.length > 500000)) {
              console.warn('[GIVA 3D] Cleaning legacy demo products from localStorage...');
              localStorage.removeItem('giva3d-catalog-storage');
            }
          } catch {
            // ignore
          }
        }
      },
    }
  )
);
