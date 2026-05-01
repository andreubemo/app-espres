import Link from "next/link";

type BudgetBreadcrumbProps = {
  headerCode: string;
  viewedVersionNumber: number;
};

export default function BudgetBreadcrumb({
  headerCode,
  viewedVersionNumber,
}: BudgetBreadcrumbProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-neutral">
        Gestión de presupuestos
      </p>

      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          href="/budgets"
          className="text-text-neutral transition hover:text-text-strong hover:underline"
        >
          Presupuestos
        </Link>

        <span aria-hidden="true" className="text-primary-soft">
          ›
        </span>

        <span className="font-medium text-text-neutral">{headerCode}</span>

        <span aria-hidden="true" className="text-primary-soft">
          ›
        </span>

        <span className="font-semibold text-text-strong">
          v{viewedVersionNumber}
        </span>
      </nav>
    </div>
  );
}