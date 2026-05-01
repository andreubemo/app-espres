"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";

type WizardItem = {
  id: string;
  familyKey?: string;
  itemKey?: string;
  family: string;
  material?: string;
  item: string;
  unit: string;
  unitPrice: number;
};

type CatalogApiResponse = {
  families: string[];
  itemsByFamily: Record<string, WizardItem[]>;
};

type BudgetWizardFromCatalogProps = {
  open: boolean;
  onAdd: (line: {
    catalogItemId: string;
    familyKey?: string;
    itemKey?: string;
    family: string;
    item: string;
    material?: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }) => void;
  onClose: () => void;
};

function formatCurrency(value?: number) {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(safeValue);
}

function formatFamilyLabel(value?: string) {
  if (!value) return "Sin familia";

  return value.replace(/_/g, " ").replace(/\s+/g, " ").trim();
}

export default function BudgetWizardFromCatalog({
  open,
  onAdd,
  onClose,
}: BudgetWizardFromCatalogProps) {
  const [families, setFamilies] = useState<string[]>([]);
  const [itemsByFamily, setItemsByFamily] = useState<
    Record<string, WizardItem[]>
  >({});
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, WizardItem>>(
    {}
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [completedFamilies, setCompletedFamilies] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError(null);

      try {
        const res = await fetch("/api/catalog", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Error HTTP ${res.status}`);
        }

        const data = (await res.json()) as CatalogApiResponse;

        if (cancelled) return;

        setFamilies(Array.isArray(data.families) ? data.families : []);
        setItemsByFamily(
          data.itemsByFamily && typeof data.itemsByFamily === "object"
            ? data.itemsByFamily
            : {}
        );
      } catch (error) {
        if (cancelled) return;

        console.error("Error cargando catálogo:", error);
        setCatalogError("No se ha podido cargar el catálogo.");
        setFamilies([]);
        setItemsByFamily({});
      } finally {
        if (!cancelled) {
          setLoadingCatalog(false);
        }
      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalFamilies = families.length;
  const currentFamily = families[step] ?? null;
  const progress = totalFamilies > 0 ? ((step + 1) / totalFamilies) * 100 : 0;

  const items = useMemo(() => {
    if (!currentFamily) return [];
    return itemsByFamily[currentFamily] ?? [];
  }, [currentFamily, itemsByFamily]);

  const selectedList = useMemo(
    () => Object.values(selectedItems),
    [selectedItems]
  );

  const subtotal = useMemo(() => {
    return selectedList.reduce((acc, item) => {
      const qty = quantities[item.id] ?? 1;
      return acc + item.unitPrice * qty;
    }, 0);
  }, [selectedList, quantities]);

  function resetWizardState() {
    setStep(0);
    setSelectedItems({});
    setQuantities({});
    setCompletedFamilies({});
  }

  function handleClose() {
    resetWizardState();
    onClose();
  }

  function goToStep(index: number) {
    setStep(index);
    setSelectedItems({});
    setQuantities({});
  }

  function goNextFamily() {
    if (currentFamily && selectedList.length > 0) {
      setCompletedFamilies((prev) => ({
        ...prev,
        [currentFamily]: true,
      }));
    }

    if (step < families.length - 1) {
      goToStep(step + 1);
      return;
    }

    handleClose();
  }

  function goPrevFamily() {
    if (step > 0) {
      goToStep(step - 1);
    }
  }

  function toggleItem(item: WizardItem) {
    const isSelected = Boolean(selectedItems[item.id]);

    setSelectedItems((prev) => {
      const next = { ...prev };

      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }

      return next;
    });

    setQuantities((prev) => {
      if (isSelected) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }

      return {
        ...prev,
        [item.id]: prev[item.id] ?? 1,
      };
    });
  }

  function handleChangeQuantity(itemId: string, value: string) {
    const parsed = Number(value);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
    }));
  }

  function confirm() {
    selectedList.forEach((item) => {
      onAdd({
        catalogItemId: item.id,
        familyKey: item.familyKey,
        itemKey: item.itemKey,
        family: item.family,
        item: item.item,
        material: item.material,
        unit: item.unit,
        quantity: quantities[item.id] ?? 1,
        unitPrice: item.unitPrice,
      });
    });

    goNextFamily();
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="Selector de partidas"
      onClose={handleClose}
      size="wide"
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-app-background">
        <div className="shrink-0 border-b border-border bg-card-background px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase text-primary">
                Selección guiada
              </div>
              <div className="truncate text-base font-semibold text-text-strong">
                {currentFamily
                  ? formatFamilyLabel(currentFamily)
                  : "Sin familias"}
              </div>
              <div className="text-xs text-text-neutral">
                {totalFamilies > 0
                  ? `Familia ${step + 1} de ${totalFamilies}`
                  : "No hay familias disponibles"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <div className="text-xs text-text-neutral">Seleccionadas</div>
                <div className="text-sm font-semibold text-text-strong">
                  {selectedList.length}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface px-3 py-2">
                <div className="text-xs text-text-neutral">Subtotal</div>
                <div className="text-sm font-semibold text-text-strong">
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-text-neutral">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {loadingCatalog && (
          <div className="m-4 rounded-lg border border-border bg-card-background p-4 text-sm text-text-neutral">
            Cargando catálogo...
          </div>
        )}

        {!loadingCatalog && catalogError && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {catalogError}
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies === 0 && (
          <div className="m-4 rounded-lg border border-dashed border-border bg-card-background p-4 text-sm text-text-neutral">
            No hay familias disponibles en el catálogo.
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies > 0 && (
          <>
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(180px,1fr)_minmax(180px,0.85fr)] gap-3 overflow-hidden p-3 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:grid-rows-1">
              <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card-background">
                <div className="shrink-0 border-b border-border px-3 py-2 text-xs font-semibold uppercase text-text-neutral">
                  Familias
                </div>

                <div className="flex gap-1.5 overflow-auto p-2 lg:flex-col">
                  {families.map((family, index) => {
                    const isActive = index === step;
                    const isDone = completedFamilies[family];

                    return (
                      <button
                        key={family}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={[
                          "flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition lg:w-full",
                          isActive
                            ? "bg-primary text-white"
                            : isDone
                            ? "bg-primary-soft/35 text-text-strong"
                            : "bg-card-background text-text-neutral hover:bg-surface hover:text-text-strong",
                        ].join(" ")}
                      >
                        <span className="truncate">
                          {formatFamilyLabel(family)}
                        </span>
                        {isDone ? (
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card-background">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-text-strong">
                    Partidas
                  </h3>
                  <span className="text-xs text-text-neutral">
                    {items.length} disponibles
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-text-neutral">
                      No hay partidas en esta familia.
                    </div>
                  ) : (
                    items.map((item) => {
                      const selected = Boolean(selectedItems[item.id]);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => toggleItem(item)}
                          className={[
                            "group relative w-full rounded-lg border p-3 text-left transition",
                            selected
                              ? "border-primary bg-primary-soft/20 shadow-sm"
                              : "border-border bg-card-background hover:border-primary-soft hover:bg-surface",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-text-strong">
                                {item.item}
                              </div>

                              {item.material ? (
                                <div className="mt-0.5 text-xs leading-5 text-text-neutral">
                                  {item.material}
                                </div>
                              ) : null}
                            </div>

                            <span
                              className={[
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition",
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-card-background text-transparent group-hover:border-primary-soft",
                              ].join(" ")}
                            >
                              ✓
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-neutral">
                            <span>
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </span>
                            {selected ? (
                              <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-white">
                                Seleccionada
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card-background">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-text-strong">
                    Seleccionadas
                  </h3>
                  <span className="text-xs text-text-neutral">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                  {selectedList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-text-neutral">
                      Selecciona una o varias partidas de esta familia.
                    </div>
                  ) : (
                    selectedList.map((item) => {
                      const qty = quantities[item.id] ?? 1;
                      const lineTotal = qty * item.unitPrice;

                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border bg-card-background p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-text-strong">
                                {item.item}
                              </div>
                              {item.material ? (
                                <div className="text-xs leading-5 text-text-neutral">
                                  {item.material}
                                </div>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleItem(item)}
                              className="shrink-0 text-xs font-medium text-text-neutral hover:text-primary"
                            >
                              Quitar
                            </button>
                          </div>

                          <label className="text-xs">
                            <span className="mb-1 block text-text-neutral">
                              Cantidad
                            </span>
                            <input
                              type="number"
                              min={1}
                              step="0.01"
                              className="h-9 w-full rounded-md border border-border bg-card-background px-2 text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                              value={qty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleChangeQuantity(item.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  confirm();
                                }
                              }}
                            />
                          </label>

                          <div className="mt-2 flex justify-between gap-3 text-xs">
                            <span className="text-text-neutral">
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </span>
                            <span className="font-semibold text-text-strong">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goPrevFamily}
                disabled={step === 0}
                className="rounded-md border border-border bg-card-background px-4 py-2 text-sm font-medium text-text-neutral transition hover:bg-surface hover:text-text-strong disabled:opacity-40"
              >
                ← Anterior
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={goNextFamily}
                  className="rounded-md border border-border bg-card-background px-4 py-2 text-sm font-medium text-text-neutral transition hover:bg-surface hover:text-text-strong"
                >
                  {step < families.length - 1 ? "Saltar" : "Finalizar"}
                </button>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={selectedList.length === 0}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-45"
                >
                  {step < families.length - 1
                    ? "Añadir y seguir →"
                    : "Añadir y cerrar"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
