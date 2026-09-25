'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Gamepad2, 
  Heart, 
  Award, 
  Home, 
  Sparkles, 
  Wrench, 
  Car, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCatalogStore } from '@/lib/store/catalog-store';

const ICON_MAP: Record<string, React.ReactNode> = {
  Gamepad2: <Gamepad2 className="w-6 h-6 text-purple-600" />,
  Heart: <Heart className="w-6 h-6 text-rose-500" />,
  Award: <Award className="w-6 h-6 text-amber-500" />,
  Home: <Home className="w-6 h-6 text-emerald-500" />,
  Sparkles: <Sparkles className="w-6 h-6 text-cyan-500" />,
  Wrench: <Wrench className="w-6 h-6 text-slate-700" />,
  Car: <Car className="w-6 h-6 text-blue-600" />,
  Layers: <Layers className="w-6 h-6 text-purple-600" />,
};

export default function CategoryGrid() {
  const { categories } = useCatalogStore();
  const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            Explora por Colección
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Categorías Principales
          </h2>
        </div>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-800 transition-colors"
        >
          <span>Ver catálogo completo</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5">
        {sorted.map((cat) => {
          const isCustomPiece = cat.slug === 'diseno-a-medida';

          return (
            <Link
              key={cat.id}
              href={`/categoria/${cat.slug}`}
              className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isCustomPiece
                  ? 'bg-gradient-to-br from-purple-50 via-white to-cyan-50 border-purple-300 shadow-md ring-1 ring-purple-400/20'
                  : 'bg-white border-slate-200/80 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-purple-100/70 flex items-center justify-center transition-colors">
                    {ICON_MAP[cat.iconName] || <Layers className="w-6 h-6 text-purple-600" />}
                  </div>
                  {isCustomPiece && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-gradient-brand text-white px-2 py-0.5 rounded-full shadow-xs">
                      A MEDIDA
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-purple-700 transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {cat.description}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100/80 flex items-center text-[11px] font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                <span>{isCustomPiece ? 'Solicitar cotización' : 'Ver productos'}</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
