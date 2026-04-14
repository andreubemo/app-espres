"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import UserMenu from "./UserMenu";

type AppHeaderProps = {
  userName: string;
  userEmail?: string | null;
};

const navItems = [
  {
    href: "/budgets",
    label: "Presupuestos",
    isActive: (pathname: string) =>
      pathname === "/budgets" ||
      (pathname.startsWith("/budgets/") && pathname !== "/budgets/new"),
  },
  {
    href: "/budgets/new",
    label: "Nuevo presupuesto",
    isActive: (pathname: string) => pathname === "/budgets/new",
  },
];

export default function AppHeader({
  userName,
  userEmail,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-neutral-50/90 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-neutral-200/80 bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur">
          <div
            className="flex flex-col gap-4 px-4 py-4 sm:px-6"
            style={{ minHeight: "var(--app-header-height)" }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <Link href="/budgets" className="inline-flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-sm font-semibold text-white shadow-sm">
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

              <div className="flex items-center justify-around gap-4">
                <div className="border-t border-neutral-200/80 pt-3">
              <nav className="overflow-x-auto">
                <div className="flex gap-2">
                  {navItems.map((item) => {
                    const active = item.isActive(pathname);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "inline-flex shrink-0 items-center rounded-xl border px-4 py-2 text-sm font-medium transition",
                          active
                            ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                            : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>
                <UserMenu name={userName} email={userEmail} />
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </header>
  );
}