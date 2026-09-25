'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { useCatalogStore } from '@/lib/store/catalog-store';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const { products, isHydrated } = useCatalogStore();

  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [products, id]);

  if (!isHydrated) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto text-slate-400">
        Cargando datos del producto...
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
          className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
        >
          Volver a la lista de productos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ProductForm initialProduct={product} isEditing={true} />
    </div>
  );
}
