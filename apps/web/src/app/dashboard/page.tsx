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
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Social Monitor</h2>
          <p className="text-slate-400 mb-4">
            Track and respond to social media comments
          </p>
          <a 
            href="/dashboard/social-monitor" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Open Social Monitor 
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
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Video Library</h2>
          <p className="text-slate-400 mb-4">
            Manage your video content and optimize for social platforms
          </p>
          <a 
            href="/dashboard/videos" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Go to Video Library
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
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Create Playlists</h2>
          <p className="text-slate-400 mb-4">
            Create and manage YouTube playlists from your video content
          </p>
          <a 
            href="/dashboard/playlists" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Go to Playlists
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
          <h2 className="text-xl font-semibold mb-2 text-slate-700">Task Management</h2>
          <p className="text-slate-400 mb-4">
            Create and track tasks, manage deadlines, and collaborate with your team
          </p>
          <a 
            href="/dashboard/tasks" 
            className="text-indigo-700 hover:text-indigo-900 hover:underline font-medium inline-flex items-center"
          >
            Go to Tasks
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
} 