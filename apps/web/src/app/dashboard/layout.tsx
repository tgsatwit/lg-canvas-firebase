"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { UserProvider } from "@/contexts/UserContext";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardLayout>
        <NuqsAdapter>{children}</NuqsAdapter>
      </DashboardLayout>
    </UserProvider>
  );
} 