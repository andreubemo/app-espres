import { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="rounded-lg border border-[#dedbd6] bg-[#fbfaf7] p-4 shadow-[0_1px_2px_rgba(31,31,31,0.04)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase text-primary">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-xl font-semibold tracking-tight text-text-strong sm:text-2xl">
            {title}
          </h1>

          {description ? (
            <p className="max-w-2xl text-sm leading-5 text-text-neutral">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
