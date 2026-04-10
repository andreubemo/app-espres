import catalogData from "../../data/catalog.json";
import pricesData from "../../data/prices.json";
import { Catalog, CatalogItem, Prices } from "./catalog.model";

export function getCatalogFamilies(): string[] {
  return Object.keys(catalogData as Catalog);
}

export function getItemsByFamily(
  family: string
): (CatalogItem & { unitPrice: number })[] {
  const catalog = catalogData as Catalog;
  const prices = pricesData as Prices;

  const items = catalog[family] || [];

  return items.map((item) => ({
    ...item,
    unitPrice: prices[item.id]?.default ?? 0,
  }));
}