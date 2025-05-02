"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingContent } from '@/components/ui/loading-content';

export function SocialMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('youtube');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Comments</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="youtube" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
          </TabsList>
          
          <LoadingContent loading={isLoading} error={null}>
            <TabsContent value="youtube" className="space-y-4">
              <div className="bg-muted/50 p-6 text-center rounded-md">
                <p className="text-muted-foreground">YouTube comments monitor coming soon</p>
              </div>
            </TabsContent>
            
            <TabsContent value="facebook" className="space-y-4">
              <div className="bg-muted/50 p-6 text-center rounded-md">
                <p className="text-muted-foreground">Facebook comments monitor coming soon</p>
              </div>
            </TabsContent>
            
            <TabsContent value="instagram" className="space-y-4">
              <div className="bg-muted/50 p-6 text-center rounded-md">
                <p className="text-muted-foreground">Instagram comments monitor coming soon</p>
              </div>
            </TabsContent>
            
            <TabsContent value="twitter" className="space-y-4">
              <div className="bg-muted/50 p-6 text-center rounded-md">
                <p className="text-muted-foreground">Twitter comments monitor coming soon</p>
              </div>
            </TabsContent>
          </LoadingContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 