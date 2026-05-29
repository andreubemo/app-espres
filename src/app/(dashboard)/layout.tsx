import { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  canManagePrices,
  canManageUsers,
  getInternalUserContext,
} from "@/lib/access-control";
import AppFooter from "@/ui/layout/AppFooter";
import AppHeader from "@/ui/layout/AppHeader";
import { UnsavedChangesGuardProvider } from "@/hooks/useUnsavedChangesGuard";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getInternalUserContext();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email ?? "";
  const userName = userEmail.split("@")[0] || "Usuario";

  return (
    <div
      className="flex min-h-screen flex-col bg-surface"
      style={{ "--app-header-height": "61px" } as CSSProperties}
    >
      <UnsavedChangesGuardProvider>
        <AppHeader
          canManagePrices={canManagePrices(user.role)}
          canManageUsers={canManageUsers(user.role)}
          userName={userName}
          userEmail={userEmail}
        />

        <main className="flex-1 pt-4 sm:pt-5">{children}</main>

        <AppFooter />
      </UnsavedChangesGuardProvider>
    </div>
  );
}
