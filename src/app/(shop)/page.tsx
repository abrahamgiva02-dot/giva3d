'use client';

import React from 'react';
import BannerCarousel from '@/components/home/BannerCarousel';
import CategoryGrid from '@/components/home/CategoryGrid';
import CustomServiceBanner from '@/components/home/CustomServiceBanner';
import ProductSection from '@/components/home/ProductSection';
import { useCatalogStore } from '@/lib/store/catalog-store';

export default function HomePage() {
  const { products } = useCatalogStore();

  // Filter only active products for the public catalog
  const activeProducts = products.filter((p) => p.isActive);

  // Home Sections filtering
  const newProducts = activeProducts.filter((p) => p.isNew);
  const bestSellers = activeProducts.filter((p) => p.isBestSeller);
  const offers = activeProducts.filter((p) => p.isOffer);
  const recommended = activeProducts.filter((p) => p.isFeatured || (!p.isNew && !p.isBestSeller));

  return (
    <div className="space-y-2 sm:space-y-3 pb-8">
      {/* 1. Main Banner Carousel */}
      <BannerCarousel />

      {/* 2. Visual Categories Navigation */}
      <CategoryGrid />

      {/* 3. Novedades */}
      {newProducts.length > 0 && (
        <ProductSection
          title="Novedades"
          subtitle="Últimos modelos agregados, diseños virales y creaciones recientes"
          badge="RECIÉN LLEGADOS"
          products={newProducts}
          viewAllHref="/categoria/novedades"
        />
      )}

      {/* 4. Special Custom Service Banner ("Fabricamos tu pieza") */}
      <CustomServiceBanner />

      {/* 5. Más vendidos */}
      {bestSellers.length > 0 && (
        <ProductSection
          title="Más Vendidos"
          subtitle="Los favoritos de nuestros clientes por su calidad y detalle"
          badge="TOP VENTAS"
          products={bestSellers}
          viewAllHref="/catalogo"
        />
      )}

      {/* 6. Ofertas */}
      {offers.length > 0 && (
        <ProductSection
          title="Ofertas y Promociones"
          subtitle="Precios de locura y descuentos por escala de cantidad"
          badge="DESCUENTOS ACTIVOS"
          products={offers}
          viewAllHref="/catalogo"
        />
      )}

      {/* 7. Productos recomendados */}
      {recommended.length > 0 && (
        <ProductSection
          title="Productos Recomendados"
          subtitle="Selección especial para amantes del 3D, regalos y utilitarios"
          badge="DESTACADOS"
          products={recommended}
          viewAllHref="/catalogo"
        />
      )}
    </div>
  );
}
