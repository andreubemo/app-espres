import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
  actions?: ReactNode;
  children?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
};

export function SectionHeader({
  actions,
  children,
  className,
  description,
  eyebrow,
  title,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase text-primary">
            {eyebrow}
          </div>
        ) : null}

        <h2 className="text-xl font-semibold text-text-strong">{title}</h2>

        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-text-neutral">
            {description}
          </p>
        ) : null}

        {children}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
