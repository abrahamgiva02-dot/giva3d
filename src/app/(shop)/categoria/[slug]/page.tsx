'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Wrench, MessageCircle, SlidersHorizontal, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import ProductCard from '@/components/product/ProductCard';
import { buildWhatsAppCustomQuoteUrl } from '@/lib/config';
import { normalizeSlug, slugify } from '@/lib/slug';

export default function CategoryPage() {
  const params = useParams();
  const rawSlug = params?.slug as string;
  const slug = normalizeSlug(rawSlug);

  const { categories, products } = useCatalogStore();
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const category = useMemo(() => {
    return categories.find((c) => slugify(c.slug) === slug || c.slug === slug || c.slug === rawSlug);
  }, [categories, slug, rawSlug]);

  const categoryProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const pCatSlug = slugify(p.categorySlug || '');
      return (pCatSlug === slug || p.categorySlug === slug || p.categorySlug === rawSlug) && p.isActive;
    });
    
    return filtered.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price1 - b.price1;
      if (sortBy === 'price-desc') return b.price1 - a.price1;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, slug, sortBy]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Categoría no encontrada</h2>
        <p className="text-slate-500 mb-6">No encontramos la categoría solicitada.</p>
        <Link
          href="/catalogo"
          className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-sm hover:bg-purple-700 transition-colors"
        >
          Ver catálogo completo
        </Link>
      </div>
    );
  }

  // SPECIAL DESIGN A MEDIDA VIEW ("Fabricamos tu pieza")
  if (slug === 'diseno-a-medida') {
    const quoteUrl = buildWhatsAppCustomQuoteUrl();

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-purple-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{category.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 text-white rounded-3xl p-6 sm:p-12 shadow-2xl border border-purple-800/40 relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-cyan-300 border border-purple-400/30">
              Servicio de Impresión 3D Personalizada
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Fabricamos tu Pieza a Medida
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              ¿Se rompió una pieza de tu auto, moto, electrodoméstico, maquinaria o herramienta?
              Envíanos fotografías, medidas, dibujos o tu archivo 3D y evaluaremos si podemos fabricarla en materiales de alta resistencia.
            </p>

            <div className="pt-4">
              <a
                href={quoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-brand hover:opacity-95 text-white font-black text-base shadow-xl shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>SOLICITAR COTIZACIÓN POR WHATSAPP</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3 Step Process */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-black text-slate-900 text-center tracking-tight">
            ¿Cómo funciona el servicio?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Envíanos las referencias</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Toma fotos desde varios ángulos a la pieza rota junto a una regla o cinta métrica para tener referencia de escala.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 font-black text-lg flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Modelado y Cotización</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Nuestro equipo técnico evalúa el esfuerzo de diseño CAD 3D, el material adecuado (PETG, PLA+, ABS) y te brinda un presupuesto exacto.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Fabricación y Entrega</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Imprimimos la pieza con parámetros de resistencia reforzados y la enviamos a tu dirección o la recoges coordinadamente.
              </p>
            </div>
          </div>
        </div>

        {/* Examples of what we make */}
        <div className="mt-12 bg-slate-100/80 rounded-3xl p-6 sm:p-8 border border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg mb-4">
            Ejemplos de piezas que podemos reproducir:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Clips y sujetadores de consola o parachoques de autos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perillas de cocinas, radios o equipos industriales</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Engranajes de repuesto para electrodomésticos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Soportes rotos de monitores, lámparas o visores de casco</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Adaptadores y tapas plásticas descontinuadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Prototipos de inventos e ingeniería mecánica</span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href={quoteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Hablar con un asesor técnico por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD CATEGORY VIEW
  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-7">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-purple-600 transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/catalogo" className="hover:text-purple-600 transition-colors">Catálogo</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">{category.name}</span>
      </nav>

      {/* Category Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            Categoría
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            {category.name}
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            {category.description}
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs text-slate-500 font-medium">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple-500"
          >
            <option value="default">Destacados</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {categoryProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No hay productos en esta categoría por el momento</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Estamos imprimiendo nuevos diseños constantemente. Consulta por WhatsApp para pedidos especiales.
          </p>
          <Link
            href="/catalogo"
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            Explorar todas las categorías
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}
