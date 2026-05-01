"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

type UserMenuProps = {
  canManageUsers?: boolean;
  name: string;
  email?: string | null;
};

export default function UserMenu({
  canManageUsers = false,
  name,
  email,
}: UserMenuProps) {
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
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card-background px-2 shadow-sm transition hover:border-primary-soft hover:bg-surface"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-text-strong text-xs font-semibold text-white">
          {initial}
        </div>

        <div className="hidden min-w-0 text-left md:block">
          <p className="max-w-[160px] truncate text-sm font-medium text-text-strong">
            {name || "Usuario"}
          </p>
          {email ? (
            <p className="max-w-[180px] truncate text-xs text-text-neutral">
              {email}
            </p>
          ) : null}
        </div>

        <svg
          className={`h-4 w-4 text-text-neutral transition ${
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
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-card-background shadow-lg"
        >
          <div className="border-b border-border px-3 py-3">
            <p className="text-sm font-semibold text-text-strong">
              {name || "Usuario"}
            </p>
            {email ? (
              <p className="mt-1 text-xs text-text-neutral">{email}</p>
            ) : null}
          </div>

          <div className="p-2">
            {canManageUsers ? (
              <Link
                href="/settings/users"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-text-strong transition hover:bg-surface"
              >
                Gestionar usuarios
              </Link>
            ) : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-text-strong transition hover:bg-surface"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
