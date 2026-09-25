'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Product, ProductColor, ProductStatus, ProductImageItem } from '@/types';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { slugify } from '@/lib/slug';
import ProductImageUploader from './ProductImageUploader';
import { uploadProductImage, deleteProductImageFromStorage } from '@/lib/services/storage';
import { createProductInDb, updateProductInDb } from '@/lib/services/products';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ProductFormProps {
  initialProduct?: Product;
  isEditing?: boolean;
}

export default function ProductForm({ initialProduct, isEditing = false }: ProductFormProps) {
  const router = useRouter();
  const { categories, addProduct, updateProduct } = useCatalogStore();

  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || categories[0]?.id || '');
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status || 'disponible');
  const [leadTime, setLeadTime] = useState(initialProduct?.leadTime || '1–2 días');
  
  // Visibility and Tags
  const [isActive, setIsActive] = useState(initialProduct !== undefined ? initialProduct.isActive : true);
  const [isNew, setIsNew] = useState(initialProduct?.isNew || false);
  const [isBestSeller, setIsBestSeller] = useState(initialProduct?.isBestSeller || false);
  const [isOffer, setIsOffer] = useState(initialProduct?.isOffer || false);
  const [isCustomizable, setIsCustomizable] = useState(initialProduct?.isCustomizable || false);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);

  // Pricing (All are unit prices S/ c/u)
  const [hasTieredPricing, setHasTieredPricing] = useState(
    initialProduct !== undefined ? initialProduct.hasTieredPricing : true
  );
  const [price1, setPrice1] = useState(initialProduct?.price1?.toString() || '10.00');
  const [price6, setPrice6] = useState(initialProduct?.price6 !== undefined && initialProduct?.price6 !== null ? initialProduct.price6.toString() : '8.50');
  const [price12, setPrice12] = useState(initialProduct?.price12 !== undefined && initialProduct?.price12 !== null ? initialProduct.price12.toString() : '7.50');
  const [price24, setPrice24] = useState(initialProduct?.price24 !== undefined && initialProduct?.price24 !== null ? initialProduct.price24.toString() : '6.00');

  // Colors / Variants
  const [colors, setColors] = useState<ProductColor[]>(
    initialProduct?.colors || [
      { name: 'Negro', hex: '#18181b' },
      { name: 'Blanco', hex: '#ffffff' },
      { name: 'Morado GIVA', hex: '#7c3aed' },
    ]
  );
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#7c3aed');

  // Images state (ProductImageItem[])
  const [images, setImages] = useState<ProductImageItem[]>(() => {
    if (initialProduct?.productImages && initialProduct.productImages.length > 0) {
      return initialProduct.productImages;
    }
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((url, idx) => ({
        id: `img-${idx}-${Date.now()}`,
        productId: initialProduct.id,
        imageUrl: url,
        isPrimary: url === initialProduct.primaryImage || idx === 0,
        sortOrder: idx + 1,
      }));
    }
    return [];
  });

  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-generate slug from name if creating
  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  };

  const handleSlugBlur = () => {
    setSlug(slugify(slug));
  };

  const handleAddColor = () => {
    if (newColorName.trim()) {
      setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
      setNewColorName('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleQueueDeleteStoragePath = (storagePath: string) => {
    setPendingDeletions((prev) => [...prev, storagePath]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      // Validation: at least one image is recommended
      if (images.length === 0) {
        setFormError('Por favor añade al menos una fotografía para el producto.');
        setIsSubmitting(false);
        return;
      }

      const selectedCat = categories.find((c) => c.id === categoryId);
      const targetProductId = isEditing && initialProduct ? initialProduct.id : `prod-${Date.now()}`;

      // 1. Process and upload any new images that have a physical File attached
      const processedImages: ProductImageItem[] = [];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item.file) {
          // Upload file directly to Supabase Storage bucket 'product-images'
          const { imageUrl, storagePath } = await uploadProductImage(targetProductId, item.file);
          processedImages.push({
            id: `img-${Date.now()}-${i}`,
            productId: targetProductId,
            imageUrl,
            storagePath,
            isPrimary: item.isPrimary,
            sortOrder: i + 1,
          });
        } else {
          // Existing image
          processedImages.push({
            ...item,
            sortOrder: i + 1,
          });
        }
      }

      // 2. Ensure exactly one image is marked as primary
      let primaryItem = processedImages.find((img) => img.isPrimary);
      if (!primaryItem && processedImages.length > 0) {
        processedImages[0].isPrimary = true;
        primaryItem = processedImages[0];
      }

      const primaryImageUrl = primaryItem ? primaryItem.imageUrl : '';
      const allImageUrls = processedImages.map((img) => img.imageUrl);

      // Revoke any temporary object URLs
      images.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
      });

      // 3. Remove physical files from Supabase Storage for deleted images
      if (pendingDeletions.length > 0) {
        await Promise.all(pendingDeletions.map((path) => deleteProductImageFromStorage(path)));
      }

      // 4. Build product payload with normalized slug
      const cleanSlug = slugify(slug) || slugify(name) || `producto-${Date.now()}`;

      const productPayload: Omit<Product, 'id'> = {
        name: name.trim(),
        slug: cleanSlug,
        categoryId,
        categorySlug: selectedCat?.slug || 'varios',
        categoryName: selectedCat?.name || 'General',
        description: description.trim(),
        status,
        leadTime: leadTime.trim() || undefined,
        isActive,
        isNew,
        isBestSeller,
        isOffer,
        isCustomizable,
        isFeatured,
        hasTieredPricing,
        price1: parseFloat(price1) || 0,
        price6: hasTieredPricing && price6 ? parseFloat(price6) : undefined,
        price12: hasTieredPricing && price12 ? parseFloat(price12) : undefined,
        price24: hasTieredPricing && price24 ? parseFloat(price24) : undefined,
        primaryImage: primaryImageUrl,
        images: allImageUrls,
        productImages: processedImages,
        colors: colors.length > 0 ? colors : undefined,
      };

      let savedProduct: Product | null = null;
      if (isSupabaseConfigured) {
        if (isEditing && initialProduct) {
          savedProduct = await updateProductInDb(initialProduct.id, productPayload);
        } else {
          savedProduct = await createProductInDb(productPayload);
        }
      }

      if (isEditing && initialProduct) {
        const finalProduct = savedProduct || { ...productPayload, id: initialProduct.id };
        updateProduct(initialProduct.id, finalProduct);
        setToastMessage('Producto actualizado correctamente en Supabase');
        setIsSubmitting(false);
        // Scroll to top to see message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          router.push('/admin/productos');
        }, 1000);
      } else {
        const finalProduct = savedProduct || { ...productPayload, id: `prod-${Date.now()}` };
        addProduct(finalProduct);
        setToastMessage('Producto creado correctamente en Supabase');
        setIsSubmitting(false);
        setTimeout(() => {
          router.push('/admin/productos');
        }, 1000);
      }
    } catch (err: any) {
      console.error('[PRODUCT SAVE ERROR]', err);
      setFormError(err.message || 'Ocurrió un error al guardar el producto.');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16">
      
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/productos"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2.5 rounded-xl border border-slate-200 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Productos</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:opacity-95 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios del Producto' : 'Crear Producto'}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Toast */}
      {formError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">
          {isEditing ? `Editar: ${initialProduct?.name}` : 'Nuevo Producto en Catálogo'}
        </h2>

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Lagartija Articulada 3D Flexible"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-500 font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              URL Amigable (Slug) *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onBlur={handleSlugBlur}
              placeholder="lagartija-articulada-3d"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Categoría *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Descripción detallada
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla las características de la pieza, acabados, articulaciones y recomendaciones de uso..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-purple-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Availability & Lead Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Estado de Disponibilidad
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-purple-500"
            >
              <option value="disponible">Disponible (En stock para entrega inmediata)</option>
              <option value="bajo_pedido">Fabricación bajo pedido</option>
              <option value="no_disponible">Temporalmente no disponible</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tiempo Estimado de Fabricación
            </label>
            <input
              type="text"
              value={leadTime}
              onChange={(e) => setLeadTime(e.target.value)}
              placeholder="Ej: 1–2 días"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* PRICING SECTION (CRITICAL: ALL ARE UNIT PRICES) */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Estructura de Precios por Volumen (Soles S/)
              </h3>
              <p className="text-xs text-slate-400">
                Configura precios unitarios según los 4 niveles de escala requeridos (precio por unidad, NO total de lote).
              </p>
            </div>

            {/* Toggle tiered pricing */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={hasTieredPricing}
                onChange={(e) => setHasTieredPricing(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Activar escalas mayoristas
              </span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {/* 1 Unit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                1 unidad * (c/u)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.10"
                  required
                  value={price1}
                  onChange={(e) => setPrice1(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 6 Units */}
            <div className={!hasTieredPricing ? 'opacity-40 pointer-events-none' : ''}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                6 unidades (c/u)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.10"
                  disabled={!hasTieredPricing}
                  value={price6}
                  onChange={(e) => setPrice6(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 12 Units */}
            <div className={!hasTieredPricing ? 'opacity-40 pointer-events-none' : ''}>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                12 unidades (c/u)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.10"
                  disabled={!hasTieredPricing}
                  value={price12}
                  onChange={(e) => setPrice12(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 24+ Units */}
            <div className={!hasTieredPricing ? 'opacity-40 pointer-events-none' : ''}>
              <label className="block text-[11px] font-bold text-emerald-700 uppercase mb-1">
                24+ unidades (c/u)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.10"
                  disabled={!hasTieredPricing}
                  value={price24}
                  onChange={(e) => setPrice24(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* IMAGES UPLOADER SECTION (SUPABASE STORAGE) */}
        <div className="pt-6 border-t border-slate-100">
          <ProductImageUploader
            images={images}
            onChange={setImages}
            onDeleteStoragePath={handleQueueDeleteStoragePath}
            disabled={isSubmitting}
          />
        </div>

        {/* TAGS / BADGES & VISIBILITY */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Etiquetas y Visibilidad</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Publicado en tienda</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isOffer}
                onChange={(e) => setIsOffer(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Etiqueta OFERTA</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Etiqueta MÁS VENDIDO</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="w-4 h-4 text-cyan-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Etiqueta NUEVO</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isCustomizable}
                onChange={(e) => setIsCustomizable(e.target.checked)}
                className="w-4 h-4 text-slate-700 rounded"
              />
              <span className="text-xs font-bold text-slate-800">PERSONALIZABLE</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Destacado Home</span>
            </label>
          </div>
        </div>

        {/* COLORS / VARIANTS */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Colores / Variantes disponibles</h3>
          
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(i)}
                  className="text-slate-400 hover:text-rose-500 ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add color input */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 max-w-md">
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Nombre de color (ej: Verde Lima)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddColor}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Bottom Submit */}
        <div className="pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-brand text-white font-black text-sm shadow-xl shadow-purple-600/25 hover:opacity-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando Producto...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Guardar Cambios del Producto' : 'Publicar Producto'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </form>
  );
}
