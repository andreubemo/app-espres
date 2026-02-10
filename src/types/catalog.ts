export type UnitType = 'm2' | 'unit' | 'hour' | 'day';

export interface CatalogItem {
  id: string;
  family: string;
  material: string;
  item: string;
  unit: UnitType;
}

export type Catalog = Record<string, CatalogItem[]>;
