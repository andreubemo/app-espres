export type BudgetComplexity = "low" | "medium" | "high";

/**
 * Línea de presupuesto enriquecida:
 * - Mantiene referencia al catálogo (clave para trazabilidad y edición futura)
 * - Mantiene snapshot de datos visibles (por si el catálogo cambia)
 */
export interface BudgetLine {
  id: string;

  // 🔗 Referencia al catálogo (clave)
  catalogItemId: string;

  // 🧠 Identidad técnica (útil para lógica futura)
  familyKey?: string;
  itemKey?: string;

  // 🧾 Snapshot visible (lo que verá el cliente)
  family: string;
  item: string;
  material?: string;

  // 📐 Datos de cálculo
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

  // 🔥 líneas ya preparadas para persistencia real
  lines: BudgetLine[];

  subtotal: number;
  total: number;
}