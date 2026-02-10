"use client";

import { useState } from "react";
import Modal from "../common/Modal";
import { BudgetComplexity } from "@/domain/budgets/budget.model";

export default function BudgetBaseModal({
  open,
  onSubmit,
}: {
  open: boolean;
  onSubmit: (data: {
    code: string;
    project: string;
    date: string;
    surfaceM2: number;
    complexity: BudgetComplexity;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [project, setProject] = useState("");
  const [date, setDate] = useState("");
  const [surfaceM2, setSurface] = useState(0);
  const [complexity, setComplexity] = useState<BudgetComplexity>("medium");

  return (
    <Modal open={open} title="Datos del presupuesto">
      <div className="space-y-3">
        <input className="w-full border p-2" placeholder="Código" onChange={(e) => setCode(e.target.value)} />
        <input className="w-full border p-2" placeholder="Proyecto" onChange={(e) => setProject(e.target.value)} />
        <input type="date" className="w-full border p-2" onChange={(e) => setDate(e.target.value)} />
        <input type="number" className="w-full border p-2" placeholder="Superficie m²" onChange={(e) => setSurface(Number(e.target.value))} />

        <select className="w-full border p-2" onChange={(e) => setComplexity(e.target.value as BudgetComplexity)}>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <button
          className="w-full bg-black py-2 text-white"
          onClick={() => onSubmit({ code, project, date, surfaceM2, complexity })}
        >
          Crear presupuesto
        </button>
      </div>
    </Modal>
  );
}
