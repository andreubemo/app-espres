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
  return value.replace(/_/g, " ").trim();
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

  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Record<string, WizardItem>>(
    {}
  );
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true);

      const res = await fetch("/api/catalog");
      const data = (await res.json()) as CatalogApiResponse;

      setFamilies(data.families);
      setItemsByFamily(data.itemsByFamily);
      setLoadingCatalog(false);
    }

    loadCatalog();
  }, []);

  const currentFamily = families[step];
  const items = itemsByFamily[currentFamily] ?? [];

  const selectedList = Object.values(selectedItems);

  const subtotal = selectedList.reduce((acc, item) => {
    const qty = quantities[item.id] ?? 1;
    return acc + item.unitPrice * qty;
  }, 0);

  function toggleItem(item: WizardItem) {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = item;
      return next;
    });

    setQuantities((prev) => ({
      ...prev,
      [item.id]: prev[item.id] ?? 1,
    }));
  }

  function confirm() {
    selectedList.forEach((item) => {
      onAdd({
        catalogItemId: item.id,
        family: item.family,
        item: item.item,
        unit: item.unit,
        quantity: quantities[item.id] ?? 1,
        unitPrice: item.unitPrice,
      });
    });

    onClose();
  }

  if (!open) return null;

  return (
    <Modal open={open} title="Selector de partidas" onClose={onClose} size="wide">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">

        {/* HEADER */}
        <div className="shrink-0 border-b px-6 py-3">
          <div className="flex justify-between">
            <div>
              <div className="text-xs text-neutral-500">SELECCIÓN</div>
              <div className="text-lg font-semibold">
                {formatFamilyLabel(currentFamily)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-neutral-500">Subtotal</div>
              <div className="font-semibold">{formatCurrency(subtotal)}</div>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="grid flex-1 min-h-0 grid-cols-[200px_1fr_300px]">

          {/* FAMILIAS */}
          <div className="overflow-y-auto border-r p-3">
            {families.map((f, i) => (
              <button
                key={f}
                onClick={() => setStep(i)}
                className={`w-full text-left p-2 rounded ${
                  i === step ? "bg-black text-white" : "hover:bg-neutral-100"
                }`}
              >
                {formatFamilyLabel(f)}
              </button>
            ))}
          </div>

          {/* ITEMS */}
          <div className="overflow-y-auto p-4">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((item) => {
                const selected = selectedItems[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item)}
                    className={`cursor-pointer border rounded p-3 ${
                      selected ? "bg-neutral-200 border-black" : ""
                    }`}
                  >
                    <div className="font-medium">{item.item}</div>
                    <div className="text-sm text-neutral-500">
                      {item.material}
                    </div>
                    <div className="mt-2 font-semibold">
                      {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECCIONADAS */}
          <div className="overflow-y-auto border-l p-3">
            {selectedList.map((item) => (
              <div key={item.id} className="mb-3 border p-2 rounded">
                <div className="font-medium">{item.item}</div>
                <input
                  type="number"
                  value={quantities[item.id] ?? 1}
                  onChange={(e) =>
                    setQuantities((p) => ({
                      ...p,
                      [item.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full border mt-2 p-1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t px-6 py-3 flex justify-between">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={confirm}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Añadir
          </button>
        </div>
      </div>
    </Modal>
  );
}