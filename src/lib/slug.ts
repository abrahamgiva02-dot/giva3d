/**
 * Converts a text string into a clean, URL-safe slug:
 * - lowercase
 * - trimmed
 * - removes diacritics / accents (tildes)
 * - replaces spaces, underscores and punctuation with single hyphens
 * - removes invalid characters
 * - strips leading and trailing hyphens
 *
 * Example:
 * "Soporte Celular Estilo Perrito" -> "soporte-celular-estilo-perrito"
 * "Mini Tiburón Articulado" -> "mini-tiburon-articulado"
 */
export function slugify(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // decompose characters with accents into base char + combining mark
    .replace(/[\u0300-\u036f]/g, '') // strip all combining accent marks
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except spaces and hyphens
    .replace(/[\s_]+/g, '-') // convert spaces and underscores to hyphens
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens
}

/**
 * Normalizes any existing slug or URL parameter (handles decodeURIComponent, spaces, tildes, etc.)
 */
export function normalizeSlug(slugOrParam: string): string {
  if (!slugOrParam) return '';
  try {
    const decoded = decodeURIComponent(slugOrParam);
    return slugify(decoded);
  } catch {
    return slugify(slugOrParam);
  }
}
