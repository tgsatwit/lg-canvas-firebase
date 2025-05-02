import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingContentProps {
  children: React.ReactNode;
  loading: boolean;
  error?: string | null;
  loadingText?: string;
}

export function LoadingContent({
  children,
  loading,
  error,
  loadingText = 'Loading...',
}: LoadingContentProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{loadingText}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
} 