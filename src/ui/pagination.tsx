"use client";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-[var(--color-muted)]">
        Página {page} de {totalPages} · {total} resultado(s)
      </span>

      <div className="flex items-center gap-2">
        <button
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-[var(--color-border)] px-3 py-1 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-[var(--color-border)] px-3 py-1 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
