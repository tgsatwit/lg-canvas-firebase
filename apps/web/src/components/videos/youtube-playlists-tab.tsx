"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Eye,
  Users,
  MoreHorizontal
} from 'lucide-react';

export function YouTubePlaylistsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Active playlists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Playlists</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Publicly visible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">Videos in playlists</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5K</div>
            <p className="text-xs text-muted-foreground">Playlist views</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-white text-center">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">12 videos</p>
              </div>
            </div>
            <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-600">
              <Users className="h-3 w-3 mr-1" />
              Public
            </Badge>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                  Beginner Workouts
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Perfect for fitness beginners starting their journey
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    2.1K views
                  </span>
                  <span>Updated 2 days ago</span>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
          <div className="aspect-video bg-gradient-to-br from-red-500 to-red-600 rounded-t-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-white text-center">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">8 videos</p>
              </div>
            </div>
            <Badge className="absolute top-2 right-2 bg-green-600 hover:bg-green-600">
              <Users className="h-3 w-3 mr-1" />
              Public
            </Badge>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-blue-600 transition-colors">
                  HIIT Training
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  High-intensity interval training for maximum results
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    4.8K views
                  </span>
                  <span>Updated 1 week ago</span>
                </div>
              </div>
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 