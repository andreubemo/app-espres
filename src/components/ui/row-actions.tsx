"use client";

import { useState } from "react";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RowActions({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 text-xl leading-none"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 z-50 w-32 rounded-md border bg-white shadow">
          {onEdit && (
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              Editar
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
