import TeamPermissions from '@/components/social/TeamPermissions';

export const metadata = {
  title: 'Team Permissions | Social Monitor',
  description: 'Manage permissions for your team members',
};

export default function PermissionsPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Team Permissions</h1>
      <TeamPermissions />
    </div>
  );
} 