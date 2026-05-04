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
  clientId: string;
  date: string;
  complexity: BudgetComplexity;
  notes?: string;
  discountPercent?: number;
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

function normalizeDiscountPercent(value?: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, round(value ?? 0)));
}

function calculateTotals(
  lines: BudgetLine[],
  complexity: BudgetComplexity,
  discountPercent = 0
) {
  const subtotal = round(lines.reduce((sum, line) => sum + line.total, 0));
  const totalBeforeDiscount = round(subtotal * COMPLEXITY_FACTOR[complexity]);
  const normalizedDiscountPercent = normalizeDiscountPercent(discountPercent);
  const discountAmount = round(
    totalBeforeDiscount * (normalizedDiscountPercent / 100)
  );
  const total = round(Math.max(0, totalBeforeDiscount - discountAmount));

  return { subtotal, totalBeforeDiscount, discountAmount, total };
}

export function createEmptyBudget(data: CreateEmptyBudgetInput): Budget {
  return {
    code: data.code.trim(),
    project: data.project.trim(),
    clientId: data.clientId,
    date: data.date,
    complexity: data.complexity,
    notes: data.notes?.trim() ?? "",
    discountPercent: normalizeDiscountPercent(data.discountPercent),
    dimensions: calculateDimensions(data.width, data.length),
    lines: [],
    subtotal: 0,
    totalBeforeDiscount: 0,
    discountAmount: 0,
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
  const { subtotal, totalBeforeDiscount, discountAmount, total } =
    calculateTotals(lines, budget.complexity, budget.discountPercent);

  return {
    ...budget,
    lines,
    subtotal,
    totalBeforeDiscount,
    discountAmount,
    total,
  };
}

export function removeLine(budget: Budget, id: string): Budget {
  const lines = budget.lines.filter((line) => line.id !== id);
  const { subtotal, totalBeforeDiscount, discountAmount, total } =
    calculateTotals(lines, budget.complexity, budget.discountPercent);

  return {
    ...budget,
    lines,
    subtotal,
    totalBeforeDiscount,
    discountAmount,
    total,
  };
}

export function updateBudgetBase(
  budget: Budget,
  data: CreateEmptyBudgetInput
): Budget {
  const dimensions = calculateDimensions(data.width, data.length);
  const lines = budget.lines.map((line) => {
    const recalculatedQty = getQuantityByUnit(
      line.unit,
      {
        surfaceM2: dimensions.surfaceM2,
        perimeterML: dimensions.perimeterML,
      },
      line.quantity
    );
    const minimum = getMinimumByFamily(line.family);
    const quantity = round(
      minimum ? Math.max(recalculatedQty, minimum) : recalculatedQty
    );

    return {
      ...line,
      quantity,
      total: round(quantity * line.unitPrice),
    };
  });
  const discountPercent = normalizeDiscountPercent(data.discountPercent);
  const { subtotal, totalBeforeDiscount, discountAmount, total } =
    calculateTotals(lines, data.complexity, discountPercent);

  return {
    ...budget,
    code: data.code.trim(),
    project: data.project.trim(),
    clientId: data.clientId,
    date: data.date,
    complexity: data.complexity,
    notes: data.notes?.trim() ?? "",
    discountPercent,
    dimensions,
    lines,
    subtotal,
    totalBeforeDiscount,
    discountAmount,
    total,
  };
}

export function updateLineQuantity(
  budget: Budget,
  id: string,
  quantity: number
): Budget {
  const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  const lines = budget.lines.map((line) => {
    if (line.id !== id) return line;

    const nextQuantity = round(safeQuantity);

    return {
      ...line,
      quantity: nextQuantity,
      total: round(nextQuantity * line.unitPrice),
    };
  });
  const { subtotal, totalBeforeDiscount, discountAmount, total } =
    calculateTotals(lines, budget.complexity, budget.discountPercent);

  return {
    ...budget,
    lines,
    subtotal,
    totalBeforeDiscount,
    discountAmount,
    total,
  };
}
