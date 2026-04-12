"use client";

import { ReactNode, useEffect } from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose?: () => void;
  children: ReactNode;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
}: ModalProps) {
  // bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      {/* backdrop click */}
      {onClose && (
        <div
          className="absolute inset-0"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* modal */}
      <div
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6">
            <h2 className="text-base font-semibold text-neutral-900 sm:text-lg">
              {title}
            </h2>

            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* body con scroll controlado */}
        <div className="max-h-[85vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}