"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { UserProvider } from "@/contexts/UserContext";
import { TaskProvider } from "./tasks/context/task-context";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <TaskProvider>
        <DashboardLayout>
          <NuqsAdapter>{children}</NuqsAdapter>
        </DashboardLayout>
      </TaskProvider>
    </UserProvider>
  );
} 