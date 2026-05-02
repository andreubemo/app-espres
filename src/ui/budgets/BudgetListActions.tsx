"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { deleteBudget } from "@/app/actions/budgets";
import { Badge } from "@/ui/primitives/Badge";
import { Button } from "@/ui/primitives/Button";

type BudgetListActionsProps = {
  budgetId: string;
  reference: string;
};

type ActionIconProps = {
  type: "edit" | "delete" | "share" | "download" | "more";
};

function ActionIcon({ type }: ActionIconProps) {
  const common = {
    className: type === "more" ? "h-[18px] w-[18px]" : "h-4 w-4",
    viewBox: "0 0 20 20",
    fill: "none",
    "aria-hidden": true,
  } as const;

  switch (type) {
    case "edit":
      return (
        <svg {...common}>
          <path
            d="M4 14.5V16h1.5L14 7.5 12.5 6 4 14.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="m11.5 7 1.5-1.5c.6-.6 1.5-.6 2.1 0l.4.4c.6.6.6 1.5 0 2.1L14 9.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "delete":
      return (
        <svg {...common}>
          <path
            d="M4.5 6h11M8 6V4.5h4V6m-6 0 .7 9h6.6l.7-9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path
            d="M7.5 11.2 12.5 14M12.5 6 7.5 8.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
          <path
            d="M5.5 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM14.5 16.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path
            d="M10 4v7m0 0 3-3m-3 3L7 8M5 15h10"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="3.8" cy="10" r="1.7" fill="currentColor" />
          <circle cx="10" cy="10" r="1.7" fill="currentColor" />
          <circle cx="16.2" cy="10" r="1.7" fill="currentColor" />
        </svg>
      );
  }
}

export default function BudgetListActions({
  budgetId,
  reference,
}: BudgetListActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const detailHref = `/budgets/${budgetId}`;
  const editHref = `/budgets/${budgetId}/edit`;

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setConfirmOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleShare() {
    const url = `${window.location.origin}${detailHref}`;
    const shareData = {
      title: `Presupuesto ${reference}`,
      text: `Presupuesto ${reference}`,
      url,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        setFeedback("Presupuesto compartido");
      } else {
        await navigator.clipboard.writeText(url);
        setFeedback("Link copiado");
      }
    } catch {
      setFeedback("No se pudo compartir");
    }

    setMenuOpen(false);
  }

  async function handleDownload() {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/budgets/${budgetId}/download`);

      if (!response.ok) {
        throw new Error("No se pudo descargar el presupuesto");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName =
        contentDisposition?.match(/filename="(.+)"/)?.[1] ??
        `${reference || "presupuesto"}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setFeedback("Descarga iniciada");
      setMenuOpen(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo descargar el presupuesto";
      setFeedback(message);
    } finally {
      setIsDownloading(false);
    }
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteBudget(budgetId);
        setConfirmOpen(false);
        setMenuOpen(false);
        setFeedback("Presupuesto eliminado");
        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el presupuesto";
        setFeedback(message);
      }
    });
  }

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <div>
        <Button
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Abrir acciones del presupuesto"
          className="h-9 w-9 !p-0 [&_svg]:h-[18px] [&_svg]:w-[18px]"
          onClick={() => setMenuOpen((value) => !value)}
          size="sm"
          variant="neutral"
        >
          <ActionIcon type="more" />
        </Button>

        {menuOpen ? (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card-background shadow-lg"
          >
            <Link
              href={editHref}
              role="menuitem"
              className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-text-strong transition hover:bg-surface"
            >
              <ActionIcon type="edit" />
              Editar
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleShare}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-medium text-text-strong transition hover:bg-surface"
            >
              <ActionIcon type="share" />
              Compartir
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-medium text-text-strong transition hover:bg-surface"
            >
              <ActionIcon type="download" />
              {isDownloading ? "Descargando..." : "Descargar"}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              <ActionIcon type="delete" />
              Borrar
            </button>
          </div>
        ) : null}
      </div>

      {feedback ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
          <Badge variant="soft">{feedback}</Badge>
        </div>
      ) : null}

      {confirmOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-strong/35 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-card-background p-4 shadow-lg">
            <h2 className="text-base font-semibold text-text-strong">
              &iquest;Seguro que quieres eliminar este presupuesto?
            </h2>
            <p className="mt-2 text-sm leading-5 text-text-neutral">
              Acci&oacute;n irreversible. Se eliminar&aacute;n el presupuesto y
              sus versiones guardadas para {reference}.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                onClick={() => setConfirmOpen(false)}
                size="sm"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                disabled={isDeleting}
                onClick={handleDelete}
                size="sm"
                variant="danger"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
