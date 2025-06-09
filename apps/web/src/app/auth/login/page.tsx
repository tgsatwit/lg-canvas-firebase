"use client";

import { Login } from "@/components/auth/login/Login";
import { Suspense } from "react";

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Suspense 
        fallback={
          <div className="w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-muted"></div>
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        }
      >
        <Login />
      </Suspense>
    </main>
  );
}
