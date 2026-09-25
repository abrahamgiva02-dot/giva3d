import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Banner, Category } from '@/types';
import { INITIAL_PRODUCTS } from '../data/products';
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
  addProduct: (product: Omit<Product, 'id'>) => Product;
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
      products: INITIAL_PRODUCTS.map((p) => ({
        ...p,
        slug: slugify(p.slug || p.name),
      })),
      banners: INITIAL_BANNERS,
      categories: INITIAL_CATEGORIES,
      isHydrated: false,
      setHydrated: (val) => set({ isHydrated: val }),

      // Products
      addProduct: (newProdData) => {
        const id = `prod-${Date.now()}`;
        const cleanSlug = slugify(newProdData.slug || newProdData.name) || `producto-${Date.now()}`;
        const newProduct: Product = {
          ...newProdData,
          slug: cleanSlug,
          id,
          createdAt: new Date().toISOString(),
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
          products: INITIAL_PRODUCTS,
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
            // If quota is exceeded (e.g. leftover data or legacy items), clear and retry safely
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
      partialize: (state) => ({
        // Strip any base64, blob or temporary data before saving to localStorage, and ensure all slugs are clean
        products: state.products.map((p) => ({
          ...p,
          slug: slugify(p.slug || p.name),
          categorySlug: slugify(p.categorySlug || ''),
          // Only keep string URLs (e.g. Supabase Storage URL or Unsplash URL), never data: URLs
          primaryImage: (p.primaryImage && !p.primaryImage.startsWith('data:')) ? p.primaryImage : '',
          images: (p.images || []).filter((img) => !img.startsWith('data:')),
          productImages: (p.productImages || [])
            .filter((pi) => !pi.imageUrl.startsWith('data:'))
            .map((pi) => ({
              id: pi.id,
              productId: pi.productId,
              imageUrl: pi.imageUrl,
              storagePath: pi.storagePath,
              isPrimary: pi.isPrimary,
              sortOrder: pi.sortOrder,
            })),
        })),
        banners: state.banners.map((b) => ({
          ...b,
          imageUrl: b.imageUrl?.startsWith('data:') ? '' : b.imageUrl,
          mobileImageUrl: b.mobileImageUrl?.startsWith('data:') ? '' : b.mobileImageUrl,
        })),
        categories: state.categories,
      }),
      onRehydrateStorage: () => (state) => {
        // Auto-cleanup any corrupted or oversized legacy localStorage state on startup
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('giva3d-catalog-storage');
            if (raw && (raw.includes('data:image') || raw.length > 500000)) {
              console.warn('[GIVA 3D] Detected oversized base64 data in localStorage. Cleaning up...');
              localStorage.removeItem('giva3d-catalog-storage');
            }
          } catch (e) {
            console.error('[GIVA 3D] Error reading or cleaning storage:', e);
          }
        }

        // Normalize all product slugs in memory after rehydration from localStorage
        if (state && state.products) {
          state.products = state.products.map((p) => ({
            ...p,
            slug: slugify(p.slug || p.name),
            categorySlug: slugify(p.categorySlug || ''),
          }));
        }

        state?.setHydrated(true);
      },
    }
  )
);
