import catalog from '@/data/catalog.json';
import prices from '@/data/prices.json';
import { CatalogItem } from '@/types/catalog';

export function getCatalogByFamily(familyKey: string): CatalogItem[] {
  return (catalog as Record<string, CatalogItem[]>)[familyKey] ?? [];
}

export function getDefaultPrice(itemId: string): number {
  return (prices as Record<string, { default: number }>)[itemId]?.default ?? 0;
}
