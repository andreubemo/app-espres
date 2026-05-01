"use client";

import { useMemo, useState } from "react";
import { BudgetComplexity } from "@/domain/budgets/budget.model";

type BudgetBaseModalProps = {
  open: boolean;
  onSubmit: (data: {
    code: string;
    project: string;
    date: string;
    width: number;
    length: number;
    complexity: BudgetComplexity;
  }) => void;
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

export default function BudgetBaseModal({
  open,
  onSubmit,
}: BudgetBaseModalProps) {
  const [code, setCode] = useState("");
  const [project, setProject] = useState("");
  const [date, setDate] = useState("");
  const [width, setWidth] = useState<number | "">("");
  const [length, setLength] = useState<number | "">("");
  const [complexity, setComplexity] = useState<BudgetComplexity>("medium");

  const numericWidth = typeof width === "number" ? width : 0;
  const numericLength = typeof length === "number" ? length : 0;

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
    date.trim().length > 0 &&
    numericWidth > 0 &&
    numericLength > 0;

  function handleSubmit() {
    if (!isValid) return;

    onSubmit({
      code: code.trim(),
      project: project.trim(),
      date,
      width: numericWidth,
      length: numericLength,
      complexity,
    });
  }

  if (!open) return null;

  return (
    <section className="rounded-lg border border-border bg-card-background shadow-sm">
      <div className="space-y-4 p-4 sm:p-4 xl:p-8">
        <div className="space-y-4 border-b border-border pb-6">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-neutral">
              Paso 1 de 3
            </p>

            <h2 className="text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
              Define la base del presupuesto
            </h2>

            <p className="max-w-3xl text-sm text-text-neutral sm:text-base">
              Introduce el contexto inicial del proyecto antes de pasar al
              selector guiado de partidas. Este paso debe dejar bien definida la
              referencia, las dimensiones y el nivel de complejidad.
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
                  Identificación
                </h3>
                <p className="mt-1 text-sm text-text-neutral">
                  Estos datos te ayudarán a localizar y entender el presupuesto
                  más adelante.
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
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <section className="rounded-lg border border-border bg-card-background shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-base font-semibold text-text-strong">
                  Resumen inicial
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
                  Crear presupuesto y continuar
                </button>

                <p className="text-xs leading-5 text-text-neutral">
                  Al continuar se abrirá el selector guiado de partidas.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}