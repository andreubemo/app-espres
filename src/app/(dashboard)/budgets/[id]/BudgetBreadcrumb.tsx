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
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Gestión de presupuestos
      </p>

      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          href="/budgets"
          className="text-neutral-500 transition hover:text-neutral-900 hover:underline"
        >
          Presupuestos
        </Link>

        <span aria-hidden="true" className="text-neutral-300">
          ›
        </span>

        <span className="font-medium text-neutral-700">{headerCode}</span>

        <span aria-hidden="true" className="text-neutral-300">
          ›
        </span>

        <span className="font-semibold text-neutral-900">
          v{viewedVersionNumber}
        </span>
      </nav>
    </div>
  );
}