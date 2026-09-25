import { supabase, isSupabaseConfigured } from '../supabase';
import { Banner, BannerDisplayMode, BannerImagePosition } from '@/types';
import { deleteProductImageFromStorage } from './storage';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

/**
 * Maps a row from public.banners to domain Banner object
 * Handles both legacy column names (cta_text, active, sort_order, image_path)
 * and normalized column names (button_text, is_active, display_order, storage_path, display_mode, image_position).
 */
export function mapDbBannerToBanner(row: any): Banner {
  const storagePath = row.storage_path || row.image_path || undefined;

  let imageUrl = row.image_url;
  if (!imageUrl && row.image_path) {
    if (row.image_path.startsWith('http://') || row.image_path.startsWith('https://')) {
      imageUrl = row.image_path;
    } else {
      // Build public URL from Supabase Storage bucket 'product-images'
      const cleanPath = row.image_path.replace(/^\/+/, '');
      imageUrl = `${SUPABASE_URL}/storage/v1/object/public/product-images/${cleanPath}`;
    }
  }

  const displayMode: BannerDisplayMode =
    row.display_mode === 'image_only' ? 'image_only' : 'with_content';

  const imagePosition: BannerImagePosition =
    row.image_position === 'left' || row.image_position === 'right'
      ? row.image_position
      : 'center';

  const imageFit: 'cover' | 'contain' =
    row.image_fit === 'contain' ? 'contain' : 'cover';

  const imageZoom: number =
    typeof row.image_zoom === 'number'
      ? row.image_zoom
      : typeof row.image_zoom === 'string'
      ? parseFloat(row.image_zoom) || 1.0
      : 1.0;

  const imagePositionX: number =
    typeof row.image_position_x === 'number'
      ? row.image_position_x
      : typeof row.image_position_x === 'string'
      ? parseFloat(row.image_position_x) ?? 50
      : 50;

  const imagePositionY: number =
    typeof row.image_position_y === 'number'
      ? row.image_position_y
      : typeof row.image_position_y === 'string'
      ? parseFloat(row.image_position_y) ?? 50
      : 50;

  return {
    id: String(row.id),
    title: row.title ?? undefined,
    subtitle: row.subtitle ?? undefined,
    badge: row.badge_text ?? row.badge ?? undefined,
    badgeText: row.badge_text ?? row.badge ?? undefined,
    imageUrl: imageUrl || '',
    mobileImageUrl: row.mobile_image_url ?? undefined,
    buttonText: row.button_text ?? row.cta_text ?? undefined,
    buttonUrl: row.button_url ?? row.cta_url ?? row.link_url ?? undefined,
    linkUrl: row.button_url ?? row.cta_url ?? row.link_url ?? undefined,
    displayOrder:
      typeof row.sort_order === 'number'
        ? row.sort_order
        : typeof row.display_order === 'number'
        ? row.display_order
        : 0,
    isActive:
      row.is_active !== undefined
        ? Boolean(row.is_active)
        : row.active !== undefined
        ? Boolean(row.active)
        : true,
    storagePath,
    displayMode,
    imagePosition,
    imageFit,
    imageZoom,
    imagePositionX,
    imagePositionY,
  };
}

/**
 * Extracts relative storage path from a Supabase Storage URL
 */
function extractStoragePath(imageUrl?: string, storagePath?: string): string | undefined {
  if (storagePath) return storagePath;
  if (!imageUrl) return undefined;
  const match = imageUrl.match(/product-images\/(banners\/[^?]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return undefined;
}

/**
 * Builds a database payload compatible with both the original columns
 * and the expanded columns.
 */
function buildDbPayload(bannerData: Partial<Banner>): Record<string, any> {
  const payload: Record<string, any> = {};

  if (bannerData.title !== undefined) payload.title = bannerData.title || null;
  if (bannerData.subtitle !== undefined) payload.subtitle = bannerData.subtitle || null;

  const btnText = bannerData.buttonText || null;
  const btnUrl = bannerData.linkUrl || bannerData.buttonUrl || null;
  const activeVal = bannerData.isActive !== false;
  const sortVal = bannerData.displayOrder ?? 0;
  const pathVal = bannerData.storagePath || bannerData.imageUrl || null;

  // Real columns in existing user database:
  payload.cta_text = btnText;
  payload.cta_url = btnUrl;
  payload.active = activeVal;
  payload.sort_order = sortVal;
  if (pathVal) payload.image_path = pathVal;

  // Extended / normalized columns:
  payload.badge_text = bannerData.badge || bannerData.badgeText || null;
  payload.button_text = btnText;
  payload.button_url = btnUrl;
  payload.image_url = bannerData.imageUrl || null;
  payload.storage_path = bannerData.storagePath || null;
  payload.is_active = activeVal;
  payload.display_mode = bannerData.displayMode || 'with_content';
  payload.image_position = bannerData.imagePosition || 'center';
  payload.image_fit = bannerData.imageFit || 'cover';
  payload.image_zoom = typeof bannerData.imageZoom === 'number' ? bannerData.imageZoom : 1.0;
  payload.image_position_x = typeof bannerData.imagePositionX === 'number' ? bannerData.imagePositionX : 50;
  payload.image_position_y = typeof bannerData.imagePositionY === 'number' ? bannerData.imagePositionY : 50;

  return payload;
}

/**
 * Executes an insert or update query, automatically stripping any column
 * that the remote Supabase schema cache doesn't know yet (error PGRST204).
 */
async function executeWithColumnFallback<T>(
  action: (payload: Record<string, any>) => PromiseLike<{ data: any; error: any }>,
  initialPayload: Record<string, any>
): Promise<any> {
  let currentPayload = { ...initialPayload };

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await action(currentPayload);

    if (!error) {
      return data;
    }

    // Detect missing column in schema cache:
    const match = error.message?.match(
      /Could not find the '([^']+)' column of 'banners' in the schema cache/i
    );

    if (match && match[1]) {
      const missingColumn = match[1];
      console.warn(`[Supabase banners] Column '${missingColumn}' not found in schema cache. Retrying without it.`);
      delete currentPayload[missingColumn];
      continue;
    }

    // Any other error (e.g. auth permission, network) is thrown
    throw error;
  }

  throw new Error('No se pudo completar la operación en la tabla banners tras varios intentos.');
}

/**
 * Fetches all banners ordered by sort_order / display_order
 */
export async function fetchBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    // 1. Try ordering by sort_order
    let { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });

    // 2. If sort_order failed, fallback to display_order or default select
    if (error) {
      const fallback = await supabase
        .from('banners')
        .select('*');
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.warn('Error fetching banners from Supabase:', error.message);
      return [];
    }

    const mapped = (data || []).map(mapDbBannerToBanner);
    return mapped.sort((a, b) => a.displayOrder - b.displayOrder);
  } catch (err) {
    console.warn('Unexpected error fetching banners:', err);
    return [];
  }
}

/**
 * Fetches only active banners for the Home carousel
 */
export async function fetchActiveBanners(): Promise<Banner[]> {
  const allBanners = await fetchBanners();
  return allBanners.filter((b) => b.isActive);
}

/**
 * Creates a new banner record in public.banners
 */
export async function createBanner(bannerData: Omit<Banner, 'id'>): Promise<Banner> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado');
  }

  const payload = buildDbPayload(bannerData);

  const insertedData = await executeWithColumnFallback(
    (pl) => supabase!.from('banners').insert([pl]).select().single(),
    payload
  );

  return mapDbBannerToBanner(insertedData);
}

/**
 * Updates an existing banner record
 */
export async function updateBanner(id: string, updates: Partial<Banner>): Promise<Banner> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase no está configurado');
  }

  const payload = buildDbPayload(updates);

  const updatedData = await executeWithColumnFallback(
    (pl) => supabase!.from('banners').update(pl).eq('id', id).select().single(),
    payload
  );

  return mapDbBannerToBanner(updatedData);
}

/**
 * Toggles a banner's active state
 */
export async function toggleBannerActive(id: string, currentState: boolean): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return !currentState;
  }

  const newState = !currentState;
  const payload = { active: newState, is_active: newState };

  await executeWithColumnFallback(
    (pl) => supabase!.from('banners').update(pl).eq('id', id).select().single(),
    payload
  );

  return newState;
}

/**
 * Deletes a banner from Supabase DB and removes its image from storage
 */
export async function deleteBanner(
  id: string,
  storagePath?: string,
  imageUrl?: string
): Promise<void> {
  // 1. Delete from Supabase Database
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('banners').delete().eq('id', id);

    if (error) {
      console.error('Error deleting banner from Supabase:', error);
      throw new Error(`Error al eliminar banner: ${error.message}`);
    }
  }

  // 2. Remove file from storage
  const pathToClean = extractStoragePath(imageUrl, storagePath);
  if (pathToClean) {
    try {
      await deleteProductImageFromStorage(pathToClean);
    } catch (storageErr) {
      console.warn('Could not remove banner image file from storage:', storageErr);
    }
  }
}

/**
 * Updates display / sort orders for multiple banners in Supabase
 */
export async function updateBannersOrder(
  orderedBanners: { id: string; displayOrder: number }[]
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    await Promise.all(
      orderedBanners.map((item) => {
        const payload = {
          sort_order: item.displayOrder,
          display_order: item.displayOrder,
        };
        return executeWithColumnFallback(
          (pl) => supabase!.from('banners').update(pl).eq('id', item.id).select().single(),
          payload
        );
      })
    );
  } catch (err) {
    console.error('Error updating banner order in Supabase:', err);
  }
}
