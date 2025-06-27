"use client";

import { DashboardShell } from '@/components/dashboard/shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, Clock, Play } from 'lucide-react';

export default function YouTubeUploaderPage() {
  return (
    <DashboardShell>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">YouTube Uploader</h1>
                <p className="text-gray-600 mt-1">Upload and manage your workout videos to YouTube</p>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Video
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">Videos uploaded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">96%</div>
                <p className="text-xs text-muted-foreground">Successful uploads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Currently uploading</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Uploads</CardTitle>
                <CardDescription>Videos currently being processed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Full Body Workout - Beginner Level</h4>
                      <Progress value={75} className="mb-2" />
                      <p className="text-sm text-gray-600">75% complete - Processing metadata</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Advanced Cardio Session</h4>
                      <Progress value={45} className="mb-2" />
                      <p className="text-sm text-gray-600">45% complete - Uploading video</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">Yoga Flow for Flexibility</h4>
                      <Progress value={20} className="mb-2" />
                      <p className="text-sm text-gray-600">20% complete - Preparing upload</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest upload results and status updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">Morning Routine - Abs Focus</h4>
                      <p className="text-sm text-gray-600">Successfully uploaded 2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">Strength Training Basics</h4>
                      <p className="text-sm text-gray-600">Successfully uploaded 4 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border rounded-lg border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">HIIT Workout Challenge</h4>
                      <p className="text-sm text-gray-600">Upload failed - File too large</p>
                    </div>
                    <Button size="sm" variant="outline">Retry</Button>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border rounded-lg border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">Pilates Core Workout</h4>
                      <p className="text-sm text-gray-600">Upload failed - Network error</p>
                    </div>
                    <Button size="sm" variant="outline">Retry</Button>
                  </div>

                  <div className="flex items-center space-x-4 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-medium">Stretching & Recovery</h4>
                      <p className="text-sm text-gray-600">Successfully uploaded yesterday</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
} 