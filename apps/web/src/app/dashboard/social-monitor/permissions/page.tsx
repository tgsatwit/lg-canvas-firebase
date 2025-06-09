import TeamPermissions from '@/components/social/TeamPermissions';

export const metadata = {
  title: 'Team Permissions | Canvas',
  description: 'Manage permissions for your team members',
};

export default function PermissionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold tracking-tight">Team Permissions</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Control what your team members can see and do across social platforms
            </p>
          </div>
          <div className="apple-card">
            <TeamPermissions />
          </div>
        </div>
      </div>
    </div>
  );
} 