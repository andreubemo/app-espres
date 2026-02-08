"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type RowActionsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RowActions({ onEdit, onDelete }: RowActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md px-2 py-1 text-sm text-[var(--color-muted)] hover:bg-gray-100"
        aria-label="Abrir acciones"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-[var(--color-border)] bg-white shadow-sm">
          <button
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
            className={cn(
              "block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
            )}
          >
            Editar
          </button>

          <button
            onClick={() => {
              setOpen(false);
              onDelete?.();
            }}
            className={cn(
              "block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            )}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
