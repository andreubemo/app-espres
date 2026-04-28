"use client";

import { ReactNode } from "react";

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = "default",
}: {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  size?: "default" | "wide" | "fullscreen";
}) {
  if (!open) return null;

  const sizeClass =
    size === "fullscreen"
      ? "h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-none"
      : size === "wide"
      ? "h-[calc(100dvh-48px)] w-[min(1300px,calc(100vw-48px))] max-w-none"
      : "w-full max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={[
          "relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl",
          sizeClass,
        ].join(" ")}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xl leading-none hover:bg-neutral-100"
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}