import { cn } from "@/lib/utils";
import * as React from "react";

/* =========================
   Tabla base
   ========================= */

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table
        className={cn(
          "w-full border-collapse text-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}

/* =========================
   Subcomponentes
   ========================= */

export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return (
    <thead
      className="bg-[var(--color-surface)] text-left text-xs font-semibold uppercase tracking-wide"
      {...props}
    />
  );
}

export function TableBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return <tbody {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50",
        className
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[var(--color-muted)]",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle",
        className
      )}
      {...props}
    />
  );
}
