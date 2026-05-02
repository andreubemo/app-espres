"use client";

import { useMemo, useState } from "react";
import { BudgetComplexity } from "@/domain/budgets/budget.model";

type BudgetBaseFormData = {
  code: string;
  project: string;
  clientId: string;
  date: string;
  width: number;
  length: number;
  complexity: BudgetComplexity;
};

type BudgetBaseModalProps = {
  open: boolean;
  initialData?: BudgetBaseFormData;
  stepLabel?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  submitHelp?: string;
  summaryTitle?: string;
  clients: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  clientError?: string | null;
  isCreatingClient?: boolean;
  onCreateClient: (data: { name: string; email: string }) => Promise<string>;
  onSubmit: (data: BudgetBaseFormData) => void;
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

export default function BudgetBaseModal({
  open,
  initialData,
  stepLabel = "Paso 1 de 3",
  title = "Define la base del presupuesto",
  description = "Introduce el contexto inicial del proyecto antes de pasar al selector guiado de partidas. Este paso debe dejar bien definida la referencia, las dimensiones y el nivel de complejidad.",
  submitLabel = "Crear presupuesto y continuar",
  submitHelp = "Al continuar se abrirá el selector guiado de partidas.",
  summaryTitle = "Resumen inicial",
  clients,
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
  const [width, setWidth] = useState<number | "">(initialData?.width ?? "");
  const [length, setLength] = useState<number | "">(
    initialData?.length ?? ""
  );
  const [complexity, setComplexity] = useState<BudgetComplexity>(
    initialData?.complexity ?? "medium"
  );

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

  const isValid =
    code.trim().length > 0 &&
    project.trim().length > 0 &&
    clientId.trim().length > 0 &&
    date.trim().length > 0 &&
    numericWidth > 0 &&
    numericLength > 0;

  function handleSubmit() {
    if (!isValid) return;

    onSubmit({
      code: code.trim(),
      project: project.trim(),
      clientId,
      date,
      width: numericWidth,
      length: numericLength,
      complexity,
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

  if (!open) return null;

  return (
    <section className="rounded-lg border border-border bg-card-background shadow-sm">
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

          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full w-1/3 rounded-full bg-primary" />
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
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. STAND-2026-014"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isValid) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Proyecto
                  </span>
                  <input
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    placeholder="Ej. Stand feria madera Barcelona"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isValid) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Cliente
                  </span>
                  <select
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
                    <p className="mt-2 text-xs text-red-700">{clientError}</p>
                  ) : null}
                </div>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Fecha
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-md border border-border bg-card-background px-3 py-2.5 text-text-strong outline-none transition focus:border-primary"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isValid) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
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
                      if (e.key === "Enter" && isValid) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-text-neutral">
                    Largo (m)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
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
                      if (e.key === "Enter" && isValid) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
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
                      if (e.key === "Enter" && isValid) {
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

                <div className="mt-4 rounded-md border border-primary-soft bg-primary-soft/20 p-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-primary-strong">
                      Por que elegir una complejidad
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
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
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
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="space-y-3 p-4">
                <button
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-primary-soft"
                  onClick={handleSubmit}
                  disabled={!isValid}
                  type="button"
                >
                  {submitLabel}
                </button>

                <p className="text-xs leading-5 text-text-neutral">
                  {submitHelp}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
