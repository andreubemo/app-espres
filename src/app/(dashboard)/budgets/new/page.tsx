import { getBudgetFormContext } from "@/app/actions/budgets";
import type { BudgetClientOption } from "@/app/actions/budgets";
import { getBudgetDiscountPolicy } from "@/lib/budget-discounts";

import NewBudgetClient from "./NewBudgetClient";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudieron cargar los clientes.";
}

export default async function NewBudgetPage() {
  let initialClients: BudgetClientOption[] = [];
  let initialDiscountPolicy = getBudgetDiscountPolicy("WORKER");
  let initialClientError: string | null = null;

  try {
    const context = await getBudgetFormContext();

    initialClients = context.clients;
    initialDiscountPolicy = context.discountPolicy;
  } catch (error) {
    initialClientError = getErrorMessage(error);
  }

  return (
    <NewBudgetClient
      initialClients={initialClients}
      initialDiscountPolicy={initialDiscountPolicy}
      initialClientError={initialClientError}
    />
  );
}
