import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionCard({
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "",
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section
      className={[
        "rounded-2xl border border-neutral-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-3 border-b border-neutral-200 px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            ) : null}

            {description ? (
              <p className="text-sm text-neutral-500">{description}</p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className={["p-6", contentClassName].join(" ")}>{children}</div>
    </section>
  );
}