// src/domain/budgets/budget.wizard.config.ts

export interface BudgetCategoryStep {
  key: string;
  label: string;
}

export const BUDGET_CATEGORY_STEPS: BudgetCategoryStep[] = [
  { key: 'tarima', label: 'Tarima' },
  { key: 'muro', label: 'Muro' },
  { key: 'banner', label: 'Banner' },
  { key: 'viga', label: 'Viga' },
  { key: 'pilar', label: 'Pilar' },
  { key: 'podium', label: 'Podium' },
  { key: 'techos', label: 'Techos' },
  { key: 'backlights', label: 'Backlights' },
  { key: 'liston', label: 'Listón' },
  { key: 'perfil', label: 'Perfil' },
  { key: 'mostrador', label: 'Mostrador' },
  { key: 'mesa', label: 'Mesa' },
  { key: 'jardinera', label: 'Jardinera' },
  { key: 'panel', label: 'Panel' },
  { key: 'tapetas', label: 'Tapetas' },
  { key: 'curvas', label: 'Curvas' },
  { key: 'mecanizados', label: 'Mecanizados' },
  { key: 'herrero', label: 'Herrero' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'logistica-personal', label: 'Logística y Personal' },
];
