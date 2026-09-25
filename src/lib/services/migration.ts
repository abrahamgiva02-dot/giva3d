import { supabase, isSupabaseConfigured } from '../supabase';
import { Product, ProductColor } from '@/types';
import { slugify } from '../slug';
import { useCatalogStore } from '../store/catalog-store';

export interface MigrationItemResult {
  name: string;
  slug: string;
  status: 'migrated' | 'already_exists' | 'error';
  error?: string;
}

export interface MigrationResult {
  success: boolean;
  totalFound: number;
  migrated: number;
  alreadyExisting: number;
  errorsCount: number;
  errors: { name: string; error: string }[];
  currentDbTotal: number;
  items: MigrationItemResult[];
}

/**
 * Safely extracts all products stored locally in the browser's localStorage or Zustand store.
 * DOES NOT remove or modify anything in localStorage.
 */
export function getLocalStoredProducts(): Product[] {
  if (typeof window === 'undefined') return [];

  const foundMap = new Map<string, Product>();

  // 1. Try reading directly from localStorage 'giva3d-catalog-storage'
  try {
    const raw = localStorage.getItem('giva3d-catalog-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      const list = parsed?.state?.products || parsed?.products;
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item && item.name) {
            const cleanSlug = slugify(item.slug || item.name);
            foundMap.set(cleanSlug, {
              ...item,
              slug: cleanSlug,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MIGRATION] Error reading from localStorage:', err);
  }

  // 2. Also check Zustand memory store in case of newly added uncommitted items
  try {
    const storeProducts = useCatalogStore.getState().products;
    if (Array.isArray(storeProducts)) {
      for (const item of storeProducts) {
        if (item && item.name) {
          const cleanSlug = slugify(item.slug || item.name);
          if (!foundMap.has(cleanSlug)) {
            foundMap.set(cleanSlug, {
              ...item,
              slug: cleanSlug,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[MIGRATION] Error reading from Zustand store:', err);
  }

  return Array.from(foundMap.values());
}

/**
 * Builds a safe payload for inserting a product into public.products
 */
function buildDbProductRow(local: Product): Record<string, any> {
  const row: Record<string, any> = {
    name: local.name,
    slug: slugify(local.slug || local.name),
    description: local.description || null,
    category_slug: local.categorySlug || null,
    status: local.status || 'disponible',
    lead_time: local.leadTime || '1–2 días',
    is_active: local.isActive !== false,
    is_new: Boolean(local.isNew),
    is_best_seller: Boolean(local.isBestSeller),
    is_offer: Boolean(local.isOffer),
    is_customizable: Boolean(local.isCustomizable),
    is_featured: Boolean(local.isFeatured),
    has_tiered_pricing: local.hasTieredPricing !== false,
    price_1: local.price1 ?? 0,
    price_6: local.price6 ?? null,
    price_12: local.price12 ?? null,
    price_24: local.price24 ?? null,
    primary_image: local.primaryImage || (local.images && local.images[0]) || null,
  };

  // If local.id is a valid UUID, include it
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(local.id);
  if (isUuid) {
    row.id = local.id;
  }

  return row;
}

/**
 * Performs migration of local products into Supabase.
 * - Detects existing products by ID and by SLUG to prevent duplicates.
 * - Inserts missing products into public.products.
 * - Migrates images to public.product_images.
 * - Migrates colors to public.product_colors.
 * - NEVER deletes or alters localStorage.
 * - Performs final Supabase count verification.
 */
export async function migrateLocalProductsToSupabase(): Promise<MigrationResult> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables de entorno.');
  }

  const localProducts = getLocalStoredProducts();
  const totalFound = localProducts.length;

  if (totalFound === 0) {
    // Check Supabase count even if 0 local
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    return {
      success: true,
      totalFound: 0,
      migrated: 0,
      alreadyExisting: 0,
      errorsCount: 0,
      errors: [],
      currentDbTotal: count ?? 0,
      items: [],
    };
  }

  // 1. Fetch all existing products from Supabase to prevent duplicates
  const { data: existingRows, error: fetchErr } = await supabase
    .from('products')
    .select('id, slug, name');

  if (fetchErr) {
    console.error('[MIGRATION ERROR] Failed to query existing Supabase products:', fetchErr);
    throw new Error(`Error consultando productos en Supabase: ${fetchErr.message}`);
  }

  const existingSlugs = new Set<string>();
  const existingIds = new Set<string>();

  for (const row of existingRows || []) {
    if (row.slug) existingSlugs.add(slugify(row.slug));
    if (row.id) existingIds.add(String(row.id));
  }

  let migratedCount = 0;
  let alreadyExistingCount = 0;
  const errorsList: { name: string; error: string }[] = [];
  const itemsLog: MigrationItemResult[] = [];

  // 2. Process each local product
  for (const local of localProducts) {
    const cleanSlug = slugify(local.slug || local.name);

    // Check if product already exists in Supabase by slug or id
    if (existingSlugs.has(cleanSlug) || (local.id && existingIds.has(local.id))) {
      alreadyExistingCount++;
      itemsLog.push({
        name: local.name,
        slug: cleanSlug,
        status: 'already_exists',
      });
      continue;
    }

    try {
      const payload = buildDbProductRow(local);

      // Insert product
      const { data: inserted, error: insertErr } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      const insertedId = String(inserted.id);
      existingSlugs.add(cleanSlug);
      existingIds.add(insertedId);

      // Migrate product images if present
      const allImages = local.images && local.images.length > 0
        ? local.images
        : local.primaryImage ? [local.primaryImage] : [];

      if (allImages.length > 0) {
        try {
          const imageRows = allImages.map((imgUrl, idx) => ({
            product_id: insertedId,
            storage_path: imgUrl.includes('/storage/v1/object/public/product-images/')
              ? imgUrl.split('/storage/v1/object/public/product-images/')[1]
              : imgUrl,
            image_url: imgUrl,
            is_primary: imgUrl === local.primaryImage || idx === 0,
            sort_order: idx,
          }));

          await supabase.from('product_images').insert(imageRows);
        } catch (imgErr: any) {
          console.warn(`[MIGRATION] Non-critical warning migrating images for ${local.name}:`, imgErr.message);
        }
      }

      // Migrate product colors if present
      if (local.colors && local.colors.length > 0) {
        try {
          const colorRows = local.colors.map((c: ProductColor) => ({
            product_id: insertedId,
            name: c.name,
            hex_code: c.hex,
            is_available: true,
          }));

          await supabase.from('product_colors').insert(colorRows);
        } catch (colErr: any) {
          console.warn(`[MIGRATION] Non-critical warning migrating colors for ${local.name}:`, colErr.message);
        }
      }

      migratedCount++;
      itemsLog.push({
        name: local.name,
        slug: cleanSlug,
        status: 'migrated',
      });
    } catch (itemErr: any) {
      console.error(`[MIGRATION ERROR] Failed to migrate ${local.name}:`, itemErr.message || itemErr);
      errorsList.push({
        name: local.name,
        error: itemErr.message || 'Error desconocido al insertar en Supabase',
      });
      itemsLog.push({
        name: local.name,
        slug: cleanSlug,
        status: 'error',
        error: itemErr.message || 'Error al insertar',
      });
    }
  }

  // 3. Final verification count directly from Supabase
  const { count: finalCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const currentDbTotal = finalCount ?? (migratedCount + alreadyExistingCount);

  console.log(`[MIGRATION COMPLETE] Found: ${totalFound}, Migrated: ${migratedCount}, Already exists: ${alreadyExistingCount}, Total in Supabase: ${currentDbTotal}`);

  return {
    success: errorsList.length === 0,
    totalFound,
    migrated: migratedCount,
    alreadyExisting: alreadyExistingCount,
    errorsCount: errorsList.length,
    errors: errorsList,
    currentDbTotal,
    items: itemsLog,
  };
}
