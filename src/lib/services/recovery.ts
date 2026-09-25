import { supabase, isSupabaseConfigured } from '../supabase';
import { Product, ProductColor, ProductStatus } from '@/types';
import { slugify } from '../slug';
import { mapDbProductToProduct } from './products';

export interface StorageFolderImage {
  name: string;
  url: string;
  storagePath: string;
  createdAt?: string | null;
  size?: number;
}

export interface OrphanFolder {
  folderName: string;
  folderPath: string;
  imageCount: number;
  primaryImageUrl: string;
  primaryStoragePath: string;
  images: StorageFolderImage[];
  createdAt?: string | null;
  isAssociated: boolean;
  associatedProductId?: string;
  associatedProductName?: string;
}

const BUCKET_NAME = 'product-images';

/**
 * Known folder names mentioned by the user or discovered during development
 */
const KNOWN_CANDIDATE_FOLDERS = [
  'prod-1790281729393',
  'prod-1790284621856',
  'prod-1790284767939',
  'prod-1790284957183',
  'prod-1790285860941',
  'prod-1790285976879',
];

/**
 * Scans Supabase Storage 'product-images/products/' to find all folders and detect orphan ones.
 */
export async function scanOrphanFolders(): Promise<{
  allFolders: OrphanFolder[];
  orphanFolders: OrphanFolder[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      allFolders: [],
      orphanFolders: [],
      error: 'Supabase no está configurado. Revisa tus variables de entorno.',
    };
  }

  try {
    // 1. Fetch existing products and existing product_images to know which ones are already associated
    const { data: dbProducts } = await supabase
      .from('products')
      .select('id, name, slug');

    const { data: dbImages } = await supabase
      .from('product_images')
      .select('id, product_id, storage_path');

    const associatedFolders = new Map<string, { id: string; name: string }>();

    for (const p of dbProducts || []) {
      if (p.id) {
        associatedFolders.set(String(p.id).toLowerCase(), { id: String(p.id), name: p.name || p.slug });
      }
    }

    for (const img of dbImages || []) {
      if (img.storage_path) {
        // e.g. "products/prod-12345/image.png"
        const parts = img.storage_path.split('/');
        if (parts.length >= 2 && parts[0] === 'products') {
          const fName = parts[1].toLowerCase();
          const matchedProd = (dbProducts || []).find((p) => String(p.id) === String(img.product_id));
          associatedFolders.set(fName, {
            id: String(img.product_id),
            name: matchedProd?.name || fName,
          });
        }
      }
    }

    // 2. Discover folders from Storage
    const folderNamesSet = new Set<string>();

    // A. Query Supabase Storage list('products')
    const { data: storageList, error: listErr } = await supabase.storage
      .from(BUCKET_NAME)
      .list('products', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (!listErr && storageList && storageList.length > 0) {
      for (const item of storageList) {
        // If it's a folder (typically no id or id is null, or has no file extension)
        if (item.name && !item.name.includes('.')) {
          folderNamesSet.add(item.name.trim());
        }
      }
    }

    // B. Include known candidate folders in case Storage list RLS was restrictive
    for (const kf of KNOWN_CANDIDATE_FOLDERS) {
      folderNamesSet.add(kf);
    }

    const discoveredFolders: OrphanFolder[] = [];

    // 3. For each folder, list its image files
    for (const folderName of Array.from(folderNamesSet)) {
      const folderPath = `products/${folderName}`;

      const { data: files, error: filesErr } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath, {
          limit: 50,
          sortBy: { column: 'created_at', order: 'asc' },
        });

      // Filter only image files
      const validImageFiles = (files || []).filter(
        (f) => f.name && !f.name.startsWith('.') && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f.name)
      );

      // If no valid image files were found in this folder, skip it
      if (validImageFiles.length === 0) {
        continue;
      }

      const images: StorageFolderImage[] = validImageFiles.map((file) => {
        const storagePath = `${folderPath}/${file.name}`;
        const { data: urlData } = supabase!.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
        return {
          name: file.name,
          url: urlData.publicUrl,
          storagePath,
          createdAt: file.created_at,
          size: file.metadata?.size,
        };
      });

      const firstImg = images[0];
      const isAssoc = associatedFolders.has(folderName.toLowerCase());
      const assocData = associatedFolders.get(folderName.toLowerCase());

      discoveredFolders.push({
        folderName,
        folderPath,
        imageCount: images.length,
        primaryImageUrl: firstImg.url,
        primaryStoragePath: firstImg.storagePath,
        images,
        createdAt: firstImg.createdAt,
        isAssociated: isAssoc,
        associatedProductId: assocData?.id,
        associatedProductName: assocData?.name,
      });
    }

    const orphanFolders = discoveredFolders.filter((f) => !f.isAssociated);

    return {
      allFolders: discoveredFolders,
      orphanFolders,
    };
  } catch (err: any) {
    console.error('[RECOVERY ERROR] scanOrphanFolders:', err);
    return {
      allFolders: [],
      orphanFolders: [],
      error: err.message || 'Error al escanear carpetas de storage',
    };
  }
}

/**
 * Payload for creating a product from an orphan storage folder
 */
export interface RecoverProductPayload {
  folderName: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  categoryName?: string;
  description: string;
  status: ProductStatus;
  leadTime: string;
  isActive: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isOffer: boolean;
  isCustomizable: boolean;
  isFeatured: boolean;
  hasTieredPricing: boolean;
  price1: number;
  price6?: number;
  price12?: number;
  price24?: number;
  primaryStoragePath: string;
  images: { storagePath: string; url: string; isPrimary: boolean }[];
  colors?: { name: string; hex: string }[];
}

/**
 * Inserts the recovered product into public.products, public.product_images, and public.product_colors
 * without re-uploading any image file.
 */
export async function createProductFromStorageFolder(
  payload: RecoverProductPayload
): Promise<Product> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado');
  }

  const cleanSlug = slugify(payload.slug || payload.name);

  // 1. Insert product row using canonical GIVA 3D schema columns
  const productRow: Record<string, any> = {
    name: payload.name,
    slug: cleanSlug,
    category_slug: payload.categorySlug || null,
    description: payload.description || null,
    status: payload.status || 'disponible',
    lead_time: payload.leadTime || '1–2 días',
    is_active: payload.isActive,
    is_new: Boolean(payload.isNew),
    is_best_seller: Boolean(payload.isBestSeller),
    is_offer: Boolean(payload.isOffer),
    is_customizable: Boolean(payload.isCustomizable),
    is_featured: Boolean(payload.isFeatured),
    has_tiered_pricing: payload.hasTieredPricing,
    price_1: payload.price1,
    price_6: payload.price6 ?? null,
    price_12: payload.price12 ?? null,
    price_24: payload.price24 ?? null,
    primary_image: payload.primaryStoragePath,
  };

  const { data: insertedProduct, error: insertProdErr } = await supabase
    .from('products')
    .insert([productRow])
    .select()
    .single();

  if (insertProdErr) {
    console.error('[RECOVERY ERROR] Insert product failed:', insertProdErr);
    throw new Error(`Error al insertar producto: ${insertProdErr.message}`);
  }

  const newProductId = String(insertedProduct.id);

  // 2. Insert image rows into public.product_images
  if (payload.images && payload.images.length > 0) {
    const imageRows = payload.images.map((img, idx) => ({
      product_id: newProductId,
      storage_path: img.storagePath,
      image_url: img.url,
      is_primary: img.storagePath === payload.primaryStoragePath || idx === 0,
      sort_order: idx,
    }));

    const { error: insertImgsErr } = await supabase
      .from('product_images')
      .insert(imageRows);

    if (insertImgsErr) {
      console.warn('[RECOVERY] Warning: Could not insert image relations:', insertImgsErr.message);
    }
  }

  // 3. Insert color rows into public.product_colors
  if (payload.colors && payload.colors.length > 0) {
    const colorRows = payload.colors.map((c) => ({
      product_id: newProductId,
      name: c.name,
      hex_code: c.hex,
      is_available: true,
    }));

    const { error: insertColsErr } = await supabase
      .from('product_colors')
      .insert(colorRows);

    if (insertColsErr) {
      console.warn('[RECOVERY] Warning: Could not insert color relations:', insertColsErr.message);
    }
  }

  console.log(`[RECOVERY SUCCESS] Recovered product "${payload.name}" with ID ${newProductId}`);
  return mapDbProductToProduct(insertedProduct);
}
