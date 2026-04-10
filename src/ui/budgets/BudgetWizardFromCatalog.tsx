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

export default function BudgetWizardFromCatalog({
  open,
  onAdd,
  onClose,
}: {
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
}) {
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

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedItems({});
      setQuantities({});
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoadingCatalog(true);
      setCatalogError(null);

      try {
        const response = await fetch("/api/catalog", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`);
        }

        const data = (await response.json()) as CatalogApiResponse;

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

  const items = useMemo<WizardItem[]>(() => {
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

  const canGoBack = step > 0;
  const isLastStep = totalFamilies === 0 || step >= totalFamilies - 1;
  const canConfirm = selectedList.length > 0;

  function resetSelection() {
    setSelectedItems({});
    setQuantities({});
  }

  function goNextFamily() {
    if (isLastStep) {
      onClose();
      return;
    }

    resetSelection();
    setStep((current) => current + 1);
  }

  function goPrevFamily() {
    resetSelection();
    setStep((current) => Math.max(current - 1, 0));
  }

  function toggleItemSelection(item: WizardItem) {
    const isAlreadySelected = Boolean(selectedItems[item.id]);

    setSelectedItems((current) => {
      const next = { ...current };

      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = item;
      }

      return next;
    });

    setQuantities((current) => {
      if (isAlreadySelected) {
        const next = { ...current };
        delete next[item.id];
        return next;
      }

      return {
        ...current,
        [item.id]: current[item.id] ?? 1,
      };
    });

    if (!isAlreadySelected) {
      setTimeout(() => {
        const input = inputRefs.current[item.id];
        if (input) {
          input.focus();
          input.select();
        }
      }, 0);
    }
  }

  function removeSelectedItem(itemId: string) {
    setSelectedItems((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });

    setQuantities((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  function handleChangeQuantity(itemId: string, value: string) {
    const parsed = Number(value);

    setQuantities((current) => ({
      ...current,
      [itemId]: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
    }));
  }

  function confirmAddSelected() {
    if (!canConfirm) return;

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
    <Modal open={open} title="Añadir partidas" onClose={onClose}>
      <div className="flex max-h-[78vh] flex-col">
        <div className="border-b pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                {totalFamilies > 0
                  ? `Familia ${step + 1} de ${totalFamilies}`
                  : "Sin familias disponibles"}
              </p>

              <h3 className="font-semibold capitalize">
                {currentFamily?.replace(/_/g, " ") || "Sin familia"}
              </h3>
            </div>

            <div className="text-right text-sm text-gray-500">
              <div>{selectedList.length} seleccionadas</div>
              <div>{subtotal.toFixed(2)} € subtotal</div>
            </div>
          </div>
        </div>

        {loadingCatalog && (
          <div className="py-6">
            <p className="text-sm text-gray-500">Cargando catálogo...</p>
          </div>
        )}

        {!loadingCatalog && catalogError && (
          <div className="py-6">
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {catalogError}
            </div>
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies === 0 && (
          <div className="py-6">
            <p className="text-sm text-gray-500">
              No hay familias disponibles en el catálogo.
            </p>
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies > 0 && (
          <div className="grid min-h-0 flex-1 gap-4 pt-4 md:grid-cols-[1.5fr_1fr]">
            <div className="min-h-0 rounded border">
              <div className="border-b bg-gray-50 px-3 py-2 text-sm font-medium">
                Opciones de la familia
              </div>

              <div className="max-h-[48vh] overflow-y-auto p-3">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay partidas en esta familia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((it) => {
                      const isSelected = Boolean(selectedItems[it.id]);

                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggleItemSelection(it)}
                          className={`w-full rounded border p-3 text-left transition ${
                            isSelected
                              ? "border-black bg-gray-100"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium">{it.item}</div>

                              {it.material && (
                                <div className="text-sm text-gray-500">
                                  {it.material}
                                </div>
                              )}

                              <div className="mt-1 text-sm text-gray-600">
                                {it.unitPrice} € / {it.unit}
                              </div>
                            </div>

                            <div
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                                isSelected
                                  ? "border-black bg-black text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="min-h-0 rounded border">
              <div className="border-b bg-gray-50 px-3 py-2 text-sm font-medium">
                Selección actual
              </div>

              <div className="max-h-[48vh] overflow-y-auto p-3">
                {selectedList.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Selecciona una o varias partidas de esta familia.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedList.map((item) => {
                      const qty = quantities[item.id] ?? 1;
                      const lineTotal = qty * item.unitPrice;

                      return (
                        <div
                          key={item.id}
                          className="rounded border border-gray-200 p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium">{item.item}</div>

                              {item.material && (
                                <div className="text-sm text-gray-500">
                                  {item.material}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              className="text-sm text-gray-500 hover:text-black"
                              onClick={() => removeSelectedItem(item.id)}
                            >
                              Quitar
                            </button>
                          </div>

                          <div className="grid gap-3">
                            <label className="text-sm">
                              <span className="mb-1 block text-gray-600">
                                Cantidad
                              </span>

                              <input
                                ref={(el) => {
                                  inputRefs.current[item.id] = el;
                                }}
                                type="number"
                                min={1}
                                step="0.01"
                                className="w-full rounded border p-2"
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
                                    setQuantities((current) => ({
                                      ...current,
                                      [item.id]: Number(e.key),
                                    }));
                                    e.preventDefault();
                                  }

                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    confirmAddSelected();
                                  }
                                }}
                              />
                            </label>

                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>
                                {item.unitPrice} € / {item.unit}
                              </span>
                              <span className="font-medium text-black">
                                {lineTotal.toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 border-t pt-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              {selectedList.length > 0
                ? `${selectedList.length} partidas preparadas · ${subtotal.toFixed(
                    2
                  )} €`
                : "No hay partidas seleccionadas"}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={goPrevFamily}
                className="text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>

              <button
                type="button"
                className="text-sm text-gray-600"
                onClick={goNextFamily}
              >
                {isLastStep ? "Finalizar" : "Ignorar familia →"}
              </button>

              <button
                type="button"
                disabled={!canConfirm}
                className="bg-black px-4 py-2 text-white disabled:opacity-40"
                onClick={confirmAddSelected}
              >
                {isLastStep
                  ? "Añadir selección y cerrar"
                  : "Añadir selección y seguir →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}