"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
  RowActions,
} from "@/components/ui";
import CreateItemModal from "@/components/catalog/create-item-modal";
import { deleteItem } from "@/app/actions/delete-item";

type Item = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
};

export default function CatalogClient({
  initialData,
}: {
  initialData: Item[];
}) {
  const [items, setItems] = useState(initialData);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="p-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <CreateItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
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
              <TableCell>
                <Checkbox />
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell className="text-right">
                {item.price.toFixed(2)} €
              </TableCell>
              <TableCell className="text-right">
                <RowActions
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
