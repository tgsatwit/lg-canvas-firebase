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
          <div className="bg-background min-h-screen">
            <NuqsAdapter>{children}</NuqsAdapter>
          </div>
        </DashboardLayout>
      </TaskProvider>
    </UserProvider>
  );
} 