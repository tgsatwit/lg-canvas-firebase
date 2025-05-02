import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram, Youtube } from 'lucide-react';

interface SocialDashboardTileProps {
  stats: {
    total: number;
    unanswered: number;
    instagram: number;
    facebook: number;
    youtube: number;
    selected?: number;
  };
}

export function SocialDashboardTile({ stats }: SocialDashboardTileProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Total Comments</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Unanswered</span>
            <Badge variant="destructive">{stats.unanswered}</Badge>
          </div>
          {stats.selected && stats.selected > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Selected</span>
              <Badge variant="secondary">{stats.selected}</Badge>
            </div>
          )}
          <div className="h-px bg-slate-100 my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Instagram className="h-3 w-3 text-pink-500" /> Instagram
            </span>
            <span className="font-medium">{stats.instagram}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Facebook className="h-3 w-3 text-blue-600" /> Facebook
            </span>
            <span className="font-medium">{stats.facebook}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 flex items-center gap-1">
              <Youtube className="h-3 w-3 text-red-600" /> YouTube
            </span>
            <span className="font-medium">{stats.youtube}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 