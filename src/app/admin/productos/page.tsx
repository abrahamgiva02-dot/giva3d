'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers, 
  Sparkles, 
  Check, 
  X,
  ExternalLink,
  Filter,
  RotateCcw,
  UploadCloud
} from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { formatCurrency } from '@/lib/pricing';
import { slugify } from '@/lib/slug';
import { 
  fetchProducts, 
  deleteProductFromDb, 
  toggleProductActiveInDb 
} from '@/lib/services/products';
import { isSupabaseConfigured } from '@/lib/supabase';
import ProductMigrationModal from '@/components/admin/ProductMigrationModal';

export default function AdminProductsPage() {
  const { products, categories, setProducts, toggleProductActive, deleteProduct, resetToDefaults } = useCatalogStore();

  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadDbProducts = React.useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingDb(true);
    try {
      const dbItems = await fetchProducts();
      if (dbItems) {
        setProducts(dbItems);
      }
    } catch (err) {
      console.error('[SUPABASE PRODUCTS ERROR] AdminProductsPage load error:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, [setProducts]);

  React.useEffect(() => {
    loadDbProducts();
  }, [loadDbProducts]);

  const showToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 2500);
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) {
        return false;
      }
      if (statusFilter === 'published' && !p.isActive) return false;
      if (statusFilter === 'hidden' && p.isActive) return false;
      return true;
    });
  }, [products, search, selectedCategory, statusFilter]);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    toggleProductActive(id);
    if (isSupabaseConfigured) {
      try {
        await toggleProductActiveInDb(id, currentActive);
      } catch (err: any) {
        console.warn('[SUPABASE PRODUCTS] Toggle error in DB:', err.message);
      }
    }
    showToast(currentActive ? 'Producto ocultado del catálogo' : 'Producto publicado en el catálogo');
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      deleteProduct(id);
      if (isSupabaseConfigured) {
        try {
          await deleteProductFromDb(id);
        } catch (err: any) {
          console.warn('[SUPABASE PRODUCTS] Delete error in DB:', err.message);
        }
      }
      showToast('Producto eliminado exitosamente');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestión de Productos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Control de catálogo, visibilidad, escalas de precios por volumen y etiquetas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => {
              loadDbProducts();
              showToast('Catálogo actualizado desde Supabase');
            }}
            disabled={isLoadingDb}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-xs disabled:opacity-50"
            title="Recargar catálogo directamente desde Supabase"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin text-purple-600' : ''}`} />
            <span>{isLoadingDb ? 'Cargando...' : 'Recargar'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas restablecer los productos por defecto y limpiar datos residuales locales?')) {
                resetToDefaults();
                showToast('Catálogo restablecido correctamente');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors shadow-xs"
            title="Restablecer productos originales"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          {/* Temporal Migration Button */}
          <button
            type="button"
            onClick={() => setIsMigrationModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            title="Migrar productos guardados en localStorage hacia Supabase"
          >
            <UploadCloud className="w-4 h-4 text-slate-950" />
            <span>Migrar productos locales a Supabase</span>
          </button>

          <Link
            href="/admin/productos/nuevo"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Migration Modal */}
      <ProductMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onMigrationComplete={() => {
          loadDbProducts();
        }}
      />

      {/* Toast notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs sm:text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
          >
            <option value="all">Todos los estados</option>
            <option value="published">Solo Publicados</option>
            <option value="hidden">Solo Ocultos</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-3">Categoría</th>
                <th className="py-3.5 px-3">Precio 1u</th>
                <th className="py-3.5 px-3">Escalas (6 / 12 / 24+ u)</th>
                <th className="py-3.5 px-3">Estado Tienda</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron productos con estos criterios.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Product Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <Image
                            src={prod.primaryImage}
                            alt={prod.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{prod.name}</span>
                            {prod.isOffer && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                                Oferta
                              </span>
                            )}
                            {prod.isBestSeller && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                                Top
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{prod.status === 'bajo_pedido' ? 'Bajo pedido' : 'Disponible'}</span>
                            {prod.leadTime && <span>• {prod.leadTime}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {prod.categoryName || prod.categorySlug}
                    </td>

                    {/* 1 Unit Price */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatCurrency(prod.price1)}
                    </td>

                    {/* Tiered prices */}
                    <td className="py-3 px-3">
                      {prod.hasTieredPricing ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <span title="6 unidades" className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            6u: {prod.price6 ? formatCurrency(prod.price6) : '-'}
                          </span>
                          <span title="12 unidades" className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            12u: {prod.price12 ? formatCurrency(prod.price12) : '-'}
                          </span>
                          <span title="24+ unidades" className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            24u+: {prod.price24 ? formatCurrency(prod.price24) : '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Solo precio unitario</span>
                      )}
                    </td>

                    {/* Active / Hidden Status Indicator */}
                    <td className="py-3 px-3">
                      {prod.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Publicado</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <EyeOff className="w-3 h-3 text-amber-700" />
                          <span>Oculto</span>
                        </span>
                      )}
                    </td>

                    {/* Actions: Ocultar/Mostrar, Editar, Ver, Eliminar */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Ocultar / Mostrar del catálogo */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod.id, prod.isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                            prod.isActive
                              ? 'border-slate-200 hover:border-amber-300 hover:bg-amber-50 text-slate-600 hover:text-amber-800'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          }`}
                          title={prod.isActive ? 'Ocultar producto de la tienda pública' : 'Mostrar producto en la tienda pública'}
                        >
                          {prod.isActive ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Ocultar</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Mostrar</span>
                            </>
                          )}
                        </button>

                        {/* Editar Button */}
                        <Link
                          href={`/admin/productos/${prod.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors"
                          title="Editar producto completo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </Link>

                        {/* External preview */}
                        <Link
                          href={`/producto/${slugify(prod.slug || prod.name)}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver en tienda"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Secondary delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
