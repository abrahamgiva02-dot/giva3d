'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, Layers, X, Sparkles, Filter } from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import ProductCard from '@/components/product/ProductCard';
import { fetchActiveProducts } from '@/lib/services/products';
import { isSupabaseConfigured } from '@/lib/supabase';

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { products, categories, setProducts } = useCatalogStore();
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured) {
      fetchActiveProducts()
        .then((dbItems) => {
          if (isMounted) {
            if (dbItems && dbItems.length > 0) {
              setProducts(dbItems);
            }
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('[SUPABASE PRODUCTS ERROR] Catalog fetch error:', err);
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [setProducts]);

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.isActive)
      .filter((p) => {
        // Search filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = (p.categoryName || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (selectedTag === 'new' && !p.isNew) return false;
        if (selectedTag === 'best_seller' && !p.isBestSeller) return false;
        if (selectedTag === 'offer' && !p.isOffer) return false;
        if (selectedTag === 'customizable' && !p.isCustomizable) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price1 - b.price1;
        if (sortBy === 'price-desc') return b.price1 - a.price1;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, search, selectedCategory, selectedTag, sortBy]);

  const activeCategories = categories.filter((c) => c.slug !== 'diseno-a-medida');

  return (
    <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 sm:py-7 space-y-6">
      
      {/* Catalog Title Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tienda Oficial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Catálogo de Productos 3D
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Precios unitarios competitivos y descuentos por escala desde 6, 12 y 24 unidades.
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o palabra..."
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 rounded-2xl border border-slate-200 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and sorting pills bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
            }`}
          >
            Todas las categorías ({products.filter((p) => p.isActive).length})
          </button>

          {activeCategories.map((cat) => {
            const count = products.filter((p) => p.categorySlug === cat.slug && p.isActive).length;
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-gradient-brand text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-purple-300'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Tags & Sorting Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
          
          {/* Quick Tag Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filtro:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'all' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedTag('offer')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'offer' ? 'bg-amber-100 text-amber-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Ofertas
            </button>
            <button
              type="button"
              onClick={() => setSelectedTag('best_seller')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'best_seller' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Más vendidos
            </button>
            <button
              type="button"
              onClick={() => setSelectedTag('new')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'new' ? 'bg-cyan-100 text-cyan-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Novedades
            </button>
            <button
              type="button"
              onClick={() => setSelectedTag('customizable')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedTag === 'customizable' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Personalizables
            </button>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            >
              <option value="default">Recomendados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Results Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No encontramos productos con los filtros seleccionados</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            Intenta cambiar los términos de búsqueda o restablecer los filtros de categoría.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedTag('all');
            }}
            className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            Restablecer todos los filtros
          </button>
        </div>
      ) : (
        <div>
          <div className="text-xs text-slate-400 font-semibold mb-4">
            Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-4.5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-slate-400">Cargando catálogo...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
