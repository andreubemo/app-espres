"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function AppHeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Principal" className="flex min-w-0 items-center gap-1.5">
      {navItems.map((item) => {
        const active = item.isActive(pathname);
        const isNewBudget = item.href === "/budgets/new";

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.label}
            className={[
              "inline-flex h-9 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition",
              active
                ? "w-9 border-[#2b2926] bg-[#2b2926] px-0 text-white shadow-sm hover:border-[#161412] hover:bg-[#161412] sm:w-auto sm:px-3"
                : "w-9 border-border bg-card-background px-0 text-text-neutral opacity-75 shadow-sm hover:border-[#c9c2b8] hover:bg-surface hover:text-text-strong lg:w-auto lg:px-3",
            ].join(" ")}
          >
            <HeaderIcon type={isNewBudget ? "plus" : "list"} />
            <span
              className={
                active
                  ? "hidden sm:ml-1.5 sm:inline"
                  : "hidden lg:ml-1.5 lg:inline"
              }
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
