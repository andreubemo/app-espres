import SectionCard from "@/ui/common/SectionCard";

const workflowSteps = [
  {
    title: "1. Define los datos base",
    description:
      "Introduce código, proyecto, cliente, fecha, dimensiones, complejidad, descuento permitido y notas. Estos datos serán la referencia principal del presupuesto.",
  },
  {
    title: "2. Selecciona partidas",
    description:
      "Abre el selector guiado, avanza por familias y añade solo las partidas necesarias. Puedes ajustar cantidades en el momento para mantener el total actualizado.",
  },
  {
    title: "3. Revisa antes de guardar",
    description:
      "Comprueba partidas, dimensiones, descuento, notas y total. Cuando todo esté correcto, guarda el borrador para que quede registrado.",
  },
  {
    title: "4. Gestiona el presupuesto",
    description:
      "Desde el listado puedes editar, duplicar, descargar PDF, compartir el archivo y eliminar presupuestos cuando sea necesario.",
  },
];

const benefits = [
  "Reduce errores al centralizar cliente, responsable, partidas, cantidades y notas.",
  "Acelera la creación de presupuestos repetitivos con un selector guiado por familias.",
  "Mantiene trazabilidad con fechas, versiones y responsable del presupuesto.",
  "Facilita el envío al cliente mediante PDF descargable y compartible.",
  "Permite controlar descuentos según el rol de cada usuario.",
];

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-6 pt-0 lg:px-8">
        <header className="space-y-1 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
            Tutorial
          </h1>
          <p className="max-w-2xl text-sm leading-5 text-text-neutral">
            Guía rápida para usar Espres y entender qué aporta al trabajo diario
            de presupuestos.
          </p>
        </header>

        <SectionCard
          title="Cómo funciona"
          description="El flujo está pensado para crear presupuestos de forma ordenada, revisable y rápida."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {workflowSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-md border border-border bg-surface p-4"
              >
                <h2 className="text-base font-semibold text-text-strong">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-neutral">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Beneficios principales"
          description="La app prioriza velocidad, control y consistencia en presupuestos internos."
        >
          <ul className="grid gap-2 md:grid-cols-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-neutral"
              >
                {benefit}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Comprobaciones recomendadas"
          description="Antes de enviar un presupuesto, revisa estos puntos para evitar correcciones posteriores."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
                Datos
              </p>
              <p className="mt-2 text-sm leading-6 text-text-strong">
                Cliente, responsable, fecha, código y proyecto deben estar
                completos.
              </p>
            </div>

            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
                Partidas
              </p>
              <p className="mt-2 text-sm leading-6 text-text-strong">
                Revisa cantidades, unidades, familias y partidas duplicadas.
              </p>
            </div>

            <div className="rounded-md border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-neutral">
                PDF
              </p>
              <p className="mt-2 text-sm leading-6 text-text-strong">
                Comprueba notas, total final y maquetación antes de compartir.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
