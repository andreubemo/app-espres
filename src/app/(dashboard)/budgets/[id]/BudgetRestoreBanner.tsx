"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BudgetRestoreBannerProps = {
  restoredFrom: string;
  restoredTo: string;
};

export default function BudgetRestoreBanner({
  restoredFrom,
  restoredTo,
}: BudgetRestoreBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  const removeRestoreParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("restoredFrom");
    params.delete("restoredTo");

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    setVisible(false);
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      removeRestoreParams();
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [removeRestoreParams]);

  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-emerald-800">
            Versión restaurada correctamente
          </p>
          <p className="text-sm text-emerald-700">
            Restaurada la v{restoredFrom} como nueva v{restoredTo}.
          </p>
        </div>

        <button
          type="button"
          onClick={removeRestoreParams}
          className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          Cerrar
        </button>
      </div>
    </section>
  );
}