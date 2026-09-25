'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  EyeOff, 
  Layers, 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Tag,
  ExternalLink
} from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { formatCurrency } from '@/lib/pricing';

export default function AdminDashboardPage() {
  const { products, banners, categories } = useCatalogStore();

  const publishedProducts = products.filter((p) => p.isActive);
  const hiddenProducts = products.filter((p) => !p.isActive);
  const offerProducts = products.filter((p) => p.isOffer);
  const activeBanners = banners.filter((b) => b.isActive);

  const stats = [
    {
      title: 'Productos Publicados',
      value: publishedProducts.length,
      icon: <Package className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200',
      description: 'Visibles en la tienda pública',
    },
    {
      title: 'Productos Ocultos',
      value: hiddenProducts.length,
      icon: <EyeOff className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200',
      description: 'Pausados sin eliminar',
    },
    {
      title: 'Banners Activos',
      value: activeBanners.length,
      icon: <ImageIcon className="w-6 h-6 text-cyan-600" />,
      bg: 'bg-cyan-50 border-cyan-200',
      description: 'En rotación en el Home',
    },
    {
      title: 'Categorías Registradas',
      value: categories.length,
      icon: <Layers className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200',
      description: 'Secciones del catálogo',
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Panel de Control GIVA 3D
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Administración centralizada de catálogo, precios escalonados por cantidad y banners promocionales.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs font-bold shadow-md shadow-purple-600/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>

          <Link
            href="/admin/banners"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <span>Gestionar Banners</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.title}
            className={`p-5 rounded-2xl border ${s.bg} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {s.title}
              </span>
              <div className="p-2 bg-white rounded-xl shadow-xs">
                {s.icon}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900 font-sans">
                {s.value}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Summary Table of Products */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Productos Recientes
            </h2>
            <p className="text-xs text-slate-400">
              Últimos artículos gestionados en el catálogo
            </p>
          </div>
          <Link
            href="/admin/productos"
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Ver todos los productos ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Precio 1u</th>
                <th className="py-3 px-3">Escala 24+u</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="truncate max-w-xs">{p.name}</span>
                    {p.isOffer && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        Oferta
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{p.categoryName || p.categorySlug}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{formatCurrency(p.price1)}</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">
                    {p.hasTieredPricing && p.price24 ? formatCurrency(p.price24) : '-'}
                  </td>
                  <td className="py-3 px-3">
                    {p.isActive ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                        Publicado
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                        Oculto
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="text-purple-600 hover:text-purple-800 font-bold"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
