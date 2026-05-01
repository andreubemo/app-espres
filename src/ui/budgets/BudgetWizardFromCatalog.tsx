"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function ActionIcon({ type }: { type: "previous" | "skip" | "add" }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "none",
    "aria-hidden": true,
  } as const;

  if (type === "previous") {
    return (
      <svg {...common}>
        <path
          d="M12.5 4.5 7 10l5.5 5.5M8 10h8"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (type === "skip") {
    return (
      <svg {...common}>
        <path
          d="M4.5 5.5 9 10l-4.5 4.5M10 5.5l4.5 4.5L10 14.5M15.5 5v10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
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

  const lastSelectedItemId = useRef<string | null>(null);
  const quantityInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError(null);

      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
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
        console.error("Error cargando catalogo:", error);
        setCatalogError("No se ha podido cargar el catalogo.");
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

  useEffect(() => {
    if (!lastSelectedItemId.current) return;

    const input = quantityInputs.current[lastSelectedItemId.current];
    input?.focus();
    input?.select();
    lastSelectedItemId.current = null;
  }, [selectedItems]);

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

  function resetCurrentFamilySelection() {
    setSelectedItems({});
    setQuantities({});
    lastSelectedItemId.current = null;
  }

  function resetWizardState() {
    setStep(0);
    resetCurrentFamilySelection();
    setCompletedFamilies({});
  }

  function handleClose() {
    resetWizardState();
    onClose();
  }

  function goToStep(index: number) {
    setStep(index);
    resetCurrentFamilySelection();
  }

  function goNextFamily() {
    if (currentFamily && selectedList.length > 0) {
      setCompletedFamilies((prev) => ({
        ...prev,
        [currentFamily]: true,
      }));
    }

    if (step < totalFamilies - 1) {
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
        lastSelectedItemId.current = item.id;
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
        <div className="shrink-0 border-b border-border bg-card-background px-3 py-2.5 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-5 text-text-strong">
                {currentFamily ? formatFamilyLabel(currentFamily) : "Sin familias"}
                {totalFamilies > 0 ? (
                  <span className="ml-1.5 text-sm font-medium text-text-neutral">
                    {step + 1}/{totalFamilies}
                  </span>
                ) : null}
              </h3>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase leading-3 text-text-neutral">
                Subtotal
              </p>
              <p className="text-sm font-semibold leading-5 text-text-strong">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>

          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-text-neutral">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {loadingCatalog ? (
          <div className="m-3 rounded-lg border border-border bg-card-background p-3 text-sm text-text-neutral">
            Cargando catalogo...
          </div>
        ) : null}

        {!loadingCatalog && catalogError ? (
          <div className="m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {catalogError}
          </div>
        ) : null}

        {!loadingCatalog && !catalogError && totalFamilies === 0 ? (
          <div className="m-3 rounded-lg border border-dashed border-border bg-card-background p-3 text-sm text-text-neutral">
            No hay familias disponibles en el catalogo.
          </div>
        ) : null}

        {!loadingCatalog && !catalogError && totalFamilies > 0 ? (
          <>
            <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden p-2 pb-1 lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-3 lg:p-3">
              <aside className="min-h-0 overflow-hidden rounded-lg border border-border bg-card-background lg:flex lg:flex-col">
                <div className="flex gap-1 overflow-x-auto p-1.5 lg:flex-col lg:overflow-y-auto">
                  {families.map((family, index) => {
                    const isActive = index === step;
                    const isDone = completedFamilies[family];

                    return (
                      <button
                        key={family}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={[
                          "flex h-7 shrink-0 items-center justify-between gap-2 rounded-md border px-2.5 text-left text-xs font-semibold transition lg:w-full",
                          isActive
                            ? "border-[#2b2926] bg-[#2b2926] text-white shadow-sm"
                            : isDone
                              ? "border-primary-soft bg-primary-soft/25 text-[#2b2926]"
                              : "border-transparent bg-[#f4f2ef] text-[#4c4741] hover:border-[#d8d3cc] hover:bg-card-background",
                        ].join(" ")}
                      >
                        <span className="truncate">
                          {formatFamilyLabel(family)}
                        </span>
                        {isDone ? (
                          <span className="shrink-0 text-primary">✓</span>
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

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface p-3 text-sm text-text-neutral">
                      No hay partidas en esta familia.
                    </div>
                  ) : (
                    items.map((item) => {
                      const selected = Boolean(selectedItems[item.id]);
                      const qty = quantities[item.id] ?? 1;
                      const lineTotal = qty * item.unitPrice;

                      return (
                        <div
                          key={item.id}
                          className={[
                            "rounded-lg border bg-card-background p-2.5 transition",
                            selected
                              ? "border-primary shadow-[0_0_0_1px_rgba(242,96,12,0.18)]"
                              : "border-border",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            className="group flex w-full items-start justify-between gap-3 text-left"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold leading-5 text-text-strong">
                                {item.item}
                              </span>
                              {item.material ? (
                                <span className="mt-0.5 block truncate text-xs leading-4 text-text-neutral">
                                  {item.material}
                                </span>
                              ) : null}
                            </span>

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
                          </button>

                          <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-neutral">
                            <span>
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </span>
                            {selected ? (
                              <span className="hidden rounded-full bg-primary px-2 py-0.5 font-semibold text-white sm:inline-flex">
                                Seleccionada
                              </span>
                            ) : null}
                          </div>

                          {selected ? (
                            <div className="mt-2 grid grid-cols-[1fr_auto] items-end gap-2 lg:hidden">
                              <label className="min-w-0 text-xs">
                                <span className="mb-1 block text-text-neutral">
                                  Unidades
                                </span>
                                <input
                                  ref={(node) => {
                                    quantityInputs.current[item.id] = node;
                                  }}
                                  type="number"
                                  inputMode="decimal"
                                  min={1}
                                  step="0.01"
                                  className="h-9 w-full rounded-md border border-border bg-card-background px-2 text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                                  value={qty}
                                  onFocus={(event) => event.target.select()}
                                  onChange={(event) =>
                                    handleChangeQuantity(
                                      item.id,
                                      event.target.value
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      confirm();
                                    }
                                  }}
                                />
                              </label>

                              <div className="pb-1 text-right text-sm font-semibold text-text-strong">
                                {formatCurrency(lineTotal)}
                              </div>
                            </div>
                          ) : null}
                        </div>
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
                              Unidades
                            </span>
                            <input
                              type="number"
                              min={1}
                              step="0.01"
                              className="h-9 w-full rounded-md border border-border bg-card-background px-2 text-sm text-text-strong outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                              value={qty}
                              onFocus={(event) => event.target.select()}
                              onChange={(event) =>
                                handleChangeQuantity(item.id, event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
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

            <div className="sticky bottom-0 z-20 shrink-0 border-t border-border bg-card-background/95 px-3 py-2 shadow-[0_-6px_16px_rgba(31,31,31,0.06)] backdrop-blur">
              <div className="mx-auto grid max-w-sm grid-cols-3 gap-2 sm:max-w-none sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={goPrevFamily}
                  disabled={step === 0}
                  aria-label="Anterior"
                  title="Anterior"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card-background text-text-neutral transition hover:border-[#2b2926] hover:text-[#2b2926] disabled:opacity-35 sm:w-28"
                >
                  <ActionIcon type="previous" />
                  <span className="hidden sm:ml-2 sm:inline">Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={goNextFamily}
                  aria-label={step < totalFamilies - 1 ? "Saltar" : "Finalizar"}
                  title={step < totalFamilies - 1 ? "Saltar" : "Finalizar"}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card-background text-text-neutral transition hover:border-[#2b2926] hover:text-[#2b2926] sm:w-28"
                >
                  <ActionIcon type="skip" />
                  <span className="hidden sm:ml-2 sm:inline">
                    {step < totalFamilies - 1 ? "Saltar" : "Finalizar"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={selectedList.length === 0}
                  aria-label={
                    step < totalFamilies - 1
                      ? "Anadir y seguir"
                      : "Anadir y cerrar"
                  }
                  title={
                    step < totalFamilies - 1
                      ? "Anadir y seguir"
                      : "Anadir y cerrar"
                  }
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary-strong disabled:opacity-45 sm:w-40"
                >
                  <ActionIcon type="add" />
                  <span className="hidden sm:ml-2 sm:inline">
                    {step < totalFamilies - 1
                      ? "Anadir y seguir"
                      : "Anadir y cerrar"}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
