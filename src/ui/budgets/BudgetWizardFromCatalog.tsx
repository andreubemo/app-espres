"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
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

type ExistingWizardLine = {
  id: string;
  catalogItemId: string;
  familyKey?: string;
  family?: string;
  quantity: number;
};

type BudgetWizardFromCatalogProps = {
  open: boolean;
  existingLines?: ExistingWizardLine[];
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
  onUpdateExistingLineQuantity?: (lineId: string, quantity: number) => void;
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

function normalizeForMatch(value?: string) {
  return formatFamilyLabel(value).toLowerCase();
}

function lineBelongsToFamily(line: ExistingWizardLine, family: string) {
  const normalizedFamily = normalizeForMatch(family);

  return (
    normalizeForMatch(line.family) === normalizedFamily ||
    normalizeForMatch(line.familyKey) === normalizedFamily
  );
}

export default function BudgetWizardFromCatalog({
  open,
  existingLines = [],
  onAdd,
  onUpdateExistingLineQuantity,
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
  const [lastSelectedItemId, setLastSelectedItemId] = useState<string | null>(
    null
  );
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const existingLineByCatalogId = useMemo(() => {
    const map = new Map<string, ExistingWizardLine>();

    existingLines.forEach((line) => {
      if (line.catalogItemId) {
        map.set(line.catalogItemId, line);
      }
    });

    return map;
  }, [existingLines]);

  const selectedPanelItems = useMemo(() => {
    const includedItems = items.filter((item) =>
      existingLineByCatalogId.has(item.id)
    );
    const pendingItems = selectedList.filter(
      (item) => !existingLineByCatalogId.has(item.id)
    );

    return [...includedItems, ...pendingItems];
  }, [existingLineByCatalogId, items, selectedList]);

  const subtotal = useMemo(() => {
    return selectedPanelItems.reduce((acc, item) => {
      const existingLine = existingLineByCatalogId.get(item.id);
      const qty = existingLine?.quantity ?? quantities[item.id] ?? 1;
      return acc + item.unitPrice * qty;
    }, 0);
  }, [existingLineByCatalogId, quantities, selectedPanelItems]);

  useEffect(() => {
    if (!lastSelectedItemId || !selectedItems[lastSelectedItemId]) return;

    const input = quantityInputRefs.current[lastSelectedItemId];
    if (!input) return;

    input.focus();
    input.select();
  }, [lastSelectedItemId, selectedItems]);

  function resetWizardState() {
    setStep(0);
    setSelectedItems({});
    setQuantities({});
    setCompletedFamilies({});
    setLastSelectedItemId(null);
  }

  function handleClose() {
    resetWizardState();
    onClose();
  }

  function goToStep(index: number) {
    setStep(index);
    setSelectedItems({});
    setQuantities({});
    setLastSelectedItemId(null);
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
    if (existingLineByCatalogId.has(item.id)) return;

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

    setLastSelectedItemId(isSelected ? null : item.id);
  }

  function handleChangeQuantity(itemId: string, value: string) {
    const parsed = Number(value);

    setQuantities((prev) => ({
      ...prev,
      [itemId]: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
    }));
  }

  function handleExistingQuantityChange(lineId: string, value: string) {
    const parsed = Number(value);
    onUpdateExistingLineQuantity?.(
      lineId,
      Number.isFinite(parsed) && parsed > 0 ? parsed : 1
    );
  }

  function addSelectedItemsToBudget() {
    selectedList.forEach((item) => {
      if (existingLineByCatalogId.has(item.id)) return;

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
  }

  function confirm() {
    addSelectedItemsToBudget();
    goNextFamily();
  }

  function confirmAndClose() {
    addSelectedItemsToBudget();
    handleClose();
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
        <div className="shrink-0 border-b border-border bg-card-background px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-text-strong">
                {currentFamily
                  ? formatFamilyLabel(currentFamily)
                  : "Sin familias"}
                {totalFamilies > 0 ? ` — ${step + 1}/${totalFamilies}` : ""}
              </div>
            </div>

            <div className="shrink-0 text-right text-base font-semibold text-text-strong">
              {formatCurrency(subtotal)}
            </div>
          </div>

          <div className="mt-2">
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
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden p-2 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-3 lg:p-3">
              <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card-background">
                <div className="flex gap-1.5 overflow-auto p-1.5 lg:flex-col lg:p-2">
                  {families.map((family, index) => {
                    const isActive = index === step;
                    const hasExistingLines = existingLines.some((line) =>
                      lineBelongsToFamily(line, family)
                    );
                    const isDone = completedFamilies[family] || hasExistingLines;

                    return (
                      <button
                        key={family}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={[
                          "flex shrink-0 items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition sm:text-sm lg:w-full",
                          isActive
                            ? "border-primary bg-primary text-white shadow-sm"
                            : isDone
                            ? "border-primary-soft bg-primary-soft/40 text-text-strong"
                            : "border-transparent bg-surface text-text-neutral hover:border-border hover:text-text-strong",
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
                <div className="flex shrink-0 items-center justify-between border-b border-border px-2.5 py-1.5 sm:px-3 sm:py-2">
                  <h3 className="text-sm font-semibold text-text-strong">
                    Partidas
                  </h3>
                  <span className="text-xs text-text-neutral">
                    {items.length} disponibles
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-1.5 sm:space-y-2 sm:p-2.5">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-text-neutral">
                      No hay partidas en esta familia.
                    </div>
                  ) : (
                    items.map((item) => {
                      const existingLine = existingLineByCatalogId.get(item.id);
                      const isAlreadyIncluded = Boolean(existingLine);
                      const isPendingSelected = Boolean(selectedItems[item.id]);
                      const selected = isPendingSelected || isAlreadyIncluded;
                      const quantityValue = isAlreadyIncluded
                        ? existingLine?.quantity ?? 1
                        : quantities[item.id] ?? 1;

                      return (
                        <article
                          key={item.id}
                          className={[
                            "group relative w-full rounded-md border p-2 text-left transition sm:rounded-lg sm:p-2.5",
                            selected
                              ? "border-primary bg-primary-soft/20 shadow-sm"
                              : "border-border bg-card-background hover:border-primary-soft hover:bg-surface",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            className={[
                              "w-full text-left",
                              isAlreadyIncluded ? "cursor-default" : "",
                            ].join(" ")}
                            aria-label={
                              isAlreadyIncluded
                                ? `${item.item} ya incluida`
                                : item.item
                            }
                          >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="line-clamp-2 text-sm font-medium leading-4 text-text-strong sm:leading-5">
                                {item.item}
                              </div>

                              {item.material ? (
                                <div className="mt-0.5 hidden text-xs leading-4 text-text-neutral sm:block">
                                  {item.material}
                                </div>
                              ) : null}
                            </div>

                            <span
                              className={[
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition sm:h-5 sm:w-5 sm:text-xs",
                                selected
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-card-background text-transparent group-hover:border-primary-soft",
                              ].join(" ")}
                            >
                              ✓
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-text-neutral">
                            <span>
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </span>
                            {selected ? (
                              <span className="font-semibold text-primary">
                                {isAlreadyIncluded
                                  ? "Ya incluida"
                                  : "Seleccionada"}
                              </span>
                            ) : null}
                          </div>
                          </button>

                          {selected ? (
                            <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_72px_32px] items-center gap-2 lg:hidden">
                              <div className="truncate text-xs font-medium text-text-strong">
                                {item.item}
                              </div>

                              <label className="text-xs">
                                <span className="sr-only">Cantidad</span>
                                <input
                                  ref={(node) => {
                                    quantityInputRefs.current[item.id] = node;
                                  }}
                                  type="number"
                                  min={1}
                                  step="0.01"
                                  className="h-8 w-full rounded-md border border-border bg-card-background px-2 text-center text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                                  value={quantityValue}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    if (existingLine) {
                                      handleExistingQuantityChange(
                                        existingLine.id,
                                        e.target.value
                                      );
                                      return;
                                    }

                                    handleChangeQuantity(item.id, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      confirm();
                                    }
                                  }}
                                />
                              </label>

                              {isAlreadyIncluded ? (
                                <span
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold text-primary"
                                  title="Ya incluida"
                                >
                                  ✓
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleItem(item)}
                                  className="flex h-8 w-8 items-center justify-center rounded-md text-base font-semibold text-text-neutral transition hover:bg-surface hover:text-primary"
                                  aria-label={`Quitar ${item.item}`}
                                  title="Quitar"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="hidden min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card-background lg:flex">
                <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
                  <h3 className="text-sm font-semibold text-text-strong">
                    Seleccionadas
                  </h3>
                  <span className="text-xs text-text-neutral">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
                  {selectedPanelItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-4 text-sm text-text-neutral">
                      Selecciona una o varias partidas de esta familia.
                    </div>
                  ) : (
                    selectedPanelItems.map((item) => {
                      const existingLine = existingLineByCatalogId.get(item.id);
                      const isAlreadyIncluded = Boolean(existingLine);
                      const qty = isAlreadyIncluded
                        ? existingLine?.quantity ?? 1
                        : quantities[item.id] ?? 1;
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

                            {isAlreadyIncluded ? (
                              <span className="shrink-0 text-xs font-semibold text-primary">
                                Ya incluida
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleItem(item)}
                                className="shrink-0 text-xs font-medium text-text-neutral hover:text-primary"
                              >
                                Quitar
                              </button>
                            )}
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
                              onChange={(e) => {
                                if (existingLine) {
                                  handleExistingQuantityChange(
                                    existingLine.id,
                                    e.target.value
                                  );
                                  return;
                                }

                                handleChangeQuantity(item.id, e.target.value);
                              }}
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

            <div className="sticky bottom-0 z-10 grid shrink-0 grid-cols-4 items-center border-t border-border bg-card-background px-2 py-1.5 sm:flex sm:items-center sm:justify-between sm:px-4 sm:py-3">
              <button
                type="button"
                onClick={goPrevFamily}
                disabled={step === 0}
                className="mx-auto flex h-10 w-12 items-center justify-center rounded-full text-text-strong transition hover:bg-surface disabled:opacity-35 sm:mx-0 sm:h-11 sm:w-auto sm:min-w-28 sm:rounded-md sm:border sm:border-border sm:bg-card-background sm:px-3 sm:text-sm"
                aria-label="Anterior"
                title="Anterior"
              >
                <ChevronLeft
                  aria-hidden="true"
                  className="h-6 w-6 sm:hidden"
                  strokeWidth={2.25}
                />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="contents sm:flex sm:gap-2">
                <button
                  type="button"
                  onClick={goNextFamily}
                  className="mx-auto flex h-10 w-12 items-center justify-center rounded-full text-text-strong transition hover:bg-surface sm:mx-0 sm:h-11 sm:w-auto sm:min-w-28 sm:rounded-md sm:border sm:border-border sm:bg-card-background sm:px-3 sm:text-sm"
                  aria-label={
                    step < families.length - 1
                      ? "Siguiente familia"
                      : "Cerrar selector"
                  }
                  title={
                    step < families.length - 1
                      ? "Siguiente familia"
                      : "Cerrar selector"
                  }
                >
                  <ChevronRight
                    aria-hidden="true"
                    className="h-6 w-6 sm:hidden"
                    strokeWidth={2.25}
                  />
                  <span className="hidden sm:inline">
                    {step < families.length - 1 ? "Siguiente" : "Cerrar"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={selectedList.length === 0}
                  className="mx-auto flex h-10 w-12 items-center justify-center rounded-full text-text-strong transition hover:bg-surface disabled:opacity-45 sm:mx-0 sm:h-11 sm:w-auto sm:min-w-36 sm:rounded-md sm:bg-primary sm:px-3 sm:text-sm sm:text-white sm:hover:bg-primary-strong"
                  aria-label={
                    step < families.length - 1
                      ? "Añadir y seguir"
                      : "Añadir y cerrar"
                  }
                  title={
                    step < families.length - 1
                      ? "Añadir y seguir"
                      : "Añadir y cerrar"
                  }
                >
                  <Plus
                    aria-hidden="true"
                    className="h-6 w-6 sm:hidden"
                    strokeWidth={2.5}
                  />
                  <span className="hidden sm:inline">
                    {step < families.length - 1
                      ? "Añadir y seguir"
                      : "Añadir"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={confirmAndClose}
                  className="mx-auto flex h-10 w-12 items-center justify-center rounded-full border border-primary bg-primary text-white transition hover:bg-primary-strong sm:mx-0 sm:h-11 sm:w-auto sm:min-w-36 sm:rounded-md sm:px-3 sm:text-sm"
                  aria-label="Aceptar partidas y cerrar"
                  title="Aceptar partidas y cerrar"
                >
                  <Check
                    aria-hidden="true"
                    className="h-6 w-6 sm:hidden"
                    strokeWidth={2.5}
                  />
                  <span className="hidden sm:inline">Aceptar y cerrar</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
