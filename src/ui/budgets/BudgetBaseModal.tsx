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
    width: number;
    length: number;
    complexity: BudgetComplexity;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [project, setProject] = useState("");
  const [date, setDate] = useState("");
  const [width, setWidth] = useState(0);
  const [length, setLength] = useState(0);
  const [complexity, setComplexity] =
    useState<BudgetComplexity>("medium");

  const isValid =
    code.trim().length > 0 &&
    project.trim().length > 0 &&
    date.trim().length > 0 &&
    width > 0 &&
    length > 0;

  function handleSubmit() {
    if (!isValid) return;

    onSubmit({
      code: code.trim(),
      project: project.trim(),
      date,
      width,
      length,
      complexity,
    });
  }

  return (
    <Modal open={open} title="Datos del presupuesto">
      <div className="space-y-3">
        <input
          className="w-full border p-2"
          placeholder="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          className="w-full border p-2"
          placeholder="Proyecto"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />

        <input
          type="date"
          className="w-full border p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border p-2"
          placeholder="Ancho (m)"
          value={width || ""}
          onChange={(e) => setWidth(Number(e.target.value))}
        />

        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border p-2"
          placeholder="Largo (m)"
          value={length || ""}
          onChange={(e) => setLength(Number(e.target.value))}
        />

        <select
          className="w-full border p-2"
          value={complexity}
          onChange={(e) =>
            setComplexity(e.target.value as BudgetComplexity)
          }
        >
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <button
          className="w-full bg-black py-2 text-white disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!isValid}
        >
          Crear presupuesto
        </button>
      </div>
    </Modal>
  );
}