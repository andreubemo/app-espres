import SectionCard from "@/ui/common/SectionCard";

const ownerSteps = [
  "Entra con tu usuario interno y abre el menu de usuario.",
  "Usa Gestionar precios para revisar contadores, importar Excel o editar costes.",
  "Crea presupuestos desde Nuevo presupuesto y guardalos como borrador.",
  "Desde el detalle puedes duplicar, marcar como enviado, crear versiones y restaurar versiones antiguas.",
];

const workerSteps = [
  "Crea un presupuesto nuevo y completa cliente, proyecto, fecha y dimensiones.",
  "Selecciona partidas desde el catalogo guiado por familias.",
  "Revisa total, descuento permitido por tu rol y partidas antes de guardar.",
  "Si intentas salir con cambios, la app te avisara antes de perder informacion.",
];

const importantNotes = [
  "Guardar borrador crea un Budget y una primera BudgetVersion con snapshot JSON.",
  "Marcar como enviado cambia el estado del presupuesto y marca la version actual.",
  "Restaurar una version no pisa el historial: crea una nueva version desde el snapshot antiguo.",
  "Descartar limpia el presupuesto en curso si confirmas la accion.",
  "Los precios historicos quedan guardados dentro de BudgetVersion.data.",
];

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-8">
        <header className="space-y-1 pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
            Tutorial
          </h1>
          <p className="max-w-2xl text-sm leading-5 text-text-neutral">
            Guia rapida para usar Espres segun el rol del usuario.
          </p>
        </header>

        <SectionCard
          title="Owner / administrador principal"
          description="Puede gestionar precios, usuarios y el flujo completo de presupuestos."
        >
          <ol className="grid gap-2 md:grid-cols-2">
            {ownerSteps.map((step) => (
              <li
                key={step}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-neutral"
              >
                {step}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Usuario interno / operativo"
          description="Trabaja principalmente creando, revisando y consultando presupuestos."
        >
          <ol className="grid gap-2 md:grid-cols-2">
            {workerSteps.map((step) => (
              <li
                key={step}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-neutral"
              >
                {step}
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard
          title="Avisos importantes"
          description="Conceptos que conviene tener claros antes de trabajar con presupuestos reales."
        >
          <ul className="grid gap-2 md:grid-cols-2">
            {importantNotes.map((note) => (
              <li
                key={note}
                className="rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-neutral"
              >
                {note}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Cliente externo"
          description="Pendiente: el portal de cliente externo no esta implementado como flujo completo."
        >
          <p className="text-sm leading-6 text-text-neutral">
            El modelo de autenticacion puede identificar sesiones de cliente,
            pero la app actual esta centrada en usuarios internos.
          </p>
        </SectionCard>
      </div>
    </main>
  );
}
