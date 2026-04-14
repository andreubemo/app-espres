type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  align?: "left" | "right";
  className?: string;
};

export default function StatCard({
  label,
  value,
  hint,
  align = "left",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-neutral-200 bg-neutral-50 p-4",
        align === "right" ? "text-right" : "",
        className,
      ].join(" ")}
    >
      <p className="text-xs uppercase tracking-wide text-neutral-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-neutral-900">
        {value}
      </p>

      {hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}