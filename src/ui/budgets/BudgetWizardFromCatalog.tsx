'use client';

import { useState } from 'react';
import Modal from '../common/Modal';
import {
  getCatalogFamilies,
  getItemsByFamily,
  CatalogItemWithPrice,
} from '@/domain/catalog/catalog.service';

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

  const [step, setStep] = useState(0);
  const [selectedItem, setSelectedItem] = useState<CatalogItemWithPrice | null>(null);
  const [quantity, setQuantity] = useState(1);

  const familyKey = families[step];
  const items = familyKey ? getItemsByFamily(familyKey) : [];

  return (
    <Modal open={open} title="Añadir partida">
      {/* PASO 1: FAMILIA */}
      {!selectedItem && (
        <div className="space-y-3">
          <h3 className="font-semibold capitalize">
            {familyKey?.replace(/_/g, ' ')}
          </h3>

          {items.map((item) => (
            <button
              key={item.id}
              className="w-full border p-2 text-left hover:bg-gray-50"
              onClick={() => setSelectedItem(item)}
            >
              {item.item} · {item.unitPrice} € / {item.unit}
            </button>
          ))}

          <div className="flex justify-between pt-3">
            <button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              ← Anterior
            </button>
            <button
              disabled={step === families.length - 1}
              onClick={() => setStep(step + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: CANTIDAD */}
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
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          <div className="flex justify-between">
            <button onClick={() => setSelectedItem(null)}>
              ← Cambiar item
            </button>

            <button
              className="bg-black px-4 py-2 text-white"
              onClick={() => {
                onAdd({
                  family: selectedItem.family,
                  item: selectedItem.item,
                  unit: selectedItem.unit,
                  quantity,
                  unitPrice: selectedItem.unitPrice,
                });
                setSelectedItem(null);
                setQuantity(1);
                onClose();
              }}
            >
              Añadir partida
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
