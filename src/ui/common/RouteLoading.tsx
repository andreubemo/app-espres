type RouteLoadingProps = {
  description?: string;
  title?: string;
};

export default function RouteLoading({
  description = "Preparando la informacion de la pantalla.",
  title = "Cargando",
}: RouteLoadingProps) {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 lg:px-8">
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded-md bg-[#e7e2dc]" />
          <div className="h-4 w-full max-w-lg animate-pulse rounded-md bg-[#eeeae5]" />
        </div>

        <section
          aria-label={title}
          className="rounded-md border border-border bg-card-background p-4 shadow-sm"
        >
          <p className="text-sm font-semibold text-text-strong">{title}</p>
          <p className="mt-1 text-sm leading-6 text-text-neutral">
            {description}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-md border border-border bg-[#f4f2ef]" />
            <div className="h-24 animate-pulse rounded-md border border-border bg-[#f4f2ef]" />
            <div className="h-24 animate-pulse rounded-md border border-border bg-[#f4f2ef]" />
          </div>
        </section>
      </div>
    </main>
  );
}
