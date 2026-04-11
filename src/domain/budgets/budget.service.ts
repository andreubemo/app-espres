import { v4 as uuid } from "uuid";
import { Budget, BudgetLine, BudgetComplexity } from "./budget.model";
import {
  COMPLEXITY_FACTOR,
  getMinimumByFamily,
  getQuantityByUnit,
  round,
} from "../rules/pricing.rules";

export type CreateEmptyBudgetInput = {
  code: string;
  project: string;
  date: string;
  complexity: BudgetComplexity;
  width: number;
  length: number;
};

export type AddBudgetLineInput = {
  catalogItemId: string;
  familyKey?: string;
  itemKey?: string;
  family: string;
  item: string;
  material?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

function calculateDimensions(width: number, length: number) {
  const safeWidth = Number.isFinite(width) ? width : 0;
  const safeLength = Number.isFinite(length) ? length : 0;

  const normalizedWidth = Math.max(0, safeWidth);
  const normalizedLength = Math.max(0, safeLength);

  const surfaceM2 = round(normalizedWidth * normalizedLength);
  const perimeterML = round((normalizedWidth + normalizedLength) * 2);

  return {
    width: normalizedWidth,
    length: normalizedLength,
    surfaceM2,
    perimeterML,
  };
}

function calculateTotals(lines: BudgetLine[], complexity: BudgetComplexity) {
  const subtotal = round(lines.reduce((sum, line) => sum + line.total, 0));
  const total = round(subtotal * COMPLEXITY_FACTOR[complexity]);

  return { subtotal, total };
}

export function createEmptyBudget(data: CreateEmptyBudgetInput): Budget {
  return {
    code: data.code.trim(),
    project: data.project.trim(),
    date: data.date,
    complexity: data.complexity,
    dimensions: calculateDimensions(data.width, data.length),
    lines: [],
    subtotal: 0,
    total: 0,
  };
}

export function addLine(budget: Budget, input: AddBudgetLineInput): Budget {
  const manualQty = Number.isFinite(input.quantity) ? input.quantity : 0;
  const safeManualQty = Math.max(0, manualQty);
  const safeUnitPrice = Number.isFinite(input.unitPrice) ? input.unitPrice : 0;

  const calculatedQty = getQuantityByUnit(
    input.unit,
    {
      surfaceM2: budget.dimensions.surfaceM2,
      perimeterML: budget.dimensions.perimeterML,
    },
    safeManualQty
  );

  const minimum = getMinimumByFamily(input.family);
  const finalQuantity = round(
    minimum ? Math.max(calculatedQty, minimum) : calculatedQty
  );

  const line: BudgetLine = {
    id: uuid(),
    catalogItemId: input.catalogItemId,
    familyKey: input.familyKey,
    itemKey: input.itemKey,
    family: input.family,
    item: input.item,
    material: input.material?.trim() || undefined,
    unit: input.unit,
    quantity: finalQuantity,
    unitPrice: round(safeUnitPrice),
    total: round(finalQuantity * safeUnitPrice),
  };

  const lines = [...budget.lines, line];
  const { subtotal, total } = calculateTotals(lines, budget.complexity);

  return {
    ...budget,
    lines,
    subtotal,
    total,
  };
}

export function removeLine(budget: Budget, id: string): Budget {
  const lines = budget.lines.filter((line) => line.id !== id);
  const { subtotal, total } = calculateTotals(lines, budget.complexity);

  return {
    ...budget,
    lines,
    subtotal,
    total,
  };
}