import Link from "next/link";

import AppHeaderNav from "./AppHeaderNav";
import UserMenu from "./UserMenu";

type AppHeaderProps = {
  canManageUsers?: boolean;
  userName: string;
  userEmail?: string | null;
};

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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[61px] w-full max-w-7xl items-center gap-3 px-4 sm:px-5 lg:px-8">
        <Link
          href="/budgets"
          className="inline-flex min-w-0 shrink-0 flex-col items-start justify-center gap-0.5 text-left"
        >
          <EspresWordmark />

          <span className="hidden max-w-[260px] truncate text-xs leading-4 text-text-neutral sm:block">
            Gestión de presupuestos de carpintería
          </span>
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          <AppHeaderNav />

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
