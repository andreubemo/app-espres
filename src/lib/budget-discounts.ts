export type BudgetDiscountRole = "OWNER" | "ADMIN" | "WORKER";

export type BudgetDiscountPolicy = {
  role: BudgetDiscountRole;
  mode: "range" | "options" | "locked";
  label: string;
  helper: string;
  defaultPercent: number;
  minPercent: number;
  maxPercent: number;
  allowedPercents: number[];
};

export function getBudgetDiscountPolicy(
  role: BudgetDiscountRole | string
): BudgetDiscountPolicy {
  if (role === "OWNER") {
    return {
      role: "OWNER",
      mode: "range",
      label: "Owner",
      helper: "Puede aplicar descuentos desde 0% hasta 50%.",
      defaultPercent: 0,
      minPercent: 0,
      maxPercent: 50,
      allowedPercents: [],
    };
  }

  if (role === "ADMIN") {
    return {
      role: "ADMIN",
      mode: "options",
      label: "Admin",
      helper: "Puede elegir uno de los descuentos aprobados: 3%, 5% o 7%.",
      defaultPercent: 3,
      minPercent: 3,
      maxPercent: 7,
      allowedPercents: [3, 5, 7],
    };
  }

  return {
    role: "WORKER",
    mode: "locked",
    label: "Worker",
    helper: "No puede aplicar descuentos. El presupuesto queda al 0%.",
    defaultPercent: 0,
    minPercent: 0,
    maxPercent: 0,
    allowedPercents: [0],
  };
}

export function isDiscountAllowed(
  discountPercent: number,
  policy: BudgetDiscountPolicy
) {
  if (!Number.isFinite(discountPercent)) return false;

  if (policy.mode === "range") {
    return (
      discountPercent >= policy.minPercent &&
      discountPercent <= policy.maxPercent
    );
  }

  return policy.allowedPercents.includes(discountPercent);
}

export function normalizeDiscountForPolicy(
  value: unknown,
  policy: BudgetDiscountPolicy
) {
  const numericValue = typeof value === "number" ? value : Number(value);
  const roundedValue = Number.isFinite(numericValue)
    ? Math.round(numericValue * 100) / 100
    : policy.defaultPercent;

  if (policy.mode === "range") {
    return Math.min(
      policy.maxPercent,
      Math.max(policy.minPercent, roundedValue)
    );
  }

  if (policy.allowedPercents.includes(roundedValue)) {
    return roundedValue;
  }

  return policy.defaultPercent;
}

export function assertDiscountAllowedForPolicy(
  value: unknown,
  policy: BudgetDiscountPolicy
) {
  const normalized = normalizeDiscountForPolicy(value, policy);

  if (!isDiscountAllowed(normalized, policy)) {
    throw new Error("El descuento seleccionado no esta permitido para tu rol.");
  }

  return normalized;
}
