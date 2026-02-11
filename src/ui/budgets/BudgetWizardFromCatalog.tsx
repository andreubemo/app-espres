'use client';

import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import {
  getCatalogFamilies,
  getItemsByFamily,
} from '@/domain/catalog/catalog.service';

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
  const families = getCatalogFamilies();

  const [step, setStep] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<WizardItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset limpio al cerrar modal
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelectedItem(null);
      setQuantity(1);
    }
  }, [open]);

  if (!open) return null;

  const familyKey = families[step];
  const items = (familyKey ? getItemsByFamily(familyKey) : []) as WizardItem[];

  const isLastStep = step >= families.length - 1;

  function goNextFamily() {
    if (isLastStep) {
      onClose();
      return;
    }
    setSelectedItem(null);
    setQuantity(1);
    setStep((s) => s + 1);
  }

  function goPrevFamily() {
    setSelectedItem(null);
    setQuantity(1);
    setStep((s) => Math.max(s - 1, 0));
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
      {/* Paso 1: seleccionar item */}
      {!selectedItem && (
        <div className="space-y-3">
          <h3 className="font-semibold capitalize">
            {familyKey?.replace(/_/g, ' ')}
          </h3>

          {items.length === 0 && (
            <p className="text-sm text-gray-500">
              No hay partidas en esta familia.
            </p>
          )}

          {items.map((it) => (
            <button
              key={it.id}
              className="w-full border p-2 text-left hover:bg-gray-50"
              onClick={() => setSelectedItem(it)}
            >
              {it.item} · {it.unitPrice} € / {it.unit}
            </button>
          ))}

          <div className="flex justify-between pt-3">
            <button disabled={step === 0} onClick={goPrevFamily}>
              ← Anterior
            </button>

            <button
              className="text-sm text-gray-600"
              onClick={goNextFamily}
            >
              Ignorar familia →
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: cantidad */}
      {selectedItem && (
        <div className="space-y-4">
          <h3 className="font-semibold">{selectedItem.item}</h3>

          <p className="text-sm text-gray-600">
            Precio: {selectedItem.unitPrice} € / {selectedItem.unit}
          </p>

          <input
            type="number"
            min={1}
            className="w-full border p-2"
            value={quantity}
            autoFocus
            onChange={(e) => setQuantity(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                confirmAdd();
              }
            }}
          />

          <div className="flex items-center justify-between">
            <button
              className="text-sm text-gray-600"
              onClick={() => setSelectedItem(null)}
            >
              ← Cambiar item
            </button>

            <div className="flex gap-3">
              <button
                className="text-sm text-gray-600"
                onClick={goNextFamily}
              >
                Ignorar
              </button>

              <button
                className="bg-black px-4 py-2 text-white"
                onClick={confirmAdd}
              >
                Añadir y seguir →
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
