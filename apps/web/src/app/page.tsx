"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="card">
        <Link href="/dashboard" className="card-item">
          <h2>Dashboard <span>→</span></h2>
          <p>Go to your main dashboard with all features.</p>
        </Link>
        
        <Link href="/youtube-dashboard" className="card-item">
          <h2>YouTube Management <span>→</span></h2>
          <p>Manage YouTube comments and videos.</p>
        </Link>
      </div>
    </div>
  );
}
