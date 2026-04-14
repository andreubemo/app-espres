import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppHeader from "@/ui/layout/AppHeader";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (
    !session?.user?.id ||
    !session.user.companyId ||
    session.user.type !== "USER"
  ) {
    redirect("/login");
  }

  const userEmail = session.user.email ?? "";
  const userName = userEmail.split("@")[0] || "Usuario";

  return (
    <div
      className="min-h-screen bg-neutral-50"
      style={{ ["--app-header-height" as string]: "112px" }}
    >
      <AppHeader userName={userName} userEmail={userEmail} />

      <div className="-mt-2 pt-4 sm:-mt-3 sm:pt-5">{children}</div>
    </div>
  );
}