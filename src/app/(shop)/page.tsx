'use client';

import React, { useEffect, useState } from 'react';
import BannerCarousel from '@/components/home/BannerCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import CustomServiceBanner from '@/components/home/CustomServiceBanner';
import ProductSection from '@/components/home/ProductSection';
import { fetchActiveProducts } from '@/lib/services/products';
import { Product } from '@/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const dbItems = await fetchActiveProducts();
        if (isMounted) {
          const count = dbItems?.length || 0;
          console.log('[HOME SUPABASE PRODUCTS]', count);
          setProducts(dbItems || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[HOME SUPABASE PRODUCTS ERROR]', err);
        if (isMounted) {
          console.log('[HOME SUPABASE PRODUCTS]', 0);
          setProducts([]);
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter only active products for the public catalog
  const activeProducts = products.filter((p) => p.isActive);

  // Home Sections filtering based on real Supabase products
  const explicitNew = activeProducts.filter((p) => p.isNew);
  // If no products have isNew explicitly flagged, show the first recent products in Novedades
  const newProducts = explicitNew.length > 0 ? explicitNew : activeProducts.slice(0, 6);

  const bestSellers = activeProducts.filter((p) => p.isBestSeller);
  const offers = activeProducts.filter((p) => p.isOffer);

  // Recommended / general catalog products that aren't already the main headline
  const recommended = activeProducts.filter((p) => {
    if (explicitNew.length > 0) {
      return p.isFeatured || (!p.isNew && !p.isBestSeller);
    }
    // If explicitNew was empty, show products beyond the first 6
    return !newProducts.some((np) => np.id === p.id);
  });

  return (
    <div className="space-y-2 sm:space-y-3 pb-8">
      {/* 1. Main Banner Carousel */}
      <BannerCarousel />

      {/* 2. Visual Categories Navigation */}
      <CategoryGrid />

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 text-center text-slate-400">
          <div className="inline-block w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs font-semibold">Cargando catálogo oficial desde Supabase...</p>
        </div>
      )}

      {/* Empty State: Only when not loading and Supabase has 0 active products */}
      {!isLoading && activeProducts.length === 0 && (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
          <h3 className="text-base font-bold text-slate-800">No hay productos disponibles por el momento</h3>
          <p className="text-xs text-slate-500 mt-1">
            Estamos actualizando el catálogo con nuevas piezas impresas en 3D.
          </p>
        </div>
      )}

      {/* 3. Novedades */}
      {!isLoading && newProducts.length > 0 && (
        <ProductSection
          title="Novedades"
          subtitle="Últimos modelos agregados y creaciones recientes"
          badge="RECIÉN LLEGADOS"
          products={newProducts}
          viewAllHref="/catalogo"
        />
      )}

      {/* 4. Special Custom Service Banner ("Fabricamos tu pieza") */}
      <CustomServiceBanner />

      {/* 5. Más vendidos */}
      {!isLoading && bestSellers.length > 0 && (
        <ProductSection
          title="Más Vendidos"
          subtitle="Los favoritos de nuestros clientes por su calidad y detalle"
          badge="TOP VENTAS"
          products={bestSellers}
          viewAllHref="/catalogo"
        />
      )}

      {/* 6. Ofertas */}
      {!isLoading && offers.length > 0 && (
        <ProductSection
          title="Ofertas y Promociones"
          subtitle="Precios especiales y descuentos por escala de cantidad"
          badge="DESCUENTOS ACTIVOS"
          products={offers}
          viewAllHref="/catalogo"
        />
      )}

      {/* 7. Productos recomendados / Colección */}
      {!isLoading && recommended.length > 0 && (
        <ProductSection
          title="Colección Destacada"
          subtitle="Selección de modelos 3D, regalos y piezas utilitarias"
          badge="DESTACADOS"
          products={recommended}
          viewAllHref="/catalogo"
        />
      )}
    </div>
  );
}
