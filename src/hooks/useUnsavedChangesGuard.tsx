"use client";

import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import UnsavedBudgetChangesDialog from "@/ui/budgets/UnsavedBudgetChangesDialog";

type GuardSaveResult = {
  ok: boolean;
  message?: string;
};

type UnsavedBudgetGuardConfig = {
  hasUnsavedChanges: boolean;
  onDiscard: () => void;
  onSaveDraft: () => Promise<GuardSaveResult>;
};

type UnsavedChangesGuardContextValue = {
  guardLinkClick: (
    href: string,
    event: MouseEvent<HTMLAnchorElement>
  ) => void;
  hasUnsavedChanges: boolean;
  registerBudgetGuard: (config: UnsavedBudgetGuardConfig) => () => void;
  requestDiscard: () => void;
};

const UnsavedChangesGuardContext =
  createContext<UnsavedChangesGuardContextValue | null>(null);

function sameRoute(a: string, b: string) {
  try {
    const base = window.location.origin;
    const first = new URL(a, base);
    const second = new URL(b, base);

    return (
      first.pathname === second.pathname &&
      first.search === second.search &&
      first.hash === second.hash
    );
  } catch {
    return a === b;
  }
}

function shouldIgnoreClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function UnsavedChangesGuardProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [guardConfig, setGuardConfig] =
    useState<UnsavedBudgetGuardConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingHrefRef = useRef<string>("/budgets");

  const currentHref = useMemo(() => {
    if (typeof window === "undefined") return pathname;

    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }, [pathname]);

  const hasUnsavedChanges = Boolean(guardConfig?.hasUnsavedChanges);

  const navigateTo = useCallback(
    (href: string) => {
      router.push(href);
      router.refresh();
    },
    [router]
  );

  const openDialogFor = useCallback((href: string) => {
    pendingHrefRef.current = href;
    setDialogError(null);
    setDialogOpen(true);
  }, []);

  const requestNavigation = useCallback(
    (href: string) => {
      if (!hasUnsavedChanges || sameRoute(href, currentHref)) {
        navigateTo(href);
        return false;
      }

      openDialogFor(href);
      return true;
    },
    [currentHref, hasUnsavedChanges, navigateTo, openDialogFor]
  );

  const guardLinkClick = useCallback(
    (href: string, event: MouseEvent<HTMLAnchorElement>) => {
      if (shouldIgnoreClick(event)) return;

      const isExternal =
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:");

      if (isExternal) return;

      if (requestNavigation(href)) {
        event.preventDefault();
      }
    },
    [requestNavigation]
  );

  const requestDiscard = useCallback(() => {
    if (!hasUnsavedChanges) {
      navigateTo("/budgets");
      return;
    }

    openDialogFor("/budgets");
  }, [hasUnsavedChanges, navigateTo, openDialogFor]);

  const registerBudgetGuard = useCallback((config: UnsavedBudgetGuardConfig) => {
    setGuardConfig(config);

    return () => {
      setGuardConfig((current) => (current === config ? null : current));
    };
  }, []);

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
    setDialogError(null);
  }, []);

  const handleDiscard = useCallback(() => {
    guardConfig?.onDiscard();
    setDialogOpen(false);
    setDialogError(null);
    navigateTo(pendingHrefRef.current);
  }, [guardConfig, navigateTo]);

  const handleSaveDraft = useCallback(async () => {
    if (!guardConfig) return;

    setIsSaving(true);
    setDialogError(null);

    try {
      const result = await guardConfig.onSaveDraft();

      if (!result.ok) {
        setDialogError(
          result.message ??
            "No se pudo guardar el presupuesto como borrador."
        );
        return;
      }

      setDialogOpen(false);
      navigateTo(pendingHrefRef.current);
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el presupuesto como borrador."
      );
    } finally {
      setIsSaving(false);
    }
  }, [guardConfig, navigateTo]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    window.history.pushState(
      { ...(window.history.state ?? {}), unsavedBudgetGuard: true },
      "",
      currentHref
    );

    function handlePopState() {
      window.history.pushState(
        { ...(window.history.state ?? {}), unsavedBudgetGuard: true },
        "",
        currentHref
      );
      openDialogFor("/budgets");
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentHref, hasUnsavedChanges, openDialogFor]);

  const value = useMemo<UnsavedChangesGuardContextValue>(
    () => ({
      guardLinkClick,
      hasUnsavedChanges,
      registerBudgetGuard,
      requestDiscard,
    }),
    [guardLinkClick, hasUnsavedChanges, registerBudgetGuard, requestDiscard]
  );

  return (
    <UnsavedChangesGuardContext.Provider value={value}>
      {children}
      <UnsavedBudgetChangesDialog
        error={dialogError}
        isSaving={isSaving}
        onCancel={handleCancel}
        onDiscard={handleDiscard}
        onSaveDraft={handleSaveDraft}
        open={dialogOpen}
      />
    </UnsavedChangesGuardContext.Provider>
  );
}

export function useUnsavedChangesGuard() {
  const context = useContext(UnsavedChangesGuardContext);

  if (!context) {
    throw new Error(
      "useUnsavedChangesGuard debe usarse dentro de UnsavedChangesGuardProvider."
    );
  }

  return context;
}

export function useRegisterUnsavedBudgetGuard(
  config: UnsavedBudgetGuardConfig | null
) {
  const { registerBudgetGuard } = useUnsavedChangesGuard();

  useEffect(() => {
    if (!config) return;

    return registerBudgetGuard(config);
  }, [config, registerBudgetGuard]);
}
