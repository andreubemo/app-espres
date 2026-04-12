"use client";

import { signOut } from "next-auth/react";

type UserMenuProps = {
  name: string;
  email?: string | null;
};

export default function UserMenu({ name, email }: UserMenuProps) {
  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left shadow-sm transition hover:bg-neutral-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
          {name?.trim()?.charAt(0).toUpperCase() || "U"}
        </div>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-medium text-neutral-900">
            {name}
          </p>
          {email ? (
            <p className="truncate text-xs text-neutral-500">{email}</p>
          ) : null}
        </div>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
        <div className="border-b border-neutral-200 px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">{name}</p>
          {email ? <p className="mt-1 text-xs text-neutral-500">{email}</p> : null}
        </div>

        <div className="p-2">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </details>
  );
}