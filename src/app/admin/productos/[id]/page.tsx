'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { fetchProductById } from '@/lib/services/products';
import { Product } from '@/types';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const { products, isHydrated } = useCatalogStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadProduct() {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1. Fetch fresh from Supabase by ID
      try {
        const dbProduct = await fetchProductById(id);
        if (!isCancelled && dbProduct) {
          setProduct(dbProduct);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[EDIT PRODUCT] Error fetching product from Supabase:', err);
      }

      // 2. Fallback to Zustand store if DB query returned null or failed
      const storeProduct = products.find((p) => p.id === id);
      if (!isCancelled) {
        setProduct(storeProduct || null);
        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [id, products]);

  if (loading || !isHydrated) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span className="text-sm font-semibold">Cargando datos del producto desde Supabase...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Producto no encontrado</h2>
        <p className="text-xs text-slate-500 mb-6">El producto con ID {id} no existe o fue eliminado.</p>
        <Link
          href="/admin/productos"
          className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
        >
          Volver a la lista de productos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ProductForm key={product.id} initialProduct={product} isEditing={true} />
    </div>
  );
}
