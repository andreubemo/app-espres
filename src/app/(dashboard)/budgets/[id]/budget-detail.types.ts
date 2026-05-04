export type StoredBudgetLine = {
  id?: string;
  catalogItemId?: string;
  family?: string;
  item?: string;
  material?: string | null;
  familyKey?: string;
  itemKey?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  snapshot?: {
    family?: string;
    item?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  };
};

export type StoredBudgetData = {
  code?: string;
  project?: string;
  clientId?: string;
  date?: string;
  complexity?: string;
  notes?: string;
  discountPercent?: number;
  dimensions?: {
    width?: number;
    length?: number;
    surfaceM2?: number;
    perimeterML?: number;
  };
  lines?: StoredBudgetLine[];
  subtotal?: number;
  totalBeforeDiscount?: number;
  discountAmount?: number;
  total?: number;
};

export type BudgetVersionHistoryItem = {
  id: string;
  version: number;
  sent: boolean;
  createdAt: string;
  project: string;
  lineCount: number;
  total: number;
  isCurrent: boolean;
  isViewed: boolean;
};
