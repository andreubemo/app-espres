// src/domain/budgets/budget.calculations.ts

import { Budget, BudgetComplexity, BudgetLine } from './budget.model';

export const COMPLEXITY_FACTORS: Record<BudgetComplexity, number> = {
  low: 1,
  medium: 1.15,
  high: 1.3,
};

export function calculateLineTotal(
  quantity: number,
  unitPrice: number
): number {
  return Number((quantity * unitPrice).toFixed(2));
}

export function calculateBudgetSubtotal(lines: BudgetLine[]): number {
  return Number(
    lines.reduce((acc, line) => acc + line.total, 0).toFixed(2)
  );
}

export function calculateBudgetTotal(
  subtotal: number,
  complexity: BudgetComplexity
): number {
  const factor = COMPLEXITY_FACTORS[complexity];
  return Number((subtotal * factor).toFixed(2));
}

export function recalculateBudget(budget: Budget): Budget {
  const subtotal = calculateBudgetSubtotal(budget.lines);
  const factor = COMPLEXITY_FACTORS[budget.complexity];
  const total = calculateBudgetTotal(subtotal, budget.complexity);

  return {
    ...budget,
    subtotal,
    complexityFactor: factor,
    total,
  };
}
