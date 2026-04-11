"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BudgetActionBannerProps = {
  tone: "success" | "info";
  title: string;
  message: string;
  queryKeysToClear: string[];
};

function getToneClasses(tone: BudgetActionBannerProps["tone"]) {
  switch (tone) {
    case "info":
      return {
        wrapper: "border-blue-200 bg-blue-50",
        title: "text-blue-800",
        text: "text-blue-700",
        button:
          "border-blue-200 bg-white text-blue-800 hover:bg-blue-100",
      };
    case "success":
    default:
      return {
        wrapper: "border-emerald-200 bg-emerald-50",
        title: "text-emerald-800",
        text: "text-emerald-700",
        button:
          "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100",
      };
  }
}

export default function BudgetActionBanner({
  tone,
  title,
  message,
  queryKeysToClear,
}: BudgetActionBannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  const toneClasses = getToneClasses(tone);

  const removeBannerParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    for (const key of queryKeysToClear) {
      params.delete(key);
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    setVisible(false);
    router.replace(nextUrl, { scroll: false });
  }, [pathname, queryKeysToClear, router, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      removeBannerParams();
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [removeBannerParams]);

  if (!visible) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl border px-6 py-4 shadow-sm ${toneClasses.wrapper}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={`text-sm font-semibold ${toneClasses.title}`}>
            {title}
          </p>
          <p className={`text-sm ${toneClasses.text}`}>{message}</p>
        </div>

        <button
          type="button"
          onClick={removeBannerParams}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${toneClasses.button}`}
        >
          Cerrar
        </button>
      </div>
    </section>
  );
}