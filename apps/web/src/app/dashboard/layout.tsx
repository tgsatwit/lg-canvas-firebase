"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <NuqsAdapter>{children}</NuqsAdapter>
    </DashboardLayout>
  );
} 