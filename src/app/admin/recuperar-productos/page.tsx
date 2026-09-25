'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArchiveRestore,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Save,
  X,
  Trash2,
  Clock,
  Loader2,
  Search,
  Check
} from 'lucide-react';
import {
  scanOrphanFolders,
  createProductFromStorageFolder,
  OrphanFolder,
  RecoverProductPayload
} from '@/lib/services/recovery';
import { INITIAL_CATEGORIES } from '@/lib/data/categories';
import { slugify } from '@/lib/slug';
import { formatCurrency } from '@/lib/pricing';
import { ProductStatus } from '@/types';

export default function RecuperarProductosPage() {
  const [allFolders, setAllFolders] = useState<OrphanFolder[]>([]);
  const [orphanFolders, setOrphanFolders] = useState<OrphanFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  // Manual folder search/addition
  const [manualFolderName, setManualFolderName] = useState('');
  const [isScanningManual, setIsScanningManual] = useState(false);

  // Active folder for creation
  const [selectedFolder, setSelectedFolder] = useState<OrphanFolder | null>(null);

  // Form state for creating product from selected folder
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategoryId, setFormCategoryId] = useState(INITIAL_CATEGORIES[0]?.id || 'cat-1');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice1, setFormPrice1] = useState('15.00');
  const [formPrice6, setFormPrice6] = useState('13.50');
  const [formPrice12, setFormPrice12] = useState('12.00');
  const [formPrice24, setFormPrice24] = useState('10.50');
  const [formStatus, setFormStatus] = useState<ProductStatus>('disponible');
  const [formLeadTime, setFormLeadTime] = useState('1–2 días');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsNew, setFormIsNew] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formIsOffer, setFormIsOffer] = useState(false);
  const [formIsCustomizable, setFormIsCustomizable] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formPrimaryPath, setFormPrimaryPath] = useState('');
  const [formColors, setFormColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Negro', hex: '#18181b' },
    { name: 'Blanco', hex: '#ffffff' },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Load and scan folders
  const handleScan = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await scanOrphanFolders();
      if (res.error) {
        setErrorMsg(res.error);
      }
      setAllFolders(res.allFolders);
      setOrphanFolders(res.orphanFolders);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al escanear carpetas de Supabase Storage');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    handleScan();
  }, [handleScan]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Open creation modal for a folder
  const handleOpenCreateModal = (folder: OrphanFolder) => {
    setSelectedFolder(folder);
    const suggestedName = folder.folderName.replace(/^prod-/, 'Producto ');
    setFormName(suggestedName);
    setFormSlug(slugify(suggestedName));
    setFormCategoryId(INITIAL_CATEGORIES[0]?.id || 'cat-1');
    setFormDescription('Pieza impresa en 3D con filamento de alta resistencia y acabado suave al tacto.');
    setFormPrice1('15.00');
    setFormPrice6('13.50');
    setFormPrice12('12.00');
    setFormPrice24('10.50');
    setFormStatus('disponible');
    setFormLeadTime('1–2 días');
    setFormIsActive(true);
    setFormIsNew(true);
    setFormIsBestSeller(false);
    setFormIsOffer(false);
    setFormIsCustomizable(false);
    setFormIsFeatured(false);
    setFormPrimaryPath(folder.primaryStoragePath);
    setFormColors([
      { name: 'Negro', hex: '#18181b' },
      { name: 'Blanco', hex: '#ffffff' },
    ]);
  };

  const handleNameChange = (nameVal: string) => {
    setFormName(nameVal);
    setFormSlug(slugify(nameVal));
  };

  const handleAddColor = () => {
    setFormColors((prev) => [...prev, { name: 'Color Nuevo', hex: '#7c3aed' }]);
  };

  const handleRemoveColor = (idx: number) => {
    setFormColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleColorChange = (idx: number, field: 'name' | 'hex', val: string) => {
    setFormColors((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  };

  // Submit product creation
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolder) return;

    if (!formName.trim()) {
      alert('Por favor ingresa un nombre para el producto.');
      return;
    }

    const selectedCategory = INITIAL_CATEGORIES.find((c) => c.id === formCategoryId);
    const categorySlug = selectedCategory?.slug || 'juguetes-figuras';
    const categoryName = selectedCategory?.name || 'Juguetes y figuras';

    setIsSaving(true);
    try {
      const payload: RecoverProductPayload = {
        folderName: selectedFolder.folderName,
        name: formName.trim(),
        slug: slugify(formSlug || formName),
        categoryId: formCategoryId,
        categorySlug,
        categoryName,
        description: formDescription.trim(),
        status: formStatus,
        leadTime: formLeadTime.trim(),
        isActive: formIsActive,
        isNew: formIsNew,
        isBestSeller: formIsBestSeller,
        isOffer: formIsOffer,
        isCustomizable: formIsCustomizable,
        isFeatured: formIsFeatured,
        hasTieredPricing: true,
        price1: parseFloat(formPrice1) || 0,
        price6: formPrice6 ? parseFloat(formPrice6) : undefined,
        price12: formPrice12 ? parseFloat(formPrice12) : undefined,
        price24: formPrice24 ? parseFloat(formPrice24) : undefined,
        primaryStoragePath: formPrimaryPath || selectedFolder.primaryStoragePath,
        images: selectedFolder.images.map((img) => ({
          storagePath: img.storagePath,
          url: img.url,
          isPrimary: img.storagePath === (formPrimaryPath || selectedFolder.primaryStoragePath),
        })),
        colors: formColors.filter((c) => c.name.trim()),
      };

      await createProductFromStorageFolder(payload);

      showToast(`¡Producto "${payload.name}" recuperado exitosamente en Supabase!`);
      setSelectedFolder(null);

      // Refresh scan list
      await handleScan();
    } catch (err: any) {
      console.error('Error recovering product:', err);
      alert(err.message || 'Error al guardar el producto en Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 mb-2">
            <ArchiveRestore className="w-4 h-4 text-amber-700" />
            <span>Herramienta de Recuperación</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Recuperar Productos desde Storage
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Detecta las carpetas de imágenes en <code>product-images/products/</code> que se subieron pero no tienen registro en la tabla de productos. Te permite reconstruir cada producto reutilizando las imágenes exactas sin volver a subirlas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/productos"
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
          >
            Volver a Productos
          </Link>
          <button
            type="button"
            onClick={handleScan}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Escanear Storage</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Carpetas Encontradas
          </span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            {allFolders.length}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            En bucket <code>product-images/products/</code>
          </span>
        </div>

        <div className="bg-amber-50 p-5 rounded-3xl border border-amber-200 shadow-xs">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Carpetas Huérfanas (Sin Producto)
          </span>
          <span className="text-3xl font-black text-amber-950 mt-1 block">
            {orphanFolders.length}
          </span>
          <span className="text-xs text-amber-700 mt-1 block">
            Listas para crear producto
          </span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Carpetas Asociadas
          </span>
          <span className="text-3xl font-black text-emerald-950 mt-1 block">
            {allFolders.length - orphanFolders.length}
          </span>
          <span className="text-xs text-emerald-700 mt-1 block">
            Ya vinculadas a un producto
          </span>
        </div>
      </div>

      {/* Folders List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-purple-600" />
            <span>Carpetas en Supabase Storage ({allFolders.length})</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {orphanFolders.length} pendientes de recuperación
          </span>
        </div>

        {loading && (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-xs font-semibold">Escaneando Storage de Supabase...</p>
          </div>
        )}

        {!loading && allFolders.length === 0 && (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">No se detectaron carpetas de productos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Si el bucket tiene políticas RLS restrictivas, puedes autorizar la lectura de <code>storage.objects</code> o verificar que las carpetas existan en el bucket <code>product-images</code>.
            </p>
          </div>
        )}

        {!loading && allFolders.length > 0 && (
          <div className="divide-y divide-slate-100">
            {allFolders.map((folder) => (
              <div
                key={folder.folderName}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {folder.primaryImageUrl ? (
                      <Image
                        src={folder.primaryImageUrl}
                        alt={folder.folderName}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {folder.folderName}
                      </span>
                      
                      {folder.isAssociated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Asociada</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Huérfana (Sin Producto)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      <b>{folder.imageCount} imagen{folder.imageCount > 1 ? 'es' : ''}</b> encontrada{folder.imageCount > 1 ? 's' : ''} en <code>{folder.folderPath}</code>
                    </p>

                    {folder.isAssociated && folder.associatedProductName && (
                      <p className="text-xs text-emerald-700 font-semibold">
                        Vinculada al producto: &ldquo;{folder.associatedProductName}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center gap-2">
                  {!folder.isAssociated ? (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateModal(folder)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:opacity-95 transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear producto desde esta carpeta</span>
                    </button>
                  ) : (
                    <Link
                      href={`/admin/productos/${folder.associatedProductId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs transition-colors"
                    >
                      <span>Ver producto</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PRODUCT FORM MODAL */}
      {selectedFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                  Carpeta de origen: {selectedFolder.folderName}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  Crear Producto Reutilizando Imágenes de Storage
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gallery of Existing Images in this folder */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Imágenes encontradas en la carpeta ({selectedFolder.images.length})
                </label>
                <span className="text-[11px] text-purple-700 font-semibold">
                  Haz clic en una imagen para marcarla como Principal
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {selectedFolder.images.map((img, i) => {
                  const isPrimary = formPrimaryPath === img.storagePath;
                  return (
                    <div
                      key={img.storagePath}
                      onClick={() => setFormPrimaryPath(img.storagePath)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isPrimary
                          ? 'border-purple-600 ring-2 ring-purple-300 shadow-md scale-102'
                          : 'border-slate-200 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={`Foto ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      {isPrimary && (
                        <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span className="absolute bottom-1 left-1 text-[9px] font-black bg-black/70 text-white px-1.5 py-0.5 rounded">
                        {isPrimary ? 'PRINCIPAL' : `#${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Creation Form */}
            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              {/* Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej: Lagartija Articulada Flexible 3D"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Slug Normalizado *
                  </label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(slugify(e.target.value))}
                    placeholder="lagartija-articulada-flexible-3d"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Category, Status & Lead Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  >
                    {INITIAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Disponibilidad
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductStatus)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="bajo_pedido">Bajo pedido</option>
                    <option value="no_disponible">No disponible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tiempo Fabricación
                  </label>
                  <input
                    type="text"
                    value={formLeadTime}
                    onChange={(e) => setFormLeadTime(e.target.value)}
                    placeholder="Ej: 1–2 días"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descripción del Producto
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles del modelo, material de filamento, articulación y acabado..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Tiered Pricing Model */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                  Escalas de Precio por Mayor (S/ c/u)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">1 Unidad *</span>
                    <input
                      type="number"
                      step="0.10"
                      required
                      value={formPrice1}
                      onChange={(e) => setFormPrice1(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">6+ Unids</span>
                    <input
                      type="number"
                      step="0.10"
                      value={formPrice6}
                      onChange={(e) => setFormPrice6(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">12+ Unids</span>
                    <input
                      type="number"
                      step="0.10"
                      value={formPrice12}
                      onChange={(e) => setFormPrice12(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">24+ Unids</span>
                    <input
                      type="number"
                      step="0.10"
                      value={formPrice24}
                      onChange={(e) => setFormPrice24(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tags & Flags */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsNew}
                    onChange={(e) => setFormIsNew(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Nuevo</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsBestSeller}
                    onChange={(e) => setFormIsBestSeller(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Más Vendido</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOffer}
                    onChange={(e) => setFormIsOffer(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Oferta</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsCustomizable}
                    onChange={(e) => setFormIsCustomizable(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Personalizable</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Destacado Home</span>
                </label>

                <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Activo (Público)</span>
                </label>
              </div>

              {/* Colors Variants */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Variantes de Color ({formColors.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir color</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formColors.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200"
                    >
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => handleColorChange(idx, 'hex', e.target.value)}
                        className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => handleColorChange(idx, 'name', e.target.value)}
                        placeholder="Nombre de color"
                        className="flex-1 px-2.5 py-1 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFolder(null)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:opacity-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando en Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Producto en Supabase</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
