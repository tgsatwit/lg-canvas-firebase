import ConnectPlatformWizard from '@/components/social/ConnectPlatformWizard';

export const metadata = {
  title: 'Connect Social Platform | Social Monitor',
  description: 'Connect and manage your social media accounts',
};

export default function ConnectPlatformPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Connect Social Platform</h1>
      <ConnectPlatformWizard />
    </div>
  );
} 