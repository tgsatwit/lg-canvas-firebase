import ConnectPlatformWizard from '@/components/social/ConnectPlatformWizard';

export const metadata = {
  title: 'Connect Social Platform | Canvas',
  description: 'Connect and manage your social media accounts',
};

export default function ConnectPlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Connect Social Platform</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Link your social media accounts to manage all your interactions in one place
            </p>
          </div>
          <div className="apple-card">
            <ConnectPlatformWizard />
          </div>
        </div>
      </div>
    </div>
  );
} 