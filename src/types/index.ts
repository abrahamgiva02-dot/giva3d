export type ProductStatus = 'disponible' | 'bajo_pedido' | 'no_disponible';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ProductImageItem {
  id: string;
  productId?: string;
  imageUrl: string;
  storagePath?: string;
  isPrimary: boolean;
  sortOrder: number;
  file?: File;
  previewUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  categoryName?: string;
  description: string;
  status: ProductStatus;
  leadTime?: string; // e.g. "1–2 días"
  isActive: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  isOffer?: boolean;
  isCustomizable?: boolean;
  isFeatured?: boolean;
  
  // Tiered Pricing
  hasTieredPricing: boolean;
  price1: number;      // 1 unit price
  price6?: number;     // 6+ units price per unit
  price12?: number;    // 12+ units price per unit
  price24?: number;    // 24+ units price per unit

  images: string[];
  primaryImage: string;
  productImages?: ProductImageItem[];
  colors?: ProductColor[];
  createdAt?: string;
}

export type BannerDisplayMode = 'with_content' | 'image_only';
export type BannerImagePosition = 'left' | 'center' | 'right';
export type BannerImageFit = 'cover' | 'contain';

export interface Banner {
  id: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  storagePath?: string;
  displayMode?: BannerDisplayMode;
  imagePosition?: BannerImagePosition;
  imageFit?: BannerImageFit;
  imageZoom?: number;
  imagePositionX?: number;
  imagePositionY?: number;
}

export interface CartItem {
  id: string; // generated unique key e.g. `${productId}-${selectedColor}`
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  unitPrice: number;
  subtotal: number;
}

export interface TierInfo {
  tierLabel: string;
  minUnits: number;
  unitPrice: number;
  savingsPercent?: number;
}
