"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your Canvas dashboard
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Canvas</h2>
          <p className="text-muted-foreground mb-4">
            Create and manage your Canvas projects
          </p>
          <a 
            href="/canvas" 
            className="text-primary hover:underline font-medium"
          >
            Go to Canvas →
          </a>
        </div>
        <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Users</h2>
          <p className="text-muted-foreground mb-4">
            Manage user accounts and permissions
          </p>
          <a 
            href="/users" 
            className="text-primary hover:underline font-medium"
          >
            Manage Users →
          </a>
        </div>
        <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p className="text-muted-foreground mb-4">
            Configure application settings
          </p>
          <a 
            href="/settings" 
            className="text-primary hover:underline font-medium"
          >
            View Settings →
          </a>
        </div>
      </div>
    </div>
  );
} 