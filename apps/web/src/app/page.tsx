"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard route
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Redirecting to Dashboard...</h1>
      </div>
    </div>
  );
}
