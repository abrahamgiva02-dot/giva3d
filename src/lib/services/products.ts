import { supabase, isSupabaseConfigured } from '../supabase';
import { Product, ProductColor, ProductStatus, ProductImageItem } from '@/types';
import { slugify } from '../slug';
import { INITIAL_CATEGORIES } from '../data/categories';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

/**
 * Builds a public URL for an image stored in Supabase Storage bucket 'product-images'
 */
function resolveStorageUrl(pathOrUrl?: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.replace(/^\/+/, '');
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${cleanPath}`;
}

/**
 * Maps a database row from public.products (and joined tables) to domain Product object.
 * Adapts to both GIVA 3D schema and legacy database columns.
 */
export function mapDbProductToProduct(row: any, images: any[] = [], colors: any[] = []): Product {
  const resolvedImages: string[] = [];
  let primaryImage = '';

  // Extract from joined or provided product_images
  const allImages = (row.product_images && Array.isArray(row.product_images))
    ? row.product_images
    : images;

  if (allImages.length > 0) {
    const sortedImages = [...allImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const img of sortedImages) {
      const url = resolveStorageUrl(img.storage_path || img.image_url);
      if (url) {
        resolvedImages.push(url);
        if (img.is_primary && !primaryImage) {
          primaryImage = url;
        }
      }
    }
  }

  // Fallback to row.primary_image or row.image_url if present
  if (!primaryImage) {
    if (row.primary_image) {
      primaryImage = resolveStorageUrl(row.primary_image);
    } else if (row.image_url) {
      primaryImage = resolveStorageUrl(row.image_url);
    } else if (resolvedImages.length > 0) {
      primaryImage = resolvedImages[0];
    }
  }

  if (primaryImage && !resolvedImages.includes(primaryImage)) {
    resolvedImages.unshift(primaryImage);
  }

  // Extract colors from joined or provided product_colors
  const allColors = (row.product_colors && Array.isArray(row.product_colors))
    ? row.product_colors
    : colors;

  const resolvedColors: ProductColor[] = allColors.map((c: any) => ({
    name: c.name || 'Color',
    hex: c.hex_code || c.hex || '#18181b',
  }));

  // Resolve category
  const categoryId = row.category_id ? String(row.category_id) : 'cat-1';
  let categorySlug = row.category_slug || (row.categories?.slug) || '';
  let categoryName = row.category_name || (row.categories?.name) || '';

  if (!categorySlug && categoryId) {
    const matchedCategory = INITIAL_CATEGORIES.find((c) => c.id === categoryId);
    if (matchedCategory) {
      categorySlug = matchedCategory.slug;
      categoryName = matchedCategory.name;
    }
  }

  if (!categorySlug) {
    categorySlug = 'juguetes-figuras';
    categoryName = 'Juguetes y figuras';
  }

  // Resolve pricing
  const price1 = typeof row.price_1 === 'number'
    ? row.price_1
    : parseFloat(row.price_1 || '0') || 0;

  const price6 = typeof row.price_6 === 'number'
    ? row.price_6
    : row.price_6 ? parseFloat(row.price_6) : undefined;

  const price12 = typeof row.price_12 === 'number'
    ? row.price_12
    : row.price_12 ? parseFloat(row.price_12) : undefined;

  const price24 = typeof row.price_24 === 'number'
    ? row.price_24
    : row.price_24 ? parseFloat(row.price_24) : undefined;

  // Resolve active status
  const isActive = row.is_active !== undefined && row.is_active !== null ? Boolean(row.is_active) : true;

  // Name & Slug
  const name = row.name || 'Producto 3D';
  const slug = slugify(row.slug || name);

  return {
    id: String(row.id),
    name,
    slug,
    categoryId,
    categorySlug,
    categoryName,
    description: row.description || '',
    status: (row.status as ProductStatus) || 'disponible',
    leadTime: row.lead_time || '1–2 días',
    isActive,
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    isOffer: Boolean(row.is_offer),
    isCustomizable: Boolean(row.is_customizable),
    isFeatured: Boolean(row.is_featured),
    hasTieredPricing: row.has_tiered_pricing !== undefined ? Boolean(row.has_tiered_pricing) : true,
    price1,
    price6,
    price12,
    price24,
    primaryImage,
    images: resolvedImages,
    colors: resolvedColors.length > 0 ? resolvedColors : undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Builds a database payload compatible with the canonical GIVA 3D schema.
 * Strictly includes only valid columns and excludes legacy/non-existent columns.
 */
function buildProductDbPayload(product: Partial<Product>): Record<string, any> {
  const payload: Record<string, any> = {};

  if (product.name !== undefined) payload.name = product.name.trim();
  if (product.slug !== undefined) payload.slug = slugify(product.slug);
  if (product.categorySlug !== undefined) payload.category_slug = product.categorySlug;
  if (product.description !== undefined) payload.description = product.description.trim();
  if (product.status !== undefined) payload.status = product.status;
  if (product.leadTime !== undefined) payload.lead_time = product.leadTime.trim();

  if (product.isActive !== undefined) payload.is_active = Boolean(product.isActive);
  if (product.isNew !== undefined) payload.is_new = Boolean(product.isNew);
  if (product.isBestSeller !== undefined) payload.is_best_seller = Boolean(product.isBestSeller);
  if (product.isOffer !== undefined) payload.is_offer = Boolean(product.isOffer);
  if (product.isCustomizable !== undefined) payload.is_customizable = Boolean(product.isCustomizable);
  if (product.isFeatured !== undefined) payload.is_featured = Boolean(product.isFeatured);

  if (product.hasTieredPricing !== undefined) payload.has_tiered_pricing = Boolean(product.hasTieredPricing);
  if (product.price1 !== undefined) {
    payload.price_1 = typeof product.price1 === 'number' ? product.price1 : parseFloat(String(product.price1)) || 0;
  }
  if (product.price6 !== undefined) {
    payload.price_6 = product.price6 !== null && product.price6 !== undefined
      ? (typeof product.price6 === 'number' ? product.price6 : parseFloat(String(product.price6)))
      : null;
  }
  if (product.price12 !== undefined) {
    payload.price_12 = product.price12 !== null && product.price12 !== undefined
      ? (typeof product.price12 === 'number' ? product.price12 : parseFloat(String(product.price12)))
      : null;
  }
  if (product.price24 !== undefined) {
    payload.price_24 = product.price24 !== null && product.price24 !== undefined
      ? (typeof product.price24 === 'number' ? product.price24 : parseFloat(String(product.price24)))
      : null;
  }
  if (product.primaryImage !== undefined) {
    let pImg = product.primaryImage;
    if (pImg.includes('/storage/v1/object/public/product-images/')) {
      pImg = pImg.split('/storage/v1/object/public/product-images/')[1];
    }
    payload.primary_image = pImg;
  }

  // NOTE: Strictly avoid adding: category_id, price, unit_price, base_price, visibility, active, model
  return payload;
}

/**
 * Executes a Supabase insert or update query, automatically stripping any column
 * that the remote Supabase schema cache doesn't recognize (error PGRST204).
 */
async function executeWithProductColumnFallback<T>(
  action: (payload: Record<string, any>) => PromiseLike<{ data: any; error: any }>,
  initialPayload: Record<string, any>
): Promise<any> {
  let currentPayload = { ...initialPayload };

  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await action(currentPayload);

    if (!error) {
      return data;
    }

    // Detect missing column in schema cache:
    const match = error.message?.match(
      /Could not find the '([^']+)' column of 'products' in the schema cache/i
    );

    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[SUPABASE PRODUCTS] Column '${missingCol}' not found in schema cache. Retrying without it.`);
      delete currentPayload[missingCol];
      continue;
    }

    // Any other error is thrown
    console.error('[SUPABASE PRODUCTS ERROR]', error.message || error);
    throw error;
  }

  throw new Error('No se pudo completar la operación en la tabla products tras varios intentos.');
}

/**
 * Fetches all products from Supabase including product_images and product_colors.
 */
export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[SUPABASE PRODUCTS] Supabase client is not configured');
    return [];
  }

  try {
    // 1. Try querying products with joined relations
    let { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colors(*)');

    // 2. If relation join fails (e.g. Foreign Key difference), fallback to flat select
    if (error) {
      console.warn('[SUPABASE PRODUCTS] Joined query failed, retrying with flat query:', error.message);
      const fallback = await supabase.from('products').select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('[SUPABASE PRODUCTS ERROR]', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[SUPABASE PRODUCTS] loaded 0 products (empty table)');
      return [];
    }

    const mapped = data.map((row) => mapDbProductToProduct(row));
    console.log(`[SUPABASE PRODUCTS] loaded ${mapped.length} products`);
    return mapped;
  } catch (err: any) {
    console.error('[SUPABASE PRODUCTS ERROR]', err.message || err);
    return [];
  }
}

/**
 * Fetches only active products for the public catalog
 */
export async function fetchActiveProducts(): Promise<Product[]> {
  const all = await fetchProducts();
  return all.filter((p) => p.isActive);
}

/**
 * Fetches a single product by its slug
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const cleanSlug = slugify(slug);

    // Try exact slug match
    let { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colors(*)')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (error || !data) {
      // Fallback: try raw slug
      const fallback = await supabase
        .from('products')
        .select('*, product_images(*), product_colors(*)')
        .eq('slug', slug)
        .maybeSingle();
      data = fallback.data;
    }

    if (!data) {
      console.warn(`[SUPABASE PRODUCTS] Product not found with slug: ${slug}`);
      return null;
    }

    return mapDbProductToProduct(data);
  } catch (err: any) {
    console.error('[SUPABASE PRODUCTS ERROR] fetchProductBySlug:', err.message || err);
    return null;
  }
}

/**
 * Fetches a single product by its UUID id directly from Supabase
 */
export async function fetchProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    let { data, error } = await supabase
      .from('products')
      .select('*, product_images(*), product_colors(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      // Fallback flat query if join fails
      const fallback = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      data = fallback.data;
    }

    if (!data) {
      console.warn(`[SUPABASE PRODUCTS] Product not found with id: ${id}`);
      return null;
    }

    return mapDbProductToProduct(data);
  } catch (err: any) {
    console.error('[SUPABASE PRODUCTS ERROR] fetchProductById:', err.message || err);
    return null;
  }
}

/**
 * Creates a product in Supabase including its images and colors.
 */
export async function createProductInDb(productData: Omit<Product, 'id'>): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado');
  }

  const payload = buildProductDbPayload(productData);

  // 1. Insert product row
  const insertedRow = await executeWithProductColumnFallback(
    (pl) => supabase!.from('products').insert([pl]).select().single(),
    payload
  );

  const productId = String(insertedRow.id);

  // 2. Insert product images if provided
  const images = productData.images || [];
  if (images.length > 0) {
    try {
      const imageRows = images.map((url, index) => ({
        product_id: productId,
        storage_path: url.includes('/storage/v1/object/public/product-images/')
          ? url.split('/storage/v1/object/public/product-images/')[1]
          : url,
        is_primary: url === productData.primaryImage || index === 0,
        sort_order: index,
      }));

      await supabase.from('product_images').insert(imageRows);
    } catch (imgErr) {
      console.warn('[SUPABASE PRODUCTS] Could not insert images into product_images:', imgErr);
    }
  }

  // 3. Insert product colors if provided
  const colors = productData.colors || [];
  if (colors.length > 0) {
    try {
      const colorRows = colors.map((c) => ({
        product_id: productId,
        name: c.name,
        hex_code: c.hex,
      }));

      await supabase.from('product_colors').insert(colorRows);
    } catch (colErr) {
      console.warn('[SUPABASE PRODUCTS] Could not insert colors into product_colors:', colErr);
    }
  }

  return mapDbProductToProduct(insertedRow);
}

/**
 * Updates an existing product in Supabase.
 */
export async function updateProductInDb(id: string, updates: Partial<Product>): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    const errorMsg = 'Supabase no está configurado en las variables de entorno.';
    console.error('[PRODUCT UPDATE ERROR]', errorMsg);
    throw new Error(errorMsg);
  }

  const payload = buildProductDbPayload(updates);

  // Requisite log:
  console.log('[PRODUCT UPDATE PAYLOAD]', { id, payload });

  try {
    const updatedRow = await executeWithProductColumnFallback(
      (pl) => supabase!.from('products').update(pl).eq('id', id).select().single(),
      payload
    );

    if (!updatedRow) {
      const notFoundErr = new Error(`No se encontró el producto con ID ${id} para actualizar en Supabase.`);
      console.error('[PRODUCT UPDATE ERROR]', notFoundErr.message);
      throw notFoundErr;
    }

    // Update images if provided
    if (updates.images && Array.isArray(updates.images)) {
      try {
        await supabase.from('product_images').delete().eq('product_id', id);

        const imageRows = updates.images.map((url, index) => ({
          product_id: id,
          storage_path: url.includes('/storage/v1/object/public/product-images/')
            ? url.split('/storage/v1/object/public/product-images/')[1]
            : url,
          is_primary: url === updates.primaryImage || index === 0,
          sort_order: index,
        }));

        if (imageRows.length > 0) {
          await supabase.from('product_images').insert(imageRows);
        }
      } catch (imgErr) {
        console.warn('[SUPABASE PRODUCTS] Error al actualizar product_images:', imgErr);
      }
    }

    // Update colors if provided
    if (updates.colors !== undefined) {
      try {
        await supabase.from('product_colors').delete().eq('product_id', id);
        if (Array.isArray(updates.colors) && updates.colors.length > 0) {
          const colorRows = updates.colors.map((c) => ({
            product_id: id,
            name: c.name,
            hex_code: c.hex,
          }));
          await supabase.from('product_colors').insert(colorRows);
        }
      } catch (colErr) {
        console.warn('[SUPABASE PRODUCTS] Error al actualizar product_colors:', colErr);
      }
    }

    // Re-fetch fresh product with full relations
    const freshProduct = await fetchProductById(id);
    const result = freshProduct || mapDbProductToProduct(updatedRow);

    // Requisite log:
    console.log('[PRODUCT UPDATE SUCCESS]', result);
    return result;
  } catch (err: any) {
    // Requisite log:
    console.error('[PRODUCT UPDATE ERROR]', err?.message || err);
    throw err;
  }
}

/**
 * Deletes a product from Supabase.
 */
export async function deleteProductFromDb(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado');
  }

  try {
    await supabase.from('product_images').delete().eq('product_id', id);
    await supabase.from('product_colors').delete().eq('product_id', id);
  } catch (relErr) {
    console.warn('[SUPABASE PRODUCTS] Non-fatal error deleting related rows:', relErr);
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error('[SUPABASE PRODUCTS ERROR] deleteProductFromDb:', error.message);
    throw error;
  }
}

/**
 * Toggles product active / published status
 */
export async function toggleProductActiveInDb(id: string, currentActive: boolean): Promise<boolean> {
  const newActive = !currentActive;
  await updateProductInDb(id, { isActive: newActive });
  return newActive;
}
