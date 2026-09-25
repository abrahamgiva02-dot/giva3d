import { Product, TierInfo } from '@/types';

/**
 * Formats a number to Soles currency string, e.g. "S/ 5.00"
 */
export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Calculates the applicable unit price according to the purchased quantity
 * based on the 4 tier levels: 1-5, 6-11, 12-23, 24+
 */
export function calculateUnitPrice(product: Product, quantity: number): number {
  if (!product.hasTieredPricing) {
    return product.price1;
  }

  if (quantity >= 24 && product.price24 !== undefined && product.price24 !== null) {
    return product.price24;
  }
  if (quantity >= 12 && product.price12 !== undefined && product.price12 !== null) {
    return product.price12;
  }
  if (quantity >= 6 && product.price6 !== undefined && product.price6 !== null) {
    return product.price6;
  }

  return product.price1;
}

/**
 * Returns the lowest unit price available for a product and its qualifying tier description
 * Used for marketplace-style cards: "S/ 4.00 c/u desde 24 unidades"
 */
export function getLowestUnitPriceInfo(product: Product): {
  lowestPrice: number;
  tierLabel: string;
  hasWholesale: boolean;
} {
  if (!product.hasTieredPricing) {
    return {
      lowestPrice: product.price1,
      tierLabel: '1 unidad',
      hasWholesale: false,
    };
  }

  if (product.price24 !== undefined && product.price24 !== null && product.price24 < product.price1) {
    return {
      lowestPrice: product.price24,
      tierLabel: 'Desde 24 unidades',
      hasWholesale: true,
    };
  }
  if (product.price12 !== undefined && product.price12 !== null && product.price12 < product.price1) {
    return {
      lowestPrice: product.price12,
      tierLabel: 'Desde 12 unidades',
      hasWholesale: true,
    };
  }
  if (product.price6 !== undefined && product.price6 !== null && product.price6 < product.price1) {
    return {
      lowestPrice: product.price6,
      tierLabel: 'Desde 6 unidades',
      hasWholesale: true,
    };
  }

  return {
    lowestPrice: product.price1,
    tierLabel: '1 unidad',
    hasWholesale: false,
  };
}

/**
 * Returns the list of all defined pricing tiers for display in product page tables
 */
export function getProductTiers(product: Product): TierInfo[] {
  const tiers: TierInfo[] = [
    {
      tierLabel: '1 unidad',
      minUnits: 1,
      unitPrice: product.price1,
    },
  ];

  if (product.hasTieredPricing) {
    if (product.price6 !== undefined && product.price6 !== null) {
      const savings = Math.round(((product.price1 - product.price6) / product.price1) * 100);
      tiers.push({
        tierLabel: '6 unidades',
        minUnits: 6,
        unitPrice: product.price6,
        savingsPercent: savings > 0 ? savings : undefined,
      });
    }

    if (product.price12 !== undefined && product.price12 !== null) {
      const savings = Math.round(((product.price1 - product.price12) / product.price1) * 100);
      tiers.push({
        tierLabel: '12 unidades',
        minUnits: 12,
        unitPrice: product.price12,
        savingsPercent: savings > 0 ? savings : undefined,
      });
    }

    if (product.price24 !== undefined && product.price24 !== null) {
      const savings = Math.round(((product.price1 - product.price24) / product.price1) * 100);
      tiers.push({
        tierLabel: '24+ unidades',
        minUnits: 24,
        unitPrice: product.price24,
        savingsPercent: savings > 0 ? savings : undefined,
      });
    }
  }

  return tiers;
}
