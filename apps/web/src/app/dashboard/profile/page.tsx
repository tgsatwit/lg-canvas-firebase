"use client";

import { DashboardShell } from "@/components/dashboard/shell";
import { UserProfileForm } from "./components/user-profile-form";
import { SimplePasswordReset } from "./components/simple-password-reset";

export default function ProfilePage() {

  return (
    <DashboardShell>
      <div 
        className="relative min-h-screen"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(236, 72, 153, 0.05) 0%,
              rgba(139, 92, 246, 0.05) 100%
            )
          `,
        }}
      >
        {/* Ambient background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                radial-gradient(circle at 35% 25%, rgba(236, 72, 153, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 65% 75%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 50% 10%, rgba(219, 39, 119, 0.06) 0%, transparent 40%)
              `,
            }}
          />
        </div>

        <div className="relative z-10 p-6 space-y-6">
          {/* Header */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              User Profile
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your display name, profile picture, and account settings.
            </p>
          </div>

          {/* Profile Settings */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <UserProfileForm />
          </div>

          {/* Password Reset */}
          <div 
            className="p-6 rounded-2xl border"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <SimplePasswordReset />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}