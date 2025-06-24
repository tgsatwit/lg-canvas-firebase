"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard route with a slight delay for visual appeal
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Enhanced background with light liquid glass effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"/>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-purple-50/40 to-pink-100/60"/>
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-pulse"/>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-pulse"/>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-pink-200/30 rounded-full blur-2xl animate-pulse"/>
      </div>

      {/* Glass container */}
      <div className="relative z-10">
        <div className="relative group">
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/50 to-white/70 rounded-3xl backdrop-blur-xl border border-gray-200/60"/>
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-transparent rounded-3xl"/>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent"/>
          
          {/* Content */}
          <div className="relative p-12 text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100/60 to-white/40 rounded-2xl blur-sm"/>
                <Image 
                  src="/Sqr_logo.png" 
                  alt="PBL.ai Logo" 
                  width={80} 
                  height={80}
                  className="relative rounded-2xl shadow-2xl"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                PBL.ai
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Redirecting to Dashboard...
              </p>
            </div>

            {/* Loading animation */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"/>
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}/>
                <div className="w-3 h-3 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
