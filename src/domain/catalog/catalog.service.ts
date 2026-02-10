import catalog from '@/data/catalog.json';
import prices from '@/data/prices.json';
import { Catalog, CatalogItem, Prices } from './catalog.model';

const typedCatalog: Catalog = catalog;
const typedPrices: Prices = prices;

export interface CatalogItemWithPrice extends CatalogItem {
  unitPrice: number;
}

export function getCatalogFamilies(): string[] {
  return Object.keys(typedCatalog);
}

export function getItemsByFamily(
  familyKey: string
): CatalogItemWithPrice[] {
  const items = typedCatalog[familyKey] ?? [];

  return items.map((item) => ({
    ...item,
    unitPrice: typedPrices[item.id]?.default ?? 0,
  }));
}
