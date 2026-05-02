import { CSSProperties, ReactNode } from "react";
import { redirect } from "next/navigation";

import {
  canManageUsers,
  getInternalUserContext,
} from "@/lib/access-control";
import AppHeader from "@/ui/layout/AppHeader";

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
      className="min-h-screen bg-surface"
      style={{ "--app-header-height": "61px" } as CSSProperties}
    >
      <AppHeader
        canManageUsers={canManageUsers(user.role)}
        userName={userName}
        userEmail={userEmail}
      />

      <main className="pt-4 sm:pt-5">{children}</main>
    </div>
  );
}
