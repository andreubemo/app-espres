"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { RowActions } from "@/components/ui/row-actions";
import CreateItemModal from "@/components/catalog/create-item-modal";
import { deleteItem } from "@/app/actions/delete-item";

type Item = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
};

type RawItem = {
  id: number | string;
  name?: string | null;
  category?: string | null;
  unit?: string | null;
  price: number | string;
};

// A veces los callbacks devuelven price como string/Decimal.
// Esto lo normaliza siempre a number.
function normalizeItem(input: RawItem): Item {
  return {
    id: Number(input.id),
    name: String(input.name ?? ""),
    category: String(input.category ?? ""),
    unit: String(input.unit ?? ""),
    price: Number(input.price), // <- CLAVE
  };
}

export default function CatalogClient({ initialData }: { initialData: RawItem[] }) {
  const normalizedInitial = useMemo(
    () => (initialData ?? []).map(normalizeItem),
    [initialData]
  );

  const [items, setItems] = useState<Item[]>(normalizedInitial);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(item: Item) {
    setDeletingItem(item);
  }

  function confirmDelete() {
    if (!deletingItem) return;

    startTransition(async () => {
      await deleteItem(deletingItem.id);
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeletingItem(null);
    });
  }

  return (
    <div className="p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>

        <CreateItemModal
          onClose={() => {
            // Refetch data or trigger revalidation here
            window.location.reload();
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className="text-right">Precio</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-right">
                {Number(item.price).toFixed(2)} €
              </TableCell>
              <TableCell>
                <RowActions
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* MODAL EDITAR */}
      {editingItem && (
        <CreateItemModal
          item={editingItem}
          onClose={() => {
            setEditingItem(null);
            // Refetch data or trigger revalidation here
            window.location.reload();
          }}
        />
      )}

      {/* MODAL CONFIRMAR ELIMINAR */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 space-y-4 w-96">
            <h2 className="text-lg font-semibold">¿Eliminar este item?</h2>
            <p className="text-sm text-gray-600">{deletingItem.name}</p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
