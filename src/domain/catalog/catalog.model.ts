export interface CatalogItem {
  id: string;
  family: string;
  material: string;
  item: string;
  unit: string;
}

export type Catalog = Record<string, CatalogItem[]>;

export interface PriceEntry {
  default: number;
}

export type Prices = Record<string, PriceEntry>;
