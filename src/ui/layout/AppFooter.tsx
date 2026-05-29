import DiscardBudgetButton from "./DiscardBudgetButton";
import GuardedLink from "./GuardedLink";

export default function AppFooter() {
  return (
    <footer className="border-t border-border bg-card-background/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-text-neutral sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-8">
        <p>
          Espres · Aplicación hecha por{" "}
          <span className="font-medium text-text-strong">Andreu Amano</span>.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <DiscardBudgetButton />

          <GuardedLink
            href="/tutorial"
            className="inline-flex h-9 w-fit items-center justify-center rounded-md border border-border bg-card-background px-3 text-sm font-medium text-text-strong shadow-sm transition hover:border-[#c9c2b8] hover:bg-surface"
          >
            Ver tutorial
          </GuardedLink>
        </div>
      </div>
    </footer>
  );
}
