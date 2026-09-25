'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { 
  UploadCloud, 
  Star, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { ProductImageItem } from '@/types';

interface ProductImageUploaderProps {
  images: ProductImageItem[];
  onChange: (images: ProductImageItem[]) => void;
  onDeleteStoragePath?: (storagePath: string) => void;
  disabled?: boolean;
}

export default function ProductImageUploader({
  images,
  onChange,
  onDeleteStoragePath,
  disabled = false,
}: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  const processFiles = (files: FileList | File[]) => {
    setErrorMessage('');
    const newItems: ProductImageItem[] = [];

    Array.from(files).forEach((file) => {
      // Validate format
      const extension = file.name.split('.').pop()?.toLowerCase();
      const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
      
      if (!acceptedFormats.includes(file.type) && (!extension || !validExtensions.includes(extension))) {
        setErrorMessage(`Formato no compatible para "${file.name}". Solo JPG, JPEG, PNG y WEBP.`);
        return;
      }

      const tempId = `temp-img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id: tempId,
        imageUrl: previewUrl,
        previewUrl,
        file,
        isPrimary: false,
        sortOrder: images.length + newItems.length + 1,
      });
    });

    if (newItems.length === 0) return;

    const combined = [...images, ...newItems];

    // Ensure there is exactly ONE primary image: if none is primary, set the first one
    const hasPrimary = combined.some((item) => item.isPrimary);
    if (!hasPrimary && combined.length > 0) {
      combined[0].isPrimary = true;
    }

    // Re-index sort order
    const updated = combined.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    onChange(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    const updated = images.map((item, index) => ({
      ...item,
      isPrimary: index === indexToPrimary,
    }));
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const list = [...images];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const updated = list.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    const itemToRemove = images[index];
    
    // If it was already uploaded to storage, notify parent to delete physically
    if (itemToRemove.storagePath && onDeleteStoragePath) {
      onDeleteStoragePath(itemToRemove.storagePath);
    }

    const remaining = images.filter((_, i) => i !== index);

    // If we removed the primary image, make the first remaining image primary
    if (itemToRemove.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }

    const updated = remaining.map((item, idx) => ({
      ...item,
      sortOrder: idx + 1,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <label className="block text-sm font-black text-slate-900 uppercase tracking-wide">
            Subir imágenes del producto
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona fotos directamente desde tu PC para subirlas a Supabase Storage (<span className="text-purple-700 font-semibold">bucket: product-images</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs transition-all shadow-sm self-start sm:self-auto disabled:opacity-50"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Elegir fotos de la PC</span>
        </button>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dropzone Container */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-purple-500 bg-purple-50/70 scale-[1.01]'
            : 'border-slate-300 hover:border-purple-400 bg-slate-50/70 hover:bg-white'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">
              Haz clic aquí o arrastra tus fotografías desde tu PC
            </span>
            <span className="text-xs text-slate-500 block">
              Formatos admitidos: PNG, JPG, JPEG, WEBP (puedes elegir varias a la vez)
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnails Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Miniaturas y Orden de Galería</span>
            <span className="text-purple-600">⭐ = Foto visible en catálogo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {images.map((item, index) => {
              const previewSrc = item.previewUrl || item.imageUrl;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all group bg-white shadow-xs flex flex-col ${
                    item.isPrimary
                      ? 'border-amber-400 ring-2 ring-amber-300/40'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  {/* Image Display */}
                  <div className="relative aspect-square w-full bg-slate-100">
                    <Image
                      src={previewSrc}
                      alt={`Foto ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="160px"
                    />

                    {/* Primary Badge Overlay */}
                    {item.isPrimary && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>PRINCIPAL</span>
                      </div>
                    )}

                    {/* Order Badge */}
                    <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Controls Bar */}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    {/* Reorder: Move Left */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => { e.stopPropagation(); handleMove(index, 'left'); }}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Mover a la izquierda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Primary Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleSetPrimary(index); }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        item.isPrimary
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                      }`}
                      title={item.isPrimary ? 'Esta es la foto principal' : 'Marcar como foto principal'}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isPrimary ? 'fill-slate-950 text-slate-950' : 'text-slate-400'}`} />
                      <span className="hidden sm:inline">{item.isPrimary ? 'Principal' : 'Elegir'}</span>
                    </button>

                    {/* Reorder: Move Right */}
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleMove(index, 'right'); }}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                      title="Mover a la derecha"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                      title="Eliminar fotografía"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
