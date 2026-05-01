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
        "rounded-lg border border-[#e2ded8] bg-[#fbfaf7] p-3",
        align === "right" ? "text-right" : "",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase text-[#5f5a52]">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-semibold text-text-strong">
        {value}
      </p>

      {hint ? (
        <p className="mt-0.5 text-xs text-text-neutral">{hint}</p>
      ) : null}
    </div>
  );
}
