"use client";

import { UserProvider } from "@/contexts/UserContext";
import { SignupSuccess } from "@/components/auth/signup/success";

export default function Page() {
  return (
    <UserProvider>
      <main className="min-h-screen flex items-center justify-center bg-background">
        <SignupSuccess />
      </main>
    </UserProvider>
  );
}
