"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RowActions({ onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
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
