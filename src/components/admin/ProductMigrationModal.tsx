'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  ArrowRight,
  X,
  Loader2,
  RefreshCw,
  Layers,
  FileCheck
} from 'lucide-react';
import {
  getLocalStoredProducts,
  migrateLocalProductsToSupabase,
  MigrationResult
} from '@/lib/services/migration';

interface ProductMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

export default function ProductMigrationModal({
  isOpen,
  onClose,
  onMigrationComplete,
}: ProductMigrationModalProps) {
  const [localCount, setLocalCount] = useState<number>(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setErrorMsg('');
      const locals = getLocalStoredProducts();
      setLocalCount(locals.length);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    setIsMigrating(true);
    setErrorMsg('');
    try {
      const res = await migrateLocalProductsToSupabase();
      setResult(res);
      onMigrationComplete();
    } catch (err: any) {
      console.error('Migration failed:', err);
      setErrorMsg(err.message || 'Error al ejecutar la migración.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                Migrar Productos Locales a Supabase
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Copia de forma segura los productos de tu navegador hacia la base de datos de producción.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isMigrating}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Initial / In-progress State */}
        {!result && (
          <div className="space-y-5">
            <div className="bg-purple-50/70 rounded-2xl p-4 sm:p-5 border border-purple-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Productos detectados localmente:
                </span>
                <span className="text-base sm:text-lg font-black text-purple-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-purple-200">
                  {localCount} productos
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Lee los productos de <code>localStorage (giva3d-catalog-storage)</code>.</li>
                <li>Compara por <b>slug</b> e <b>id</b> para evitar duplicar productos existentes.</li>
                <li>Migra imágenes primarias, galerías, variantes de color y escalas de precio.</li>
                <li><b>No borra nada de tu localStorage</b>, solo añade los que faltan en Supabase.</li>
              </ul>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isMigrating}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartMigration}
                disabled={isMigrating || localCount === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Migrando productos...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Iniciar Migración ({localCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Finished Result State */}
        {result && (
          <div className="space-y-6 animate-in fade-in">
            {/* Supabase Verification Highlight Banner */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">
                  Comprobación en tiempo real con Supabase
                </span>
                <h4 className="text-base sm:text-lg font-black text-emerald-950">
                  {result.currentDbTotal} productos ahora guardados en Supabase
                </h4>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encontrados</div>
                <div className="text-xl font-black text-slate-900 mt-1">{result.totalFound}</div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Migrados</div>
                <div className="text-xl font-black text-emerald-700 mt-1">+{result.migrated}</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Ya existían</div>
                <div className="text-xl font-black text-blue-700 mt-1">{result.alreadyExisting}</div>
              </div>

              <div className={`rounded-2xl p-3 border ${result.errorsCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Errores</div>
                <div className={`text-xl font-black mt-1 ${result.errorsCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {result.errorsCount}
                </div>
              </div>
            </div>

            {/* Error alerts if any */}
            {result.errors.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <h5 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Ocurrieron errores en los siguientes productos:
                </h5>
                <ul className="text-xs text-rose-800 space-y-1 list-disc list-inside">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <b>{err.name}:</b> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Items details log */}
            {result.items.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Detalle de productos procesados:
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                  {result.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                        {it.name}
                      </span>
                      {it.status === 'migrated' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          MIGRADO
                        </span>
                      )}
                      {it.status === 'already_exists' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                          <FileCheck className="w-3 h-3 text-blue-600" />
                          YA EXISTÍA
                        </span>
                      )}
                      {it.status === 'error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          ERROR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-purple-700 transition-colors shadow-sm"
              >
                <span>Listo / Actualizar Lista</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
