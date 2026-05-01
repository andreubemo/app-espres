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
      ? "h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-none sm:h-[calc(100dvh-48px)] sm:w-[min(1300px,calc(100vw-48px))]"
      : "w-full max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
      <div
        className={[
          "relative flex flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:rounded-2xl",
          sizeClass,
        ].join(" ")}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            {title}
          </h2>

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
