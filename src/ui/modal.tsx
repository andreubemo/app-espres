'use client';

import { ReactNode } from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-xl rounded bg-white p-4 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xl leading-none hover:opacity-70"
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
