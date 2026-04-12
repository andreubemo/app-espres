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
    <Modal open={open} title="Selector de partidas" onClose={handleClose}>
      <div className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div className="flex gap-2">
            {families.map((fam, index) => {
              const isActive = index === step;
              const isDone = completedFamilies[fam];

              return (
                <button
                  key={fam}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={[
                    "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-black text-white"
                      : isDone
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600",
                  ].join(" ")}
                >
                  {formatFamilyLabel(fam)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            {totalFamilies > 0
              ? `Familia ${step + 1} de ${totalFamilies}`
              : "Sin familias"}
          </span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {loadingCatalog && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            Cargando catálogo...
          </div>
        )}

        {!loadingCatalog && catalogError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {catalogError}
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies === 0 && (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
            No hay familias disponibles en el catálogo.
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
                    No hay partidas en esta familia.
                  </div>
                ) : (
                  items.map((item) => {
                    const selected = selectedItems[item.id];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item)}
                        className={`w-full rounded border p-3 text-left transition ${
                          selected
                            ? "border-neutral-900 bg-neutral-200"
                            : "border-neutral-200 bg-white hover:bg-neutral-50"
                        }`}
                      >
                        <div className="font-medium text-neutral-900">
                          {item.item}
                        </div>

                        {item.material ? (
                          <div className="mt-1 text-sm text-neutral-600">
                            {item.material}
                          </div>
                        ) : null}

                        <div className="mt-1 text-sm text-neutral-500">
                          {formatCurrency(item.unitPrice)} / {item.unit}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                {selectedList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
                    Selecciona una o varias partidas de esta familia.
                  </div>
                ) : (
                  selectedList.map((item) => {
                    const qty = quantities[item.id] ?? 1;
                    const lineTotal = qty * item.unitPrice;

                    return (
                      <div key={item.id} className="rounded border p-3">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900">
                              {item.item}
                            </div>
                            {item.material ? (
                              <div className="text-sm text-neutral-600">
                                {item.material}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            className="text-sm text-neutral-500 hover:text-neutral-900"
                          >
                            Quitar
                          </button>
                        </div>

                        <div className="grid gap-3">
                          <label className="text-sm">
                            <span className="mb-1 block text-neutral-600">
                              Cantidad
                            </span>
                            <input
                              type="number"
                              min={1}
                              step="0.01"
                              className="w-full rounded border border-neutral-200 p-2"
                              value={qty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                handleChangeQuantity(item.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                const input = e.currentTarget;
                                const isSingleDigit =
                                  e.key >= "0" && e.key <= "9";
                                const isAllSelected =
                                  input.selectionStart === 0 &&
                                  input.selectionEnd === input.value.length;

                                if (isSingleDigit && isAllSelected) {
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: Number(e.key),
                                  }));
                                  e.preventDefault();
                                }

                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  confirm();
                                }
                              }}
                            />
                          </label>

                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-600">
                              {formatCurrency(item.unitPrice)} / {item.unit}
                            </span>
                            <span className="font-medium text-neutral-900">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={goPrevFamily}
                disabled={step === 0}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goNextFamily}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm"
                >
                  {step < families.length - 1 ? "Saltar" : "Finalizar"}
                </button>

                <button
                  type="button"
                  onClick={confirm}
                  disabled={selectedList.length === 0}
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-40"
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