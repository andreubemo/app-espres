import { Budget, BudgetLine, BudgetComplexity } from "./budget.model";
import { v4 as uuid } from "uuid";

const COMPLEXITY_FACTOR: Record<BudgetComplexity, number> = {
  low: 1,
  medium: 1.15,
  high: 1.3,
};

export function createEmptyBudget(data: {
  code: string;
  project: string;
  date: string;
  surfaceM2: number;
  complexity: BudgetComplexity;
}): Budget {
  return {
    code: data.code,
    project: data.project,
    date: data.date,
    complexity: data.complexity,
    dimensions: {
      width: 0,
      length: 0,
      surfaceM2: data.surfaceM2,
      perimeterML: 0,
    },
    lines: [],
    subtotal: 0,
    total: 0,
  };
}

export function addLine(
  budget: Budget,
  line: Omit<BudgetLine, "id" | "total">
): Budget {
  const newLine: BudgetLine = {
    ...line,
    id: uuid(),
    total: line.quantity * line.unitPrice,
  };

  const lines = [...budget.lines, newLine];
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const total = subtotal * COMPLEXITY_FACTOR[budget.complexity];

  return { ...budget, lines, subtotal, total };
}

export function removeLine(budget: Budget, id: string): Budget {
  const lines = budget.lines.filter((l) => l.id !== id);
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const total = subtotal * COMPLEXITY_FACTOR[budget.complexity];

  return { ...budget, lines, subtotal, total };
}
