"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { BudgetComplexity } from "@/domain/budgets/budget.model";
import type { BudgetDiscountPolicy } from "@/lib/budget-discounts";

type BudgetBaseFormData = {
  code: string;
  project: string;
  clientId: string;
  date: string;
  width: number;
  length: number;
  complexity: BudgetComplexity;
  notes: string;
  discountPercent: number;
};

type BudgetBaseModalProps = {
  open: boolean;
  initialData?: BudgetBaseFormData;
  stepLabel?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  summaryTitle?: string;
  clients: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  discountPolicy: BudgetDiscountPolicy;
  clientError?: string | null;
  isCreatingClient?: boolean;
  onCreateClient: (data: { name: string; email: string }) => Promise<string>;
  onSubmit: (data: BudgetBaseFormData) => void;
};

type MissingFieldId =
  | "code"
  | "project"
  | "clientId"
  | "date"
  | "width"
  | "length";

type MissingField = {
  id: MissingFieldId;
  label: string;
  message: string;
};

type RequiredFieldStatus = MissingField & {
  complete: boolean;
};

function formatNumber(value?: number, decimals = 2) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value ?? 0);
}

function getComplexityLabel(value: BudgetComplexity) {
  switch (value) {
    case "low":
      return "Baja";
    case "medium":
      return "Media";
    case "high":
      return "Alta";
    default:
      return "-";
  }
}

function getComplexityGuidance(value: BudgetComplexity) {
  switch (value) {
    case "low":
      return {
        title: "Baja complejidad",
        description:
          "Montaje directo, con soluciones estandar y poco riesgo de ajuste en obra.",
        example:
          "Ejemplo: tarima con moqueta, dos muros standard y un mostrador reciclado.",
      };
    case "high":
      return {
        title: "Alta complejidad",
        description:
          "Muchos oficios, tolerancias finas o piezas a medida que pueden exigir mas horas de produccion y montaje.",
        example:
          "Ejemplo: muebles lacados, curvas mecanizadas en CNC o paredes con trabajo de cristaleria.",
      };
    case "medium":
    default:
      return {
        title: "Complejidad media",
        description:
          "Montaje habitual con algunos elementos adaptados, remates especiales o coordinacion adicional.",
        example:
          "Ejemplo: mobiliario a medida recto, iluminacion integrada, rotulacion y ajustes de acabado.",
      };
  }
}

function getInitialDiscountPercent(
  initialValue: number | undefined,
  policy: BudgetDiscountPolicy
) {
  if (typeof initialValue === "number") {
    if (policy.mode === "range") {
      return Math.min(policy.maxPercent, Math.max(policy.minPercent, initialValue));
    }

    if (policy.allowedPercents.includes(initialValue)) {
      return initialValue;
    }
  }

  return policy.defaultPercent;
}

export default function BudgetBaseModal({
  open,
  initialData,
  stepLabel = "Paso 1 de 3",
  title = "Define la base del presupuesto",
  description = "Introduce el contexto inicial del proyecto antes de pasar al selector guiado de partidas. Este paso debe dejar bien definida la referencia, las dimensiones y el nivel de complejidad.",
  submitLabel = "Guardar borrador",
  summaryTitle = "Resumen inicial",
  clients,
  discountPolicy,
  clientError,
  isCreatingClient = false,
  onCreateClient,
  onSubmit,
}: BudgetBaseModalProps) {
  const [code, setCode] = useState(initialData?.code ?? "");
  const [project, setProject] = useState(initialData?.project ?? "");
  const [clientId, setClientId] = useState(initialData?.clientId ?? "");
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [date, setDate] = useState(initialData?.date ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [width, setWidth] = useState<number | "">(initialData?.width ?? "");
  const [length, setLength] = useState<number | "">(
    initialData?.length ?? ""
  );
  const [complexity, setComplexity] = useState<BudgetComplexity>(
    initialData?.complexity ?? "medium"
  );
  const [discountPercent, setDiscountPercent] = useState(
    getInitialDiscountPercent(initialData?.discountPercent, discountPolicy)
  );
  const [validationAttempted, setValidationAttempted] = useState(false);

  const numericWidth = typeof width === "number" ? width : 0;
  const numericLength = typeof length === "number" ? length : 0;
  const complexityGuidance = getComplexityGuidance(complexity);

  const surfaceM2 = useMemo(() => {
    if (numericWidth <= 0 || numericLength <= 0) return 0;
    return numericWidth * numericLength;
  }, [numericWidth, numericLength]);

  const perimeterML = useMemo(() => {
    if (numericWidth <= 0 || numericLength <= 0) return 0;
    return (numericWidth + numericLength) * 2;
  }, [numericWidth, numericLength]);

  const requiredFields = useMemo<RequiredFieldStatus[]>(() => {
    return [
      {
        id: "code",
        label: "Codigo",
        message: "Introduce una referencia para identificar el presupuesto.",
        complete: code.trim().length > 0,
      },
      {
        id: "project",
        label: "Proyecto",
        message: "Escribe el nombre o descripcion corta del proyecto.",
        complete: project.trim().length > 0,
      },
      {
        id: "clientId",
        label: "Cliente",
        message: "Selecciona un cliente existente o crea uno rapido.",
        complete: clientId.trim().length > 0,
      },
      {
        id: "date",
        label: "Fecha",
        message: "Selecciona la fecha del presupuesto.",
        complete: date.trim().length > 0,
      },
      {
        id: "width",
        label: "Ancho",
        message: "Introduce un ancho mayor que 0 metros.",
        complete: numericWidth > 0,
      },
      {
        id: "length",
        label: "Largo",
        message: "Introduce un largo mayor que 0 metros.",
        complete: numericLength > 0,
      },
    ];
  }, [clientId, code, date, numericLength, numericWidth, project]);

  const missingFields = requiredFields.filter((field) => !field.complete);

  const isValid = missingFields.length === 0;

  function getMissingField(id: MissingFieldId) {
    return missingFields.find((field) => field.id === id);
  }

  function handleSubmit() {
    setValidationAttempted(true);

    if (!isValid) return;

    onSubmit({
      code: code.trim(),
      project: project.trim(),
      clientId,
      date,
      width: numericWidth,
      length: numericLength,
      complexity,
      notes: notes.trim(),
      discountPercent,
    });
  }

  async function handleCreateClient() {
    try {
      const createdClientId = await onCreateClient({
        name: newClientName,
        email: newClientEmail,
      });

      setClientId(createdClientId);
      setNewClientName("");
      setNewClientEmail("");
    } catch {
      // El mensaje visible lo gestiona el contenedor para mantener una sola fuente.
    }
  }

  const codeAlert = getMissingField("code");
  const projectAlert = getMissingField("project");
  const clientAlert = getMissingField("clientId");
  const dateAlert = getMissingField("date");
  const widthAlert = getMissingField("width");
  const lengthAlert = getMissingField("length");
  const isNewBudgetFlow = submitLabel === "Guardar borrador";

  if (!open) return null;

  return (
    <section className="space-y-4">
      <div
        role={validationAttempted && !isValid ? "alert" : "status"}
        className="sticky top-[var(--app-header-height)] z-30"
      >
        <div className="relative left-1/2 w-screen -translate-x-1/2 border-y border-border bg-card-background/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 sm:px-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-8 lg:gap-10">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-neutral">
                  Campos obligatorios
                </p>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 lg:flex-wrap lg:overflow-visible">
                {requiredFields.map((field) => {
                  const Icon = field.complete ? CheckCircle2 : Circle;

                  return (
                    <span
                      key={field.id}
                      className={[
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-4 transition",
                        field.complete
                          ? "border-primary-soft bg-primary-soft/20 text-primary-strong"
                          : "border-border bg-card-background text-text-neutral",
                      ].join(" ")}
                    >
                      <Icon aria-hidden="true" className="h-3 w-3" />
                      {field.label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div
              className={
                isNewBudgetFlow
                  ? "grid grid-cols-2 gap-2 sm:flex sm:items-center"
                  : "flex flex-col gap-2 sm:flex-row sm:items-center"
              }
            >
              {isNewBudgetFlow ? (
                <button
                  className={[
                    "inline-flex h-10 w-full shrink-0 items-center justify-center rounded-md px-3 text-[13px] font-medium transition sm:w-auto sm:px-4 sm:text-sm",
                    isValid
                      ? "bg-primary text-white hover:bg-primary-strong"
                      : "cursor-not-allowed border border-border bg-card-background text-text-neutral opacity-60",
                  ].join(" ")}
                  disabled={!isValid}
                  onClick={handleSubmit}
                  type="button"
                >
                  Seleccionar partidas
                </button>
              ) : null}

              <button
                className={[
                  "inline-flex h-10 shrink-0 items-center justify-center rounded-md px-3 text-[13px] font-medium transition sm:px-4 sm:text-sm",
                  isNewBudgetFlow
                    ? "cursor-not-allowed border border-border bg-card-background text-text-neutral opacity-60"
                    : isValid
                      ? "bg-primary text-white hover:bg-primary-strong"
                      : "cursor-not-allowed border border-border bg-card-background text-text-neutral opacity-60",
                ].join(" ")}
                disabled={isNewBudgetFlow || !isValid}
                onClick={handleSubmit}
                type="button"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isNewBudgetFlow ? (
        <header className="space-y-1 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
            Nuevo presupuesto
          </h1>
          <p className="max-w-2xl text-sm leading-5 text-text-neutral">
            Define los datos base, selecciona partidas y guarda el presupuesto
            como borrador.
          </p>
        </header>
      ) : null}

      <div className="rounded-lg border border-border bg-card-background shadow-sm">
        <div className="space-y-4 p-4 sm:p-4 xl:p-8">
        <div className="space-y-4 border-b border-border pb-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-neutral">
              {stepLabel}
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
              {title}
            </h2>

            <p className="max-w-3xl text-sm text-text-neutral sm:text-base">
              {description}
            </p>
          </div>

        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-4 min-w-0">
            <section className="rounded-lg border border-border bg-card-background p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-text-strong">
                  Datos base del presupuesto
                </h3>
                <p className="mt-1 text-sm text-text-neutral">
                  Codigo, proyecto, cliente y fecha quedan como referencia
                  principal del presupuesto.
                </p>
              </div>

              <div className="grid gap-4">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Código
                  </span>
                  <input
                    aria-describedby={
                      codeAlert ? "budget-code-alert" : undefined
                    }
                    aria-invalid={Boolean(codeAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. STAND-2026-014"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {codeAlert ? (
                    <p
                      id="budget-code-alert"
                      className="text-xs text-text-neutral"
                    >
                      {codeAlert.message}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Proyecto
                  </span>
                  <input
                    aria-describedby={
                      projectAlert ? "budget-project-alert" : undefined
                    }
                    aria-invalid={Boolean(projectAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. Stand feria madera Barcelona"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {projectAlert ? (
                    <p
                      id="budget-project-alert"
                      className="text-xs text-text-neutral"
                    >
                      {projectAlert.message}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Cliente
                  </span>
                  <select
                    aria-describedby={
                      clientAlert ? "budget-client-alert" : undefined
                    }
                    aria-invalid={Boolean(clientAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                  {clientAlert ? (
                    <p
                      id="budget-client-alert"
                      className="text-xs text-text-neutral"
                    >
                      {clientAlert.message}
                    </p>
                  ) : null}
                </label>

                <div className="rounded-md border border-border bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
                    Crear cliente rápido
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <input
                      className="w-full rounded-md border border-border bg-card-background px-3 py-2 text-sm text-text-strong outline-none transition focus:border-primary"
                      placeholder="Nombre cliente"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full rounded-md border border-border bg-card-background px-3 py-2 text-sm text-text-strong outline-none transition focus:border-primary"
                      placeholder="Email cliente"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleCreateClient}
                      disabled={
                        isCreatingClient ||
                        !newClientName.trim() ||
                        !newClientEmail.trim()
                      }
                      className="rounded-md border border-border bg-card-background px-3 py-2 text-sm font-medium text-text-strong transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCreatingClient ? "Creando..." : "Crear"}
                    </button>
                  </div>
                  {clientError ? (
                    <p className="mt-2 text-xs text-text-neutral">
                      {clientError}
                    </p>
                  ) : null}
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Fecha
                  </span>
                  <input
                    type="date"
                    aria-describedby={
                      dateAlert ? "budget-date-alert" : undefined
                    }
                    aria-invalid={Boolean(dateAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {dateAlert ? (
                    <p
                      id="budget-date-alert"
                      className="text-xs text-text-neutral"
                    >
                      {dateAlert.message}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-2 rounded-md border border-border bg-surface p-4">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-neutral">
                      NOTAS
                    </span>
                    <span className="text-xs text-text-neutral">
                      Visible en app y PDF
                    </span>
                  </span>
                  <textarea
                    className="min-h-32 w-full resize-y rounded-md border border-border bg-card-background px-3 py-3 text-sm leading-6 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Notas internas o aclaraciones para el cliente: alcance, condiciones, exclusiones, tiempos de montaje..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card-background p-4 sm:p-5">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-text-strong">
                  Dimensiones y complejidad
                </h3>
                <p className="mt-1 text-sm text-text-neutral">
                  La superficie y el perímetro se calculan automáticamente a
                  partir del ancho y el largo.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Ancho (m)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-describedby={
                      widthAlert ? "budget-width-alert" : undefined
                    }
                    aria-invalid={Boolean(widthAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. 5"
                    value={width}
                    onChange={(e) =>
                      setWidth(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {widthAlert ? (
                    <p
                      id="budget-width-alert"
                      className="text-xs text-text-neutral"
                    >
                      {widthAlert.message}
                    </p>
                  ) : null}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Largo (m)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    aria-describedby={
                      lengthAlert ? "budget-length-alert" : undefined
                    }
                    aria-invalid={Boolean(lengthAlert)}
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. 4"
                    value={length}
                    onChange={(e) =>
                      setLength(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  {lengthAlert ? (
                    <p
                      id="budget-length-alert"
                      className="text-xs text-text-neutral"
                    >
                      {lengthAlert.message}
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="mt-4">
                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Complejidad
                  </span>
                  <select
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    value={complexity}
                    onChange={(e) =>
                      setComplexity(e.target.value as BudgetComplexity)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </label>

                <div className="mt-4 rounded-md border border-border bg-surface p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-text-strong">
                      Complejidad del montaje
                    </h4>
                    <p className="text-sm leading-6 text-text-neutral">
                      La complejidad no mide si el stand es mejor o peor. Sirve
                      para reflejar el riesgo real de produccion y montaje:
                      cantidad de oficios, piezas a medida, tolerancias,
                      acabados delicados y posibles ajustes en feria.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {(["low", "medium", "high"] as BudgetComplexity[]).map(
                      (option) => {
                        const optionGuidance = getComplexityGuidance(option);
                        const isSelected = complexity === option;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setComplexity(option)}
                            className={[
                              "rounded-md border p-3 text-left transition",
                              isSelected
                                ? "border-primary bg-card-background text-text-strong shadow-sm"
                                : "border-border bg-surface text-text-neutral hover:border-primary-soft hover:bg-card-background",
                            ].join(" ")}
                          >
                            <span className="block text-sm font-semibold">
                              {getComplexityLabel(option)}
                            </span>
                            <span className="mt-1 block text-xs leading-5">
                              {optionGuidance.description}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="mt-3 rounded-md border border-border bg-card-background p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
                      {complexityGuidance.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-text-strong">
                      {complexityGuidance.example}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {discountPolicy.mode !== "locked" ? (
              <section className="rounded-lg border border-border bg-card-background p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-strong">
                      Descuento comercial
                    </h3>
                    <p className="mt-1 text-sm text-text-neutral">
                      El descuento se aplica despues del ajuste por complejidad y
                      queda guardado en la version del presupuesto.
                    </p>
                  </div>
                  <span className="inline-flex w-fit rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-neutral">
                    {discountPolicy.label}
                  </span>
                </div>

                {discountPolicy.mode === "range" ? (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-text-neutral">
                      Descuento (%)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={discountPolicy.minPercent}
                        max={discountPolicy.maxPercent}
                        step="0.5"
                        className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                        value={discountPercent}
                        onChange={(e) => {
                          setDiscountPercent(
                            Math.min(
                              discountPolicy.maxPercent,
                              Math.max(
                                discountPolicy.minPercent,
                                Number(e.target.value) || 0
                              )
                            )
                          );
                        }}
                      />
                      <span className="text-sm font-semibold text-text-strong">
                        %
                      </span>
                    </div>
                  </label>
                ) : (
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-text-neutral">
                      Descuento
                    </span>
                    <select
                      className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    >
                      {discountPolicy.allowedPercents.map((option) => (
                        <option key={option} value={option}>
                          {option}%
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <p className="mt-3 text-xs leading-5 text-text-neutral">
                  {discountPolicy.helper}
                </p>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[calc(var(--app-header-height)+4.5rem)] xl:self-start">
            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-base font-semibold text-text-strong">
                  {summaryTitle}
                </h3>
              </div>

              <div className="space-y-3 p-4">
                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Superficie
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-text-strong">
                    {formatNumber(surfaceM2)} m²
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Perímetro
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {formatNumber(perimeterML)} ml
                  </p>
                </div>

                <div className="rounded-md border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-text-neutral">
                    Complejidad
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-strong">
                    {getComplexityLabel(complexity)}
                  </p>
                </div>

                {discountPolicy.mode !== "locked" ? (
                  <div className="rounded-md border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-text-neutral">
                      Descuento
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-strong">
                      {discountPercent}%
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
      </div>
    </section>
  );
}
