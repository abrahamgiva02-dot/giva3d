'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  CheckCircle2 
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { formatCurrency } from '@/lib/pricing';
import { buildWhatsAppCartUrl, SITE_CONFIG } from '@/lib/config';
import { slugify } from '@/lib/slug';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getTotalPrice();
  const totalItems = getTotalItems();
  const hasItems = items.length > 0;

  const handleWhatsAppCheckout = () => {
    const url = buildWhatsAppCartUrl(items, total);
    window.open(url, '_blank');
  };

  if (!hasItems) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tu carrito está vacío</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Aún no has agregado figuras, piezas ni regalos personalizados a tu pedido. Revisa nuestro catálogo y aprovecha los precios por escala de volumen.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-brand text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:opacity-95 transition-all"
        >
          <span>Ir al Catálogo de Productos</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Carrito de Compras
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Tienes {totalItems} {totalItems === 1 ? 'unidad' : 'unidades'} en tu lista de compra. Los precios por escala se aplican automáticamente según la cantidad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Cart Items Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Productos ({items.length})
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Items list */}
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/producto/${slugify(item.product.slug || item.product.name)}`}
                      className="text-sm font-bold text-slate-900 hover:text-purple-600 line-clamp-1"
                    >
                      {item.product.name}
                    </Link>

                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      {item.selectedColor && (
                        <span className="text-purple-700 font-semibold">
                          Color: {item.selectedColor}
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">{item.product.categoryName || item.product.categorySlug}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(item.unitPrice)}
                      </span>
                      <span className="text-slate-400">c/u</span>
                      {item.product.hasTieredPricing && item.quantity >= 6 && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                          Descuento por volumen
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper, Subtotal and Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                  {/* Stepper */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right min-w-[80px]">
                    <span className="text-[11px] text-slate-400 block -mb-1">Subtotal</span>
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/catalogo"
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
            >
              ← Continuar comprando más productos
            </Link>
          </div>
        </div>

        {/* Right Col: Order Summary & WhatsApp Checkout (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-3">
            Resumen del Pedido
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal productos:</span>
              <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Coordinación de envío:</span>
              <span className="text-emerald-600 font-semibold">Por WhatsApp</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Descuentos por escala:</span>
              <span className="text-purple-600 font-bold">Aplicados</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-base font-black text-slate-900 block">
                  TOTAL DEL PEDIDO
                </span>
                <span className="text-[11px] text-slate-400">Precios en Soles (S/)</span>
              </div>
              <span className="text-3xl font-black text-slate-950 font-sans tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Main WhatsApp Checkout CTA */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleWhatsAppCheckout}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>FINALIZAR PEDIDO POR WHATSAPP</span>
            </button>

            <p className="text-[11px] text-center text-slate-400 leading-tight">
              Al hacer clic, se abrirá WhatsApp con el desglose exacto de tu pedido para confirmar stock y coordinar entrega con {SITE_CONFIG.name}.
            </p>
          </div>

          {/* Info badges */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sin cobros automáticos ni registros engorrosos</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Envíos a todo el Perú (Olva, Shalom o recojo)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>Garantía de calidad en filamento e impresión</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
