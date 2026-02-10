export type BudgetComplexity = 'low' | 'medium' | 'high';

export interface BudgetLine {
  id: string;
  family: string;
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BudgetDimensions {
  width: number;
  length: number;
  surfaceM2: number;
  perimeterML: number;
}

export interface Budget {
  code: string;
  project: string;
  date: string;
  complexity: BudgetComplexity;
  dimensions: BudgetDimensions;
  lines: BudgetLine[];
  subtotal: number;
  total: number;
}
