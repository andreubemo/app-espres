"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";

type WizardItem = {
  id: string;
  family: string;
  material: string;
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
    family: string;
    item: string;
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
  const [selectedItem, setSelectedItem] = useState<WizardItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedItem(null);
      setQuantity(1);
    }
  }, [open]);

  useEffect(() => {
    let ignore = false;

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

        if (ignore) return;

        setFamilies(Array.isArray(data.families) ? data.families : []);
        setItemsByFamily(
          data.itemsByFamily && typeof data.itemsByFamily === "object"
            ? data.itemsByFamily
            : {}
        );
      } catch (error) {
        if (ignore) return;

        console.error("Error cargando catálogo:", error);
        setCatalogError("No se ha podido cargar el catálogo.");
        setFamilies([]);
        setItemsByFamily({});
      } finally {
        if (!ignore) {
          setLoadingCatalog(false);
        }
      }
    }

    loadCatalog();

    return () => {
      ignore = true;
    };
  }, []);

  const totalFamilies = families.length;
  const familyKey = families[step] ?? null;
  const items = useMemo<WizardItem[]>(() => {
    if (!familyKey) return [];
    return itemsByFamily[familyKey] ?? [];
  }, [familyKey, itemsByFamily]);

  const isLastStep = totalFamilies === 0 || step >= totalFamilies - 1;
  const canGoBack = step > 0;

  function resetItemState() {
    setSelectedItem(null);
    setQuantity(1);
  }

  function goNextFamily() {
    if (isLastStep) {
      onClose();
      return;
    }

    resetItemState();
    setStep((current) => current + 1);
  }

  function goPrevFamily() {
    resetItemState();
    setStep((current) => Math.max(current - 1, 0));
  }

  function handleSelectItem(item: WizardItem) {
    setSelectedItem(item);
    setQuantity(1);
  }

  function handleChangeQuantity(value: string) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      setQuantity(1);
      return;
    }

    setQuantity(Math.max(1, parsed));
  }

  function confirmAdd() {
    if (!selectedItem) return;

    onAdd({
      family: selectedItem.family,
      item: selectedItem.item,
      unit: selectedItem.unit,
      quantity,
      unitPrice: selectedItem.unitPrice,
    });

    goNextFamily();
  }

  return (
    <Modal open={open} title="Añadir partidas" onClose={onClose}>
      <div className="space-y-4">
        <div className="border-b pb-3">
          <p className="text-sm text-gray-500">
            {totalFamilies > 0
              ? `Familia ${step + 1} de ${totalFamilies}`
              : "Sin familias disponibles"}
          </p>

          <h3 className="font-semibold capitalize">
            {familyKey?.replace(/_/g, " ") || "Sin familia"}
          </h3>
        </div>

        {loadingCatalog && (
          <p className="text-sm text-gray-500">Cargando catálogo...</p>
        )}

        {!loadingCatalog && catalogError && (
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {catalogError}
          </div>
        )}

        {!loadingCatalog && !catalogError && totalFamilies === 0 && (
          <p className="text-sm text-gray-500">
            No hay familias disponibles en el catálogo.
          </p>
        )}

        {!loadingCatalog && !catalogError && totalFamilies > 0 && !selectedItem && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hay partidas en esta familia.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className="w-full border p-3 text-left hover:bg-gray-50"
                    onClick={() => handleSelectItem(it)}
                  >
                    <div className="font-medium">{it.item}</div>

                    {it.material && (
                      <div className="text-sm text-gray-500">{it.material}</div>
                    )}

                    <div className="text-sm text-gray-600">
                      {it.unitPrice} € / {it.unit}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                disabled={!canGoBack}
                onClick={goPrevFamily}
                className="disabled:opacity-40"
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
            </div>
          </div>
        )}

        {!loadingCatalog && !catalogError && selectedItem && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">{selectedItem.item}</h4>

              {selectedItem.material && (
                <p className="text-sm text-gray-500">{selectedItem.material}</p>
              )}

              <p className="text-sm text-gray-600">
                Precio: {selectedItem.unitPrice} € / {selectedItem.unit}
              </p>
            </div>

            <input
              type="number"
              min={1}
              step="0.01"
              className="w-full border p-2"
              value={quantity}
              autoFocus
              onChange={(e) => handleChangeQuantity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmAdd();
                }
              }}
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-gray-600"
                onClick={() => setSelectedItem(null)}
              >
                ← Cambiar item
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-sm text-gray-600"
                  onClick={goNextFamily}
                >
                  {isLastStep ? "Finalizar" : "Ignorar"}
                </button>

                <button
                  type="button"
                  className="bg-black px-4 py-2 text-white"
                  onClick={confirmAdd}
                >
                  {isLastStep ? "Añadir y cerrar" : "Añadir y seguir →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}