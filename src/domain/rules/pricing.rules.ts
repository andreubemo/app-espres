import { BudgetComplexity } from '../budgets/budget.model';

export const COMPLEXITY_FACTOR: Record<BudgetComplexity, number> = {
  low: 1,
  medium: 1.15,
  high: 1.3,
};

export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getQuantityByUnit(
  unit: string,
  dimensions: {
    surfaceM2: number;
    perimeterML: number;
  },
  manualQty: number
): number {
  switch (unit) {
    case 'm2':
      return dimensions.surfaceM2;
    case 'ml':
      return dimensions.perimeterML;
    default:
      return manualQty;
  }
}

export function getMinimumByFamily(family: string): number | null {
  const map: Record<string, number> = {
    tarima: 10,
    muro: 8,
  };
  return map[family.toLowerCase()] ?? null;
}
