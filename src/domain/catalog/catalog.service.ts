import { v4 as uuid } from 'uuid';
import { Budget, BudgetLine, BudgetComplexity } from '../budgets/budget.model';
import {
  COMPLEXITY_FACTOR,
  getQuantityByUnit,
  getMinimumByFamily,
  round,
} from '../rules/pricing.rules';
import catalogData from '../../data/catalog.json';
import pricesData from '../../data/prices.json';
import { Catalog, CatalogItem, Prices } from './catalog.model';

export function createEmptyBudget(data: {
  code: string;
  project: string;
  date: string;
  complexity: BudgetComplexity;
  width: number;
  length: number;
}): Budget {
  const surfaceM2 = round(data.width * data.length);
  const perimeterML = round((data.width + data.length) * 2);

  return {
    code: data.code,
    project: data.project,
    date: data.date,
    complexity: data.complexity,
    dimensions: {
      width: data.width,
      length: data.length,
      surfaceM2,
      perimeterML,
    },
    lines: [],
    subtotal: 0,
    total: 0,
  };
}

export function addLine(
  budget: Budget,
  input: {
    family: string;
    item: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }
): Budget {
  const baseQty = getQuantityByUnit(
    input.unit,
    budget.dimensions,
    input.quantity
  );

  const minimum = getMinimumByFamily(input.family);
  const finalQty = minimum ? Math.max(baseQty, minimum) : baseQty;

  const totalLine = round(finalQty * input.unitPrice);

  const line: BudgetLine = {
    id: uuid(),
    family: input.family,
    item: input.item,
    unit: input.unit,
    quantity: round(finalQty),
    unitPrice: round(input.unitPrice),
    total: totalLine,
  };

  const lines = [...budget.lines, line];
  const subtotal = round(lines.reduce((s, l) => s + l.total, 0));
  const total = round(subtotal * COMPLEXITY_FACTOR[budget.complexity]);

  return { ...budget, lines, subtotal, total };
}

export function removeLine(budget: Budget, id: string): Budget {
  const lines = budget.lines.filter((l) => l.id !== id);
  const subtotal = round(lines.reduce((s, l) => s + l.total, 0));
  const total = round(subtotal * COMPLEXITY_FACTOR[budget.complexity]);

  return { ...budget, lines, subtotal, total };
}

export function getCatalogFamilies(): string[] {
  return Object.keys(catalogData as Catalog);
}

export function getItemsByFamily(family: string): (CatalogItem & { unitPrice: number })[] {
  const items = (catalogData as Catalog)[family] || [];
  
  return items.map(item => ({
    ...item,
    unitPrice: (pricesData as Prices)[item.id]?.default || 0
  }));
}
