"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type UserMenuProps = {
  name: string;
  email?: string | null;
};

export default function UserMenu({ name, email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const initial =
    name?.trim()?.charAt(0).toUpperCase() ||
    email?.trim()?.charAt(0).toUpperCase() ||
    "U";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm transition hover:bg-neutral-50"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
          {initial}
        </div>

        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[160px] truncate text-sm font-medium text-neutral-900">
            {name || "Usuario"}
          </p>
          {email ? (
            <p className="max-w-[180px] truncate text-xs text-neutral-500">
              {email}
            </p>
          ) : null}
        </div>

        <svg
          className={`h-4 w-4 text-neutral-500 transition ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.512a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        >
          <div className="border-b border-neutral-200 px-4 py-4">
            <p className="text-sm font-semibold text-neutral-900">
              {name || "Usuario"}
            </p>
            {email ? (
              <p className="mt-1 text-xs text-neutral-500">{email}</p>
            ) : null}
          </div>

          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}