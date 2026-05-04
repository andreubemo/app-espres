"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import UserMenu from "./UserMenu";

type AppHeaderProps = {
  canManageUsers?: boolean;
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

function HeaderIcon({ type }: { type: "list" | "plus" }) {
  if (type === "list") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M7 5.5h8M7 10h8M7 14.5h8M4.5 5.5h.01M4.5 10h.01M4.5 14.5h.01"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M10 4.5v11M4.5 10h11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EspresWordmark() {
  return (
    <span
      aria-label="Espres"
      className="block h-8 text-[30px] font-light leading-8 tracking-normal text-text-strong"
      role="img"
      style={{
        fontFamily:
          '"Avenir Next", Avenir, "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >
      e<span className="text-primary">s</span>|PRES
    </span>
  );
}

export default function AppHeader({
  canManageUsers = false,
  userName,
  userEmail,
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[61px] w-full max-w-7xl items-center gap-3 px-4 sm:px-5 lg:px-8">
        <Link
          href="/budgets"
          className="inline-flex min-w-0 shrink-0 flex-col items-center justify-center gap-0.5"
        >
          <EspresWordmark />

          <span className="hidden max-w-[260px] truncate text-xs leading-4 text-text-neutral sm:block">
            Gestión de presupuestos de carpintería
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <nav
            aria-label="Principal"
            className="flex min-w-0 items-center gap-1.5"
          >
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              const isNewBudget = item.href === "/budgets/new";
              const isBudgetsList = item.href === "/budgets";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={
                    isNewBudget || isBudgetsList ? item.label : undefined
                  }
                  title={isNewBudget || isBudgetsList ? item.label : undefined}
                  className={[
                    "inline-flex h-9 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition",
                    isNewBudget || isBudgetsList
                      ? "w-9 px-0 lg:w-auto lg:px-3"
                      : "px-2.5 sm:px-3",
                    active
                      ? "border-[#2b2926] bg-[#2b2926] text-white shadow-sm"
                      : isNewBudget || isBudgetsList
                        ? "border-[#2b2926] bg-[#2b2926] text-white shadow-sm hover:border-[#161412] hover:bg-[#161412]"
                        : "border-border bg-surface text-text-neutral hover:border-primary-soft hover:bg-card-background hover:text-text-strong",
                  ].join(" ")}
                >
                  {isNewBudget || isBudgetsList ? (
                    <>
                      <HeaderIcon type={isNewBudget ? "plus" : "list"} />
                      <span className="hidden lg:ml-1.5 lg:inline">
                        {item.label}
                      </span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}
          </nav>

          <UserMenu
            canManageUsers={canManageUsers}
            name={userName}
            email={userEmail}
          />
        </div>
      </div>
    </header>
  );
}
