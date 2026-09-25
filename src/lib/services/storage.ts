import { supabase, isSupabaseConfigured } from '../supabase';

export const PRODUCT_IMAGES_BUCKET = 'product-images';

/**
 * Uploads a physical file from the user's PC to Supabase Storage bucket 'product-images'
 * path format: products/{productId}/{timestamp}-{sanitizedFilename}
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<{ imageUrl: string; storagePath: string }> {
  // Sanitize filename to avoid weird characters in storage path
  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

  const timestamp = Date.now();
  const storagePath = `products/${productId}/${timestamp}-${sanitizedName}`;

  // Verify Supabase configuration before attempting upload
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase Storage no está configurado. Por favor define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local para poder subir imágenes.'
    );
  }

  // Upload directly to Supabase Storage bucket 'product-images'
  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (uploadError) {
    console.error('Error uploading image to Supabase Storage:', uploadError);
    throw new Error(`Error al subir imagen a Supabase Storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return {
    imageUrl: urlData.publicUrl,
    storagePath,
  };
}

/**
 * Uploads a physical banner image from PC to Supabase Storage bucket 'product-images'
 * path format: banners/{timestamp}-{sanitizedFilename}
 */
export async function uploadBannerImage(
  file: File
): Promise<{ imageUrl: string; storagePath: string }> {
  // Sanitize filename to avoid spaces and special characters
  const sanitizedName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

  const timestamp = Date.now();
  const storagePath = `banners/${timestamp}-${sanitizedName}`;

  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase Storage no está configurado. Por favor define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local para poder subir imágenes.'
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/webp',
    });

  if (uploadError) {
    console.error('Error uploading banner to Supabase Storage:', uploadError);
    throw new Error(`Error al subir imagen del banner: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(storagePath);

  return {
    imageUrl: urlData.publicUrl,
    storagePath,
  };
}

/**
 * Removes a file from Supabase Storage bucket 'product-images'
 * to avoid leaving orphan files when images are deleted
 */
export async function deleteProductImageFromStorage(storagePath?: string): Promise<boolean> {
  if (!storagePath) return true;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .remove([storagePath]);

      if (error) {
        console.warn('Could not delete image from Supabase Storage:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Error deleting image from Supabase Storage:', err);
      return false;
    }
  }

  return true;
}
