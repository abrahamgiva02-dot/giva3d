'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { formatCurrency } from '@/lib/pricing';
import { buildWhatsAppCartUrl } from '@/lib/config';
import { slugify } from '@/lib/slug';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getTotalPrice();
  const hasItems = items.length > 0;

  const handleWhatsAppCheckout = () => {
    const url = buildWhatsAppCartUrl(items, total);
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Carrito de Compras</h3>
              <p className="text-xs text-slate-400">
                {items.length} {items.length === 1 ? 'producto' : 'productos'} añadidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!hasItems ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">Tu carrito está vacío</h4>
              <p className="text-xs text-slate-400 max-w-xs mb-6">
                Explora nuestras figuras, regalos personalizados y piezas técnicas con precios por volumen.
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
              >
                Explorar catálogo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-100 bg-white hover:border-purple-200 transition-all shadow-xs"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                    <Image
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/producto/${slugify(item.product.slug || item.product.name)}`}
                          onClick={() => setIsOpen(false)}
                          className="font-semibold text-xs sm:text-sm text-slate-900 hover:text-purple-600 line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.selectedColor && (
                        <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                          Color: {item.selectedColor}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.unitPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">c/u</span>
                        {item.product.hasTieredPricing && item.quantity >= 6 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                            Escala aplicada
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Modifier & Subtotal */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-l-md"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-r-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block -mb-0.5">Subtotal</span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {hasItems && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/90 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Total del Pedido
                </span>
                <p className="text-[11px] text-slate-400">Precios por escala calculados automáticamente</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-950 font-sans">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              type="button"
              onClick={handleWhatsAppCheckout}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>FINALIZAR PEDIDO POR WHATSAPP</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <Link
                href="/carrito"
                onClick={() => setIsOpen(false)}
                className="hover:text-purple-600 font-semibold flex items-center gap-1"
              >
                Ver pantalla completa de carrito <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-slate-600"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
