import YouTubeManagement from '@/components/youtube-management';

export default function YouTubeDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">YouTube Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your YouTube channel and content
            </p>
          </div>
          
          <div className="apple-card p-0 overflow-hidden">
            <YouTubeManagement />
          </div>
        </div>
      </div>
    </div>
  );
} 