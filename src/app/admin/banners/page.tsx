'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Edit2,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  LayoutTemplate,
  RotateCcw,
  ZoomIn,
  Move,
  Link as LinkIcon,
  FolderTree,
  Tag
} from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';
import { Banner, BannerDisplayMode, BannerImagePosition, BannerImageFit } from '@/types';
import { uploadBannerImage, deleteProductImageFromStorage } from '@/lib/services/storage';
import {
  fetchBanners,
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  updateBannersOrder
} from '@/lib/services/banners';
import { isSupabaseConfigured } from '@/lib/supabase';

type DestinationType = 'catalog' | 'category' | 'product' | 'custom_design' | 'custom_url' | 'none';

const BUTTON_TEXT_SUGGESTIONS = [
  'Ver producto',
  'Ver categoría',
  'Ver catálogo',
  'Ver oferta',
  'Comprar ahora',
  'Solicitar cotización',
  'Ver más',
];

export default function AdminBannersPage() {
  const {
    banners: storeBanners,
    setBanners: setStoreBanners,
    categories,
    products
  } = useCatalogStore();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form modal/drawer state
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form inputs
  const [displayMode, setDisplayMode] = useState<BannerDisplayMode>('image_only');
  const [imageFit, setImageFit] = useState<BannerImageFit>('cover');
  const [imageZoom, setImageZoom] = useState<number>(1.0);
  const [imagePositionX, setImagePositionX] = useState<number>(50);
  const [imagePositionY, setImagePositionY] = useState<number>(50);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [buttonText, setButtonText] = useState('Ver catálogo');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  // Destination selectors state
  const [destType, setDestType] = useState<DestinationType>('catalog');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('');
  const [linkUrl, setLinkUrl] = useState<string>('/catalogo');

  // Image upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');
  const [existingStoragePath, setExistingStoragePath] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Active categories and sorted products from store
  const activeCategories = useMemo(() => {
    return (categories || []).filter((c) => c.isActive !== false);
  }, [categories]);

  const activeProducts = useMemo(() => {
    return [...(products || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Load banners on mount
  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const dbItems = await fetchBanners();
        if (dbItems) {
          setBanners(dbItems);
          setStoreBanners(dbItems);
        } else {
          setBanners([]);
        }
      } else {
        setBanners(storeBanners);
      }
    } catch (err: any) {
      console.error('[SUPABASE BANNERS ERROR] loadBanners failed:', err);
      setBanners(storeBanners);
      showToast('No se pudieron sincronizar los banners de la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [storeBanners, setStoreBanners]);

  useEffect(() => {
    loadBanners();
  }, []);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset image adjustment controls
  const handleResetImageAdjustment = () => {
    setImageFit('cover');
    setImageZoom(1.0);
    setImagePositionX(50);
    setImagePositionY(50);
  };

  // Handle Destination Type Change
  const handleDestinationTypeChange = (newType: DestinationType) => {
    setDestType(newType);

    switch (newType) {
      case 'none':
        setLinkUrl('');
        break;

      case 'catalog':
        setLinkUrl('/catalogo');
        if (displayMode === 'with_content' && (!buttonText || buttonText === 'Ver producto' || buttonText === 'Ver categoría' || buttonText === 'Solicitar cotización')) {
          setButtonText('Ver catálogo');
        }
        break;

      case 'category': {
        const catSlug = selectedCategorySlug || activeCategories[0]?.slug || 'juguetes-figuras';
        setSelectedCategorySlug(catSlug);
        setLinkUrl(`/categoria/${catSlug}`);
        if (displayMode === 'with_content' && (!buttonText || buttonText === 'Ver catálogo' || buttonText === 'Ver producto' || buttonText === 'Solicitar cotización')) {
          setButtonText('Ver categoría');
        }
        break;
      }

      case 'product': {
        const prodSlug = selectedProductSlug || activeProducts[0]?.slug || '';
        setSelectedProductSlug(prodSlug);
        setLinkUrl(prodSlug ? `/producto/${prodSlug}` : '/catalogo');
        if (displayMode === 'with_content' && (!buttonText || buttonText === 'Ver catálogo' || buttonText === 'Ver categoría' || buttonText === 'Solicitar cotización')) {
          setButtonText('Ver producto');
        }
        break;
      }

      case 'custom_design':
        setLinkUrl('/categoria/diseno-a-medida');
        if (displayMode === 'with_content' && (!buttonText || buttonText === 'Ver catálogo' || buttonText === 'Ver categoría' || buttonText === 'Ver producto')) {
          setButtonText('Solicitar cotización');
        }
        break;

      case 'custom_url':
        // Keep current linkUrl or let user edit freely
        break;
    }
  };

  // Open Form for Creating
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setDisplayMode('image_only');
    setImageFit('cover');
    setImageZoom(1.0);
    setImagePositionX(50);
    setImagePositionY(50);
    setTitle('');
    setSubtitle('');
    setBadge('');
    setButtonText('Ver catálogo');
    setDisplayOrder(banners.length + 1);
    setIsActive(true);

    // Destination defaults
    setDestType('catalog');
    setSelectedCategorySlug(activeCategories[0]?.slug || 'juguetes-figuras');
    setSelectedProductSlug(activeProducts[0]?.slug || '');
    setLinkUrl('/catalogo');

    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setExistingImageUrl('');
    setExistingStoragePath('');

    setIsOpenForm(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setDisplayMode(banner.displayMode || 'with_content');
    setImageFit(banner.imageFit || 'cover');
    setImageZoom(typeof banner.imageZoom === 'number' ? banner.imageZoom : 1.0);
    setImagePositionX(
      typeof banner.imagePositionX === 'number'
        ? banner.imagePositionX
        : banner.imagePosition === 'left' ? 0 : banner.imagePosition === 'right' ? 100 : 50
    );
    setImagePositionY(
      typeof banner.imagePositionY === 'number' ? banner.imagePositionY : 50
    );
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setBadge(banner.badge || banner.badgeText || '');
    setButtonText(banner.buttonText || 'Ver catálogo');
    setDisplayOrder(banner.displayOrder || 1);
    setIsActive(banner.isActive);

    // Detect destination type from existing linkUrl
    const rawUrl = (banner.linkUrl || banner.buttonUrl || '').trim();
    let detected: DestinationType = 'catalog';
    let catSlug = activeCategories[0]?.slug || 'juguetes-figuras';
    let prodSlug = activeProducts[0]?.slug || '';

    if (!rawUrl) {
      detected = 'none';
    } else if (rawUrl === '/catalogo') {
      detected = 'catalog';
    } else if (rawUrl === '/categoria/diseno-a-medida') {
      detected = 'custom_design';
    } else if (rawUrl.startsWith('/categoria/')) {
      detected = 'category';
      catSlug = rawUrl.replace('/categoria/', '');
    } else if (rawUrl.startsWith('/producto/')) {
      detected = 'product';
      prodSlug = rawUrl.replace('/producto/', '');
    } else {
      detected = 'custom_url';
    }

    setDestType(detected);
    setSelectedCategorySlug(catSlug);
    setSelectedProductSlug(prodSlug);
    setLinkUrl(rawUrl);

    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(banner.imageUrl);
    setExistingImageUrl(banner.imageUrl);
    setExistingStoragePath(banner.storagePath || '');

    setIsOpenForm(true);
  };

  const handleCloseForm = () => {
    if (isSaving) return;
    setIsOpenForm(false);
    setEditingBanner(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setSelectedFile(null);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  // Save Banner (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile && !existingImageUrl) {
      showToast('Debes seleccionar una imagen para el banner desde tu computadora', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = existingImageUrl;
      let finalStoragePath = existingStoragePath;

      // 1. If a new file was chosen, upload to Supabase Storage
      if (selectedFile) {
        if (!isSupabaseConfigured) {
          throw new Error('Supabase no está configurado. Revisa tu archivo .env.local.');
        }

        const uploadResult = await uploadBannerImage(selectedFile);
        finalImageUrl = uploadResult.imageUrl;
        finalStoragePath = uploadResult.storagePath;

        // Clean up previous image file if editing
        if (editingBanner && existingStoragePath && existingStoragePath !== finalStoragePath) {
          try {
            await deleteProductImageFromStorage(existingStoragePath);
          } catch (delErr) {
            console.warn('Could not clean previous banner image:', delErr);
          }
        }
      }

      if (!finalImageUrl) {
        throw new Error('No se pudo obtener la URL de la imagen');
      }

      const finalLink = linkUrl.trim() || undefined;

      const bannerData = {
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        badge: badge.trim() || undefined,
        badgeText: badge.trim() || undefined,
        imageUrl: finalImageUrl,
        buttonText: buttonText.trim() || undefined,
        buttonUrl: finalLink,
        linkUrl: finalLink,
        displayOrder: Number(displayOrder) || 1,
        isActive,
        storagePath: finalStoragePath || undefined,
        displayMode,
        imageFit,
        imageZoom,
        imagePositionX,
        imagePositionY,
      };

      // 2. Insert or update in Supabase
      if (editingBanner) {
        let updated: Banner;
        if (isSupabaseConfigured) {
          updated = await updateBanner(editingBanner.id, bannerData);
        } else {
          updated = {
            ...editingBanner,
            ...bannerData,
          };
        }

        const updatedList = banners
          .map((b) => (b.id === editingBanner.id ? updated : b))
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setBanners(updatedList);
        setStoreBanners(updatedList);
        showToast('Banner actualizado correctamente');
      } else {
        let created: Banner;
        if (isSupabaseConfigured) {
          created = await createBanner({
            ...bannerData,
            displayOrder: Number(displayOrder) || banners.length + 1,
          });
        } else {
          created = {
            id: `banner-${Date.now()}`,
            ...bannerData,
            displayOrder: Number(displayOrder) || banners.length + 1,
          };
        }

        const updatedList = [...banners, created].sort((a, b) => a.displayOrder - b.displayOrder);
        setBanners(updatedList);
        setStoreBanners(updatedList);
        showToast('Nuevo banner guardado con éxito');
      }

      handleCloseForm();
    } catch (err: any) {
      console.error('Error saving banner:', err);
      showToast(err.message || 'Error al guardar el banner', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle active state directly from list
  const handleToggleActive = async (banner: Banner) => {
    try {
      const newState = !banner.isActive;
      if (isSupabaseConfigured) {
        await toggleBannerActive(banner.id, banner.isActive);
      }

      const updatedList = banners.map((b) =>
        b.id === banner.id ? { ...b, isActive: newState } : b
      );
      setBanners(updatedList);
      setStoreBanners(updatedList);
      showToast(newState ? 'Banner activado en el Home' : 'Banner desactivado');
    } catch (err: any) {
      showToast('Error al cambiar estado del banner: ' + err.message, 'error');
    }
  };

  // Delete banner
  const handleDelete = async (banner: Banner) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar el banner "${banner.title || 'sin título'}"?\n\nEsta acción borrará el registro de Supabase y eliminará el archivo del almacenamiento.`
    );
    if (!confirmDelete) return;

    try {
      await deleteBanner(banner.id, banner.storagePath, banner.imageUrl);

      const updatedList = banners.filter((b) => b.id !== banner.id);
      setBanners(updatedList);
      setStoreBanners(updatedList);
      showToast('Banner eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      showToast('Error al eliminar banner: ' + err.message, 'error');
    }
  };

  // Move order up / down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const list = [...banners];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    const updatedList = list.map((b, i) => ({
      ...b,
      displayOrder: i + 1,
    }));

    setBanners(updatedList);
    setStoreBanners(updatedList);

    try {
      if (isSupabaseConfigured) {
        await updateBannersOrder(
          updatedList.map((b) => ({ id: b.id, displayOrder: b.displayOrder }))
        );
      }
      showToast('Orden actualizado');
    } catch (err) {
      console.warn('Could not sync order to DB:', err);
    }
  };

  // Render Destination Controls (Shared by both modes)
  const renderDestinationSection = () => (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5 text-purple-600" />
          <span>Destino del Banner:</span>
        </label>
        {linkUrl ? (
          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate max-w-xs font-bold">
            Ruta: {linkUrl}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-bold">
            Sin enlace
          </span>
        )}
      </div>

      {/* 1. Selector de Tipo de Destino */}
      <div>
        <select
          value={destType}
          onChange={(e) => handleDestinationTypeChange(e.target.value as DestinationType)}
          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-500 shadow-2xs"
        >
          <option value="catalog">Catálogo completo (/catalogo)</option>
          <option value="category">Categoría (/categoria/...)</option>
          <option value="product">Producto específico (/producto/...)</option>
          <option value="custom_design">Diseño a medida (/categoria/diseno-a-medida)</option>
          <option value="custom_url">URL personalizada (Manual / Avanzado)</option>
          <option value="none">Sin enlace</option>
        </select>
      </div>

      {/* 2. Sub-selector de CATEGORÍA */}
      {destType === 'category' && (
        <div className="space-y-1.5 animate-in fade-in pt-1">
          <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
            <FolderTree className="w-3 h-3 text-purple-600" />
            <span>Seleccionar Categoría:</span>
          </label>
          <select
            value={selectedCategorySlug}
            onChange={(e) => {
              const slug = e.target.value;
              setSelectedCategorySlug(slug);
              setLinkUrl(`/categoria/${slug}`);
            }}
            className="w-full px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:border-purple-600 ring-2 ring-purple-500/10 shadow-xs"
          >
            {activeCategories.map((cat) => (
              <option key={cat.id || cat.slug} value={cat.slug}>
                {cat.name} ({cat.slug})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Sub-selector de PRODUCTO ESPECÍFICO */}
      {destType === 'product' && (
        <div className="space-y-1.5 animate-in fade-in pt-1">
          <label className="block text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-purple-600" />
            <span>Seleccionar Producto:</span>
          </label>
          <select
            value={selectedProductSlug}
            onChange={(e) => {
              const slug = e.target.value;
              setSelectedProductSlug(slug);
              setLinkUrl(`/producto/${slug}`);
            }}
            className="w-full px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950 focus:outline-none focus:border-purple-600 ring-2 ring-purple-500/10 shadow-xs"
          >
            {activeProducts.map((prod) => {
              const catName = categories.find(
                (c) => c.slug === prod.categorySlug || c.id === prod.categoryId
              )?.name;
              return (
                <option key={prod.id || prod.slug} value={prod.slug}>
                  {prod.name} {catName ? `— (${catName})` : ''}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* 4. Campo de URL Personalizada (Solo si elige 'custom_url') */}
      {destType === 'custom_url' && (
        <div className="space-y-1.5 animate-in fade-in pt-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Escribe la URL o ruta manual:
          </label>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Ej: /promociones o https://..."
            className="w-full px-4 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Administración de Banners (Home)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configura los banners, calibración visual y <strong>enlaces automáticos</strong> hacia categorías, productos o el catálogo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBanners}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Recargar banners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 hover:opacity-95 transition-all self-start sm:self-auto hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>NUEVO BANNER</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Form Drawer / Modal when Creating or Editing */}
      {isOpenForm && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-xl space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editingBanner ? 'Editar Banner' : 'Crear Nuevo Banner'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sube la imagen, calibra el encuadre y elige el destino automático de navegación.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={isSaving}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SELECTOR DE MODO DE BANNER */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Modo del Banner:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDisplayMode('image_only')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    displayMode === 'image_only'
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${displayMode === 'image_only' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Solo imagen publicitaria
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Para imágenes que ya contienen texto, precios o diseño. Se muestra limpia, al 100% de brillo y sin capas oscuras.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDisplayMode('with_content')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                    displayMode === 'with_content'
                      ? 'border-purple-600 bg-purple-50/50 shadow-xs ring-1 ring-purple-600/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${displayMode === 'with_content' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Imagen + contenido
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5 leading-tight">
                      Muestra título, badge, descripción y botón HTML con un degradado lateral suave sobre la izquierda.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 1. IMAGE UPLOAD FROM PC */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fotografía o Gráfico del Banner * (Desde tu Computadora)
              </label>

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                  isDragging
                    ? 'border-purple-600 bg-purple-50/60'
                    : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/20 bg-slate-50/60'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {selectedFile
                      ? `Archivo seleccionado: ${selectedFile.name}`
                      : existingImageUrl
                      ? 'Haz clic o arrastra para cambiar la imagen actual'
                      : 'Haz clic para seleccionar o arrastra una imagen'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Formatos: PNG, JPG, JPEG o WEBP • Se sube a Supabase Storage
                  </p>
                  {selectedFile && (
                    <p className="text-xs font-mono text-purple-700 font-bold pt-1">
                      Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>

              {/* CONTROLES DE CALIBRACIÓN Y AJUSTE VISUAL */}
              {previewUrl && (
                <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Move className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Ajuste y Encuadre Manual de la Imagen
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetImageAdjustment}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-200/70 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors self-start sm:self-auto"
                      title="Volver a los valores por defecto (Cover, 100%, 50%, 50%)"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restablecer posición</span>
                    </button>
                  </div>

                  {/* 1. SELECTOR AJUSTE: COVER vs CONTAIN */}
                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tipo de Ajuste:
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                      <button
                        type="button"
                        onClick={() => setImageFit('cover')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                          imageFit === 'cover'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Cubrir / Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageFit('contain')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                          imageFit === 'contain'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Contener / Contain
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {imageFit === 'cover'
                        ? '• Cover: Rellena todo el banner (puede recortar extremos según la proporción).'
                        : '• Contain: Muestra la imagen completa sin recortar ningún texto o precio.'}
                    </p>
                  </div>

                  {/* 2. ZOOM SLIDER */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-3.5 h-3.5 text-purple-600" />
                        Zoom de imagen:
                      </span>
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-purple-700">
                        {Math.round(imageZoom * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.6"
                      step="0.01"
                      value={imageZoom}
                      onChange={(e) => setImageZoom(parseFloat(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>80% (Alejar)</span>
                      <span>100% (Normal)</span>
                      <span>160% (Acercar)</span>
                    </div>
                  </div>

                  {/* 3. POSICIÓN HORIZONTAL Y VERTICAL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Horizontal Position X */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Posición Horizontal (X):</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-purple-700">
                          {imagePositionX}% {imagePositionX === 0 ? '(Izq)' : imagePositionX === 50 ? '(Centro)' : imagePositionX === 100 ? '(Der)' : ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={imagePositionX}
                        onChange={(e) => setImagePositionX(parseInt(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0% (Izquierda)</span>
                        <span>50% (Centro)</span>
                        <span>100% (Derecha)</span>
                      </div>
                    </div>

                    {/* Vertical Position Y */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Posición Vertical (Y):</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-purple-700">
                          {imagePositionY}% {imagePositionY === 0 ? '(Arriba)' : imagePositionY === 50 ? '(Centro)' : imagePositionY === 100 ? '(Abajo)' : ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={imagePositionY}
                        onChange={(e) => setImagePositionY(parseInt(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0% (Arriba)</span>
                        <span>50% (Centro)</span>
                        <span>100% (Abajo)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LIVE PREVIEW - EXACT REPLICA OF THE HOME HERO BANNER */}
              {previewUrl && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      Vista previa en tiempo real (idéntica al Home):
                    </span>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setPreviewUrl(existingImageUrl || '');
                        }}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Descartar selección
                      </button>
                    )}
                  </div>

                  {/* Preview container simulating exact Home hero */}
                  <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md min-h-[220px] h-[240px] sm:h-[280px] flex items-center">
                    {/* Image with 100% full opacity, zoom and 2D positioning */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <Image
                        src={previewUrl}
                        alt="Vista previa banner"
                        fill
                        className="w-full h-full opacity-100 transition-transform duration-150 ease-out"
                        style={{
                          objectFit: imageFit,
                          objectPosition: `${imagePositionX}% ${imagePositionY}%`,
                          transform: `scale(${imageZoom})`,
                          transformOrigin: `${imagePositionX}% ${imagePositionY}%`,
                        }}
                        sizes="(max-width: 1024px) 100vw, 800px"
                      />

                      {/* Soft gradient ONLY if 'with_content' */}
                      {displayMode === 'with_content' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent max-w-xl pointer-events-none" />
                      )}
                    </div>

                    {/* Content overlay ONLY if 'with_content' */}
                    {displayMode === 'with_content' && (
                      <div className="relative z-10 p-6 sm:p-8 max-w-lg flex flex-col justify-center text-white space-y-2">
                        {badge && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-cyan-300 border border-purple-400/30 w-fit">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>{badge}</span>
                          </div>
                        )}
                        <h4 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                          {title || 'Título del Banner'}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow">
                          {subtitle || 'Subtítulo o descripción de la oferta.'}
                        </p>
                        {buttonText && (
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-gradient-brand text-white font-bold text-xs shadow-md">
                              {buttonText}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info tags in preview */}
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20">
                        {displayMode === 'image_only' ? 'Solo imagen' : 'Imagen + contenido'}
                      </span>
                      <span className="text-[10px] font-mono bg-purple-900/80 backdrop-blur-md text-purple-200 px-2 py-1 rounded-full border border-purple-500/30">
                        {imageFit} • {Math.round(imageZoom * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. TEXT FIELDS & DESTINATION SELECTION */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              {displayMode === 'with_content' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Badge */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Etiqueta / Badge (Opcional)
                      </label>
                      <input
                        type="text"
                        value={badge}
                        onChange={(e) => setBadge(e.target.value)}
                        placeholder="Ej: OFERTA ESPECIAL, MAYORISTA"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Título Principal
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ej: OFERTA — Lagartijas y Animales Articulados 3D"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                      />
                    </div>

                    {/* Subtitle / Description */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Subtítulo / Descripción
                      </label>
                      <textarea
                        rows={2}
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Ej: Texturas realistas, movimiento fluido y colores vibrantes. ¡Desde S/ 4.00 c/u por mayor!"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* SELECTOR DE DESTINO AUTOMÁTICO */}
                  {renderDestinationSection()}

                  {/* Button Text with Quick Suggestions */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Ej: Ver catálogo, Comprar ahora..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                    />

                    {/* Quick Suggestions Chips */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                        Sugerencias rápidas:
                      </span>
                      {BUTTON_TEXT_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setButtonText(sug)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            buttonText === sug
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 text-slate-600'
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* For image_only mode: internal reference title + destination selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Título Identificador (Opcional - solo para control interno)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej: Banner Portavasos Tortuga"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                    />
                  </div>

                  {/* SELECTOR DE DESTINO AUTOMÁTICO */}
                  {renderDestinationSection()}
                </div>
              )}

              {/* 3. ORDER & ACTIVE STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Posición / Orden de Rotación
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Los banners se muestran en orden ascendente (0 o 1 aparece primero).
                  </p>
                </div>

                <div className="flex items-center sm:pt-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl w-full hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Banner Activo
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Mostrar en el carrusel de la página principal
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs shadow-md shadow-purple-600/30 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Subiendo y guardando...</span>
                  </>
                ) : (
                  <span>{editingBanner ? 'Guardar Cambios' : 'Guardar y Publicar'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Banners Registrados ({banners.length})
          </h2>
          <span className="text-xs text-slate-400">
            {banners.filter((b) => b.isActive).length} activos en el Home
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">Cargando banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No hay banners creados aún</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Haz clic en &quot;NUEVO BANNER&quot; para subir tu primera oferta o promoción para el carrusel de la página principal.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
            >
              Crear primer banner
            </button>
          </div>
        ) : (
          banners.map((banner, index) => {
            const isImgOnly = banner.displayMode === 'image_only';
            const fit = banner.imageFit || 'cover';
            const zoom = typeof banner.imageZoom === 'number' ? banner.imageZoom : 1.0;
            const posX = typeof banner.imagePositionX === 'number'
              ? banner.imagePositionX
              : banner.imagePosition === 'left' ? 0 : banner.imagePosition === 'right' ? 100 : 50;
            const posY = typeof banner.imagePositionY === 'number'
              ? banner.imagePositionY
              : 50;

            return (
              <div
                key={banner.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-purple-300 ${
                  banner.isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/70'
                }`}
              >
                {/* Order Controls & Thumbnail & Info */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                  {/* Order buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-25 text-slate-600 transition-colors"
                      title="Subir posición"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === banners.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-25 text-slate-600 transition-colors"
                      title="Bajar posición"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Thumbnail Preview with identical scaling and positioning */}
                  <div className="relative w-28 sm:w-36 h-18 sm:h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200 shadow-inner">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      fill
                      className="opacity-100"
                      style={{
                        objectFit: fit,
                        objectPosition: `${posX}% ${posY}%`,
                        transform: `scale(${zoom})`,
                        transformOrigin: `${posX}% ${posY}%`,
                      }}
                      sizes="144px"
                    />
                  </div>

                  {/* Banner Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        Orden {banner.displayOrder ?? index}
                      </span>
                      
                      {/* Mode Badge */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isImgOnly
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        }`}
                      >
                        {isImgOnly ? 'Solo imagen' : 'Imagen + contenido'}
                      </span>

                      {/* Fit & Zoom Pill */}
                      <span className="text-[10px] font-mono uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                        {fit} • {Math.round(zoom * 100)}%
                      </span>

                      {/* Content Badge */}
                      {!isImgOnly && (banner.badge || banner.badgeText) && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          {banner.badge || banner.badgeText}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                      {banner.title || (isImgOnly ? 'Banner publicitario' : 'Banner sin título')}
                    </h4>

                    {!isImgOnly && banner.subtitle && (
                      <p className="text-xs text-slate-500 truncate max-w-md hidden sm:block">
                        {banner.subtitle}
                      </p>
                    )}

                    <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                      Enlace: <span className="font-mono text-slate-600">{banner.linkUrl || banner.buttonUrl || 'Ninguno'}</span>
                      {!isImgOnly && banner.buttonText ? ` • Botón: "${banner.buttonText}"` : ''}
                      <span className="text-slate-400"> • Posición: X:{posX}% Y:{posY}%</span>
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                  {/* Active / Inactive Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      banner.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-900 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800 border border-slate-300'
                    }`}
                    title={banner.isActive ? 'Clic para desactivar' : 'Clic para activar'}
                  >
                    {banner.isActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(banner)}
                    className="flex items-center gap-1 px-3 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors text-xs font-bold"
                    title="Editar y calibrar imagen del banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Calibrar / Editar</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(banner)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors"
                    title="Eliminar banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
