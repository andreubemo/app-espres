"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  RowActions,
  Checkbox,
} from "@/components/ui";

type Item = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: string;
};

export default function Page() {
  const data: Item[] = [
    {
      id: 1,
      name: "Tablero contrachapado",
      category: "Madera",
      unit: "m²",
      price: "32,50 €",
    },
    {
      id: 2,
      name: "Montaje",
      category: "Mano de obra",
      unit: "h",
      price: "45,00 €",
    },
  ];

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const allSelected =
    data.length > 0 && selectedIds.length === data.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : data.map((i) => i.id));
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  function handleEdit(item: Item) {
    alert(`Editar: ${item.name}`);
  }

  function handleDelete(item: Item) {
    const ok = confirm(`¿Eliminar "${item.name}"?`);
    if (ok) {
      alert("Eliminado (simulado)");
    }
  }

  return (
    <div className="p-10">
      <h1 className="mb-6 text-2xl font-bold">Catálogo</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Seleccionar todo"
              />
            </TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={
                selectedIds.includes(item.id)
                  ? "bg-gray-50"
                  : undefined
              }
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleOne(item.id)}
                  aria-label={`Seleccionar ${item.name}`}
                />
              </TableCell>

              <TableCell className="font-medium">
                {item.name}
              </TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-right">
                {item.price}
              </TableCell>

              <TableCell className="text-right">
                <RowActions
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedIds.length > 0 && (
        <div className="mt-4 text-sm text-[var(--color-muted)]">
          {selectedIds.length} elemento(s) seleccionado(s)
        </div>
      )}
    </div>
  );
}
