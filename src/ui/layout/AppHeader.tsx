import Link from "next/link";

import UserMenu from "./UserMenu";

type AppHeaderProps = {
  userName: string;
  userEmail?: string | null;
};

export default function AppHeader({
  userName,
  userEmail,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Link href="/budgets" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white">
                E
              </div>

              <div className="min-w-0">
                <p className="text-base font-semibold tracking-tight text-neutral-900">
                  Espres
                </p>
                <p className="text-xs text-neutral-500">
                  Gestión interna de presupuestos
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <Link
              href="/budgets/new"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Nuevo presupuesto
            </Link>

            <UserMenu name={userName} email={userEmail} />
          </div>
        </div>

        <nav className="overflow-x-auto">
          <div className="flex gap-2">
            <Link
              href="/budgets"
              className="inline-flex shrink-0 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Presupuestos
            </Link>

            <Link
              href="/budgets/new"
              className="inline-flex shrink-0 items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900"
            >
              Nuevo presupuesto
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}