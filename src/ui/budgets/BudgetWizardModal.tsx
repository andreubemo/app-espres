"use client";

import { useState } from "react";
import Modal from "../common/Modal";

export default function BudgetWizardModal({
  open,
  onAdd,
}: {
  open: boolean;
  onAdd: (line: {
    family: string;
    item: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }) => void;
}) {
  const [family, setFamily] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  return (
    <Modal open={open} title="Añadir partida">
      <div className="space-y-3">
        <input className="w-full border p-2" placeholder="Familia" onChange={(e) => setFamily(e.target.value)} />
        <input className="w-full border p-2" placeholder="Item" onChange={(e) => setItem(e.target.value)} />
        <input type="number" className="w-full border p-2" placeholder="Cantidad" onChange={(e) => setQty(Number(e.target.value))} />
        <input type="number" className="w-full border p-2" placeholder="Precio unitario" onChange={(e) => setPrice(Number(e.target.value))} />

        <button
          className="w-full bg-black py-2 text-white"
          onClick={() => onAdd({ family, item, unit: "u", quantity, unitPrice: price })}
        >
          Añadir
        </button>
      </div>
    </Modal>
  );
}
