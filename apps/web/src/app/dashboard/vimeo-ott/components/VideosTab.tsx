"use client";

interface VideosTabProps {
  searchQuery: string;
}

export function VideosTab({ searchQuery }: VideosTabProps) {
  return (
    <div className="space-y-6">
      {/* Coming Soon Placeholder */}
      <div 
        className="rounded-2xl p-12 border border-purple-100 text-center"
        style={{
          background: `
            linear-gradient(135deg, 
              rgba(236, 72, 153, 0.05) 0%,
              rgba(139, 92, 246, 0.05) 100%
            )
          `,
        }}
      >
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(236, 72, 153, 0.9) 0%,
                rgba(139, 92, 246, 0.9) 100%
              )
            `,
          }}
        >
          V
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          Video Management Coming Soon
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We're working on integrating Vimeo OTT video management features. You'll be able to view, upload, and manage your video content directly from here.
        </p>
        
        <div className="bg-white/60 rounded-xl p-6 max-w-lg mx-auto">
          <h4 className="font-medium text-gray-900 mb-3">Planned Features:</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
              Video library with search and filtering
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Upload and manage video content
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
              Analytics and performance metrics
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              Collection and playlist management
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}