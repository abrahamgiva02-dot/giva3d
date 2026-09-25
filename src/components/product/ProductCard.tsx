'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency, getLowestUnitPriceInfo } from '@/lib/pricing';
import { useCartStore } from '@/lib/store/cart';
import { slugify } from '@/lib/slug';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { lowestPrice, tierLabel, hasWholesale } = getLowestUnitPriceInfo(product);
  const productSlug = slugify(product.slug || product.name);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].name : undefined;
    addItem(product, 1, defaultColor);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden">
      
      {/* Badges / Labels Container */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
        {product.isOffer && (
          <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950 rounded-full shadow-sm">
            OFERTA
          </span>
        )}
        {product.isBestSeller && (
          <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-gradient-brand text-white rounded-full shadow-sm">
            MÁS VENDIDO
          </span>
        )}
        {product.isNew && (
          <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-cyan-500 text-white rounded-full shadow-sm">
            NUEVO
          </span>
        )}
        {product.isCustomizable && (
          <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide bg-slate-900/80 backdrop-blur-xs text-slate-100 rounded-full shadow-sm">
            PERSONALIZABLE
          </span>
        )}
      </div>

      {/* Image Container with link */}
      <Link 
        href={`/producto/${productSlug}`} 
        className="relative w-full aspect-square bg-slate-100 overflow-hidden block"
      >
        <Image
          src={product.primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        
        {/* Availability tag overlay */}
        {product.status === 'bajo_pedido' && (
          <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            Bajo pedido {product.leadTime ? `(${product.leadTime})` : ''}
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 justify-between">
        <div>
          {/* Category */}
          <div className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-1">
            {product.categoryName || product.categorySlug}
          </div>

          {/* Title */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-purple-700 line-clamp-2 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Color previews if available */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Colores:</span>
              <div className="flex -space-x-1">
                {product.colors.slice(0, 4).map((c, i) => (
                  <span
                    key={i}
                    className="w-3.5 h-3.5 rounded-full border border-white shadow-xs inline-block"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[10px] text-slate-400 pl-1.5">
                    +{product.colors.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & CTA Section */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          
          {/* Price breakdown (Marketplace strategy: Lowest Unit Price highlighted) */}
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-sans tracking-tight">
                {formatCurrency(lowestPrice)}
              </span>
              <span className="text-xs font-bold text-purple-700">
                c/u
              </span>
            </div>

            {/* Condition label */}
            {hasWholesale ? (
              <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                {tierLabel}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Precio unitario
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            <Link
              href={`/producto/${productSlug}`}
              className="col-span-3 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Ver detalle</span>
            </Link>

            <button
              type="button"
              onClick={handleQuickAdd}
              className="col-span-2 flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
              title="Agregar al carrito"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>+1</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
