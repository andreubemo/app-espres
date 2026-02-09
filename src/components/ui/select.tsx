"use client";

import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-9 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-black",
        className
      )}
      {...props}
    />
  );
}
