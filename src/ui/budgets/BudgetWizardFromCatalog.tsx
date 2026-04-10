"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "../common/Modal";
import {
  getCatalogFamilies,
  getItemsByFamily,
} from "@/domain/catalog/catalog.service";

type WizardItem = {
  id: string;
  family: string;
  material: string;
  item: string;
  unit: string;
  unitPrice: number;
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
  const families = useMemo(() => getCatalogFamilies(), []);

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

  if (!open) return null;

  const familyKey = families[step];
  const items = familyKey ? (getItemsByFamily(familyKey) as WizardItem[]) : [];
  const totalFamilies = families.length;
  const isLastStep = step >= totalFamilies - 1;
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
            Familia {step + 1} de {totalFamilies}
          </p>
          <h3 className="font-semibold capitalize">
            {familyKey?.replace(/_/g, " ") || "Sin familia"}
          </h3>
        </div>

        {!selectedItem && (
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

        {selectedItem && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">{selectedItem.item}</h4>
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