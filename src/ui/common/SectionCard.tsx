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
        "rounded-lg border border-[#dedbd6] bg-[#fbfaf7] shadow-[0_1px_2px_rgba(31,31,31,0.04)]",
        className,
      ].join(" ")}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-base font-semibold text-text-strong">
                {title}
              </h2>
            ) : null}

            {description ? (
              <p className="text-sm leading-5 text-text-neutral">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className={["p-4", contentClassName].join(" ")}>{children}</div>
    </section>
  );
}
