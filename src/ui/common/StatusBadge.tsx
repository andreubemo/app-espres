type StatusBadgeProps = {
  status: string;
  className?: string;
};

function getStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Borrador";
    case "SENT":
      return "Enviado";
    case "ACCEPTED":
    case "APPROVED":
      return "Aceptado";
    case "REJECTED":
      return "Rechazado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status || "-";
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "DRAFT":
      return "border-primary-soft bg-primary-soft/30 text-primary-strong";
    case "SENT":
      return "border-primary bg-primary text-white";
    case "ACCEPTED":
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-primary-soft bg-surface text-text-neutral";
    default:
      return "border-border bg-surface text-text-neutral";
  }
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        getStatusClasses(status),
        className,
      ].join(" ")}
    >
      {getStatusLabel(status)}
    </span>
  );
}
