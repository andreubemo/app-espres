export type BudgetComplexity = "low" | "medium" | "high";

export interface BudgetLine {
  id: string;
  family: string;
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  code: string;
  project: string;
  date: string;
  surfaceM2: number;
  complexity: BudgetComplexity;
  lines: BudgetLine[];
  subtotal: number;
  total: number;
}
