"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui";
import { createItem } from "@/app/actions/create-item";
import { updateItem } from "@/app/actions/update-item";

type Item = {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
};

export default function CreateItemModal({
  item,
  onClose,
}: {
  item?: Item;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) setOpen(true);
  }, [item]);

  const isEdit = Boolean(item);

  return (
    <>
      {!item && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Nuevo item
        </button>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          onClose?.();
        }}
        title={isEdit ? "Editar item" : "Nuevo item"}
      >
        <form
          action={async (formData) => {
            try {
              setError("");
              if (isEdit && item) {
                await updateItem(item.id, formData);
              } else {
                await createItem(formData);
              }
              setOpen(false);
              onClose?.();
            } catch (e: any) {
              setError(e.message || "Error");
            }
          }}
          className="space-y-4"
        >
          <input
            name="name"
            defaultValue={item?.name}
            placeholder="Concepto"
            className="w-full rounded border p-2"
          />
          <input
            name="category"
            defaultValue={item?.category}
            placeholder="Categoría"
            className="w-full rounded border p-2"
          />
          <input
            name="unit"
            defaultValue={item?.unit}
            placeholder="Unidad"
            className="w-full rounded border p-2"
          />
          <input
            name="price"
            defaultValue={item?.price}
            placeholder="Precio"
            className="w-full rounded border p-2"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
