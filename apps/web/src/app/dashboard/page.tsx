"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-700">Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Welcome to your Canvas dashboard
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          className="p-6 rounded-xl border border-indigo-200 overflow-hidden relative"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 30px rgba(79, 70, 229, 0.15)'
          }}
        >
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Canvas</h2>
          <p className="text-slate-400 mb-4">
            Create and manage your Canvas projects
          </p>
          <a 
            href="/dashboard/canvas" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Go to Canvas 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div 
          className="p-6 rounded-xl border border-indigo-200 overflow-hidden relative"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 30px rgba(79, 70, 229, 0.15)'
          }}
        >
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Users</h2>
          <p className="text-slate-400 mb-4">
            Manage user accounts and permissions
          </p>
          <a 
            href="/users" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Manage Users 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div 
          className="p-6 rounded-xl border border-indigo-200 overflow-hidden relative"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 30px rgba(79, 70, 229, 0.15)'
          }}
        >
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Settings</h2>
          <p className="text-slate-400 mb-4">
            Configure application settings
          </p>
          <a 
            href="/settings" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            View Settings 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 