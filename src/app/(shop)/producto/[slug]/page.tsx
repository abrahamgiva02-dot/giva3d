'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronRight, 
  ShoppingCart, 
  MessageCircle, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Layers,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { useCartStore } from '@/lib/store/cart';
import { calculateUnitPrice, formatCurrency } from '@/lib/pricing';
import { buildWhatsAppProductInquiryUrl } from '@/lib/config';
import PriceTierTable from '@/components/product/PriceTierTable';
import ProductCard from '@/components/product/ProductCard';
import { normalizeSlug, slugify } from '@/lib/slug';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params?.slug as string;
  const targetSlug = normalizeSlug(rawSlug);

  const { products, isHydrated } = useCatalogStore();
  const { addItem } = useCartStore();

  const product = useMemo(() => {
    if (!targetSlug && !rawSlug) return undefined;

    // 1. Exact match on slug
    const directMatch = products.find((p) => p.slug === targetSlug || p.slug === rawSlug);
    if (directMatch) return directMatch;

    // 2. Normalized match (in case product in store still has unnormalized slug)
    const normalizedMatch = products.find(
      (p) => slugify(p.slug) === targetSlug || slugify(p.name) === targetSlug
    );
    if (normalizedMatch) return normalizedMatch;

    // 3. Fallback: match by ID
    const idMatch = products.find((p) => p.id === rawSlug || p.id === targetSlug);
    if (idMatch) return idMatch;

    return undefined;
  }, [products, targetSlug, rawSlug]);

  // If the product was found but the current URL had spaces or was unnormalized, silently replace URL to clean canonical slug
  React.useEffect(() => {
    if (product && product.slug && rawSlug && decodeURIComponent(rawSlug) !== product.slug) {
      router.replace(`/producto/${product.slug}`);
    }
  }, [product, rawSlug, router]);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState(false);

  // Initialize selected image and color
  React.useEffect(() => {
    if (product) {
      setSelectedImage(product.primaryImage);
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0].name);
      }
    }
  }, [product]);

  if (!isHydrated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Producto no encontrado</h2>
        <p className="text-slate-500 mb-6">El producto que buscas no existe o ha sido retirado.</p>
        <Link
          href="/catalogo"
          className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-purple-700 transition-colors"
        >
          Volver al catálogo
        </Link>
      </div>
    );
  }

  // Calculate live unit price and total based on selected quantity
  const unitPrice = calculateUnitPrice(product, quantity);
  const totalPrice = unitPrice * quantity;

  // Quantity helpers
  const handleQuantityChange = (newVal: number) => {
    if (newVal >= 1) {
      setQuantity(newVal);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedColor || undefined);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const inquiryUrl = buildWhatsAppProductInquiryUrl(product.name, selectedColor);

  // Related products
  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id && p.isActive)
    .slice(0, 6);

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-8">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-purple-600 transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link href="/catalogo" className="hover:text-purple-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link href={`/categoria/${product.categorySlug}`} className="hover:text-purple-600 transition-colors">
          {product.categoryName || product.categorySlug}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/80 shadow-xs">
        
        {/* Left Col: Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
            <Image
              src={selectedImage || product.primaryImage}
              alt={product.name}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.isOffer && (
              <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                OFERTA
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 shrink-0 transition-all ${
                    (selectedImage || product.primaryImage) === img
                      ? 'border-purple-600 ring-2 ring-purple-300/30'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} miniatura ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <Truck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Envíos a todo el Perú</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0" />
              <span>Garantía de calidad GIVA 3D</span>
            </div>
          </div>
        </div>

        {/* Right Col: Product Info & Pricing Logic (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Category & Status Badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Link
                href={`/categoria/${product.categorySlug}`}
                className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full transition-colors"
              >
                {product.categoryName || product.categorySlug}
              </Link>

              {/* Status */}
              <div className="flex items-center gap-2">
                {product.status === 'disponible' && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Disponible
                  </span>
                )}
                {product.status === 'bajo_pedido' && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    Bajo pedido
                  </span>
                )}
                {product.leadTime && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {product.leadTime}
                  </span>
                )}
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Color / Acabado: <span className="text-purple-700">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedColor === c.name
                          ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-200'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tiered Pricing Table matrix */}
            <PriceTierTable
              product={product}
              currentQuantity={quantity}
              onSelectTier={(units) => setQuantity(units)}
            />

            {/* LIVE DYNAMIC PRICE DISPLAY */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950 text-white shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-300 font-semibold block">
                    Precio por Unidad aplicado:
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white font-sans">
                      {formatCurrency(unitPrice)}
                    </span>
                    <span className="text-xs text-cyan-300 font-bold">c/u</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-purple-300 font-semibold block">
                    Total ({quantity} {quantity === 1 ? 'unidad' : 'unidades'}):
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-sans mt-0.5">
                    {formatCurrency(totalPrice)}
                  </div>
                </div>
              </div>

              {/* Quantity Stepper inside price box */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-xs text-slate-300 font-medium">Seleccionar cantidad:</span>
                <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-14 text-center text-sm font-black text-white bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* CTAs: Add to cart & Consult WhatsApp */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-brand text-white font-black text-base hover:opacity-95 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>AGREGAR AL CARRITO</span>
              </button>

              <a
                href={inquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>CONSULTAR POR WHATSAPP</span>
              </a>

              {addedToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Producto agregado al carrito con éxito!</span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Productos Relacionados
            </h3>
            <Link
              href={`/categoria/${product.categorySlug}`}
              className="text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-900"
            >
              Ver más en esta categoría →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
