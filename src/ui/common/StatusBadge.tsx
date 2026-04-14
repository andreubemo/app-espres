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
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    case "SENT":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "ACCEPTED":
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-neutral-300 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
  }
}

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        getStatusClasses(status),
        className,
      ].join(" ")}
    >
      {getStatusLabel(status)}
    </span>
  );
}