'use client';

import React from 'react';
import { Product } from '@/types';
import { getProductTiers, formatCurrency } from '@/lib/pricing';
import { CheckCircle2, TrendingDown } from 'lucide-react';

interface PriceTierTableProps {
  product: Product;
  currentQuantity: number;
  onSelectTier?: (units: number) => void;
}

export default function PriceTierTable({
  product,
  currentQuantity,
  onSelectTier,
}: PriceTierTableProps) {
  const tiers = getProductTiers(product);

  if (!product.hasTieredPricing || tiers.length <= 1) {
    return null;
  }

  return (
    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Escala de Precios por Volumen
          </h4>
        </div>
        <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
          Precios c/u
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiers.map((tier, idx) => {
          // Check if current quantity qualifies for this tier
          const isCurrentTier =
            idx === tiers.length - 1
              ? currentQuantity >= tier.minUnits
              : currentQuantity >= tier.minUnits && currentQuantity < tiers[idx + 1].minUnits;

          return (
            <button
              key={tier.tierLabel}
              type="button"
              onClick={() => onSelectTier && onSelectTier(tier.minUnits)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 relative ${
                isCurrentTier
                  ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-400/20'
                  : 'bg-white/70 border-slate-200 hover:border-purple-200 hover:bg-white'
              }`}
            >
              {isCurrentTier && (
                <div className="absolute -top-2 right-2 bg-purple-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>ACTIVO</span>
                </div>
              )}

              <div className="text-[11px] font-semibold text-slate-500">
                {tier.tierLabel}
              </div>

              <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                {formatCurrency(tier.unitPrice)}
                <span className="text-[10px] font-normal text-slate-400 ml-0.5">c/u</span>
              </div>

              {tier.savingsPercent ? (
                <div className="mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                  Ahorra {tier.savingsPercent}%
                </div>
              ) : (
                <div className="mt-1 text-[10px] text-slate-400">
                  Precio base
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-2.5 text-center sm:text-left">
        💡 El precio unitario se calcula de forma automática según la cantidad total que elijas.
      </p>
    </div>
  );
}
