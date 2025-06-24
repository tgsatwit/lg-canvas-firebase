"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

// Types
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface SocialPlatform {
  id: string;
  platform: 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'linkedin';
  accountName: string;
}

interface UserPermission {
  userId: string;
  platformId: string;
  permissions: {
    canView: boolean;
    canReply: boolean;
    canMarkAnswered: boolean;
    isAdmin: boolean;
  };
}

// Mock data
const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'Social Media Manager',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'Customer Support',
    avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: 'admin-1',
    name: 'Michael Brown',
    email: 'michael@example.com',
    role: 'Administrator',
    avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

const mockPlatforms: SocialPlatform[] = [
  {
    id: 'fb-123',
    platform: 'facebook',
    accountName: 'Your Business Page',
  },
  {
    id: 'ig-456',
    platform: 'instagram',
    accountName: '@yourbusiness',
  },
  {
    id: 'yt-789',
    platform: 'youtube',
    accountName: 'Your YouTube Channel',
  },
];

// Platform display helpers
const platformColors: Record<string, string> = {
  facebook: 'bg-blue-100 text-blue-800',
  instagram: 'bg-purple-100 text-purple-800',
  youtube: 'bg-red-100 text-red-800',
  twitter: 'bg-sky-100 text-sky-800',
  linkedin: 'bg-blue-700 text-white',
};

export default function TeamPermissions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [currentPermissions, setCurrentPermissions] = useState<UserPermission['permissions']>({
    canView: true,
    canReply: false,
    canMarkAnswered: false,
    isAdmin: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch team members and platforms
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, these would be API calls
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setTeamMembers(mockTeamMembers);
        setPlatforms(mockPlatforms);
        
        // Simulate fetching permissions
        const mockPermissions: UserPermission[] = [];
        
        mockTeamMembers.forEach(member => {
          mockPlatforms.forEach(platform => {
            mockPermissions.push({
              userId: member.id,
              platformId: platform.id,
              permissions: {
                canView: true,
                canReply: member.id.includes('admin'),
                canMarkAnswered: true,
                isAdmin: member.id.includes('admin'),
              },
            });
          });
        });
        
        setPermissions(mockPermissions);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load team data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Filter team members based on search query
  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find permissions for a specific user and platform
  const getUserPlatformPermissions = (userId: string, platformId: string): UserPermission['permissions'] => {
    const userPermission = permissions.find(
      p => p.userId === userId && p.platformId === platformId
    );
    
    return userPermission?.permissions || {
      canView: false,
      canReply: false,
      canMarkAnswered: false,
      isAdmin: false,
    };
  };

  // Open the permissions dialog for a user and platform
  const handleEditPermissions = (member: TeamMember, platform: SocialPlatform) => {
    setSelectedMember(member);
    setSelectedPlatform(platform);
    
    const existingPermissions = getUserPlatformPermissions(member.id, platform.id);
    setCurrentPermissions(existingPermissions);
    
    setPermissionDialogOpen(true);
  };

  // Save the updated permissions
  const handleSavePermissions = async () => {
    if (!selectedMember || !selectedPlatform) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      const response = await fetch('/api/social/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedMember.id,
          platformId: selectedPlatform.id,
          permissions: currentPermissions,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }
      
      // Update local state
      setPermissions(prev => 
        prev.map(p => 
          p.userId === selectedMember.id && p.platformId === selectedPlatform.id
            ? { ...p, permissions: currentPermissions }
            : p
        )
      );
      
      toast({
        title: 'Permissions Updated',
        description: `Updated permissions for ${selectedMember.name} on ${selectedPlatform.accountName}`,
      });
      
      setPermissionDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle a permission checkbox
  const handleTogglePermission = (permission: keyof UserPermission['permissions']) => {
    setCurrentPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Team Permissions</CardTitle>
              <CardDescription>
                Manage what your team members can do with your social media accounts
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableCaption>Manage user permissions for each social platform.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  {platforms.map((platform) => (
                    <TableHead key={platform.id}>
                      <div className="flex flex-col items-center">
                        <Badge className={`mb-1 ${platformColors[platform.platform]}`}>
                          {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)}
                        </Badge>
                        <span className="text-xs font-normal">{platform.accountName}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={platforms.length + 1} className="text-center py-8 text-muted-foreground">
                      No team members match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                {member.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      {platforms.map((platform) => {
                        const userPermissions = getUserPlatformPermissions(member.id, platform.id);
                        return (
                          <TableCell key={`${member.id}-${platform.id}`} className="text-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditPermissions(member, platform)}
                            >
                              {userPermissions.isAdmin ? (
                                <span className="text-blue-600 font-medium">Admin</span>
                              ) : userPermissions.canReply ? (
                                <span className="text-green-600">Full Access</span>
                              ) : userPermissions.canView ? (
                                <span className="text-amber-600">View Only</span>
                              ) : (
                                <span className="text-gray-400">No Access</span>
                              )}
                            </Button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
            {selectedMember && selectedPlatform && (
              <DialogDescription>
                Set permissions for {selectedMember.name} on {selectedPlatform.accountName}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedMember && selectedPlatform && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="view" 
                  checked={currentPermissions.canView} 
                  onCheckedChange={() => handleTogglePermission('canView')}
                />
                <label htmlFor="view" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Can view comments and messages
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="reply" 
                  checked={currentPermissions.canReply} 
                  onCheckedChange={() => handleTogglePermission('canReply')}
                />
                <label htmlFor="reply" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Can reply to comments and messages
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mark" 
                  checked={currentPermissions.canMarkAnswered} 
                  onCheckedChange={() => handleTogglePermission('canMarkAnswered')}
                />
                <label htmlFor="mark" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Can mark as answered/unanswered
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="admin" 
                  checked={currentPermissions.isAdmin} 
                  onCheckedChange={() => handleTogglePermission('isAdmin')}
                />
                <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Administrator (can manage all settings)
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Permissions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 