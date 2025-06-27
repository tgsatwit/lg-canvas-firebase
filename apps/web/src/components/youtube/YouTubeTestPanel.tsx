'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, 
  Key, Cloud, Youtube, Info 
} from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  details?: any;
}

export default function YouTubeTestPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [detailedResults, setDetailedResults] = useState<any>(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setDetailedResults(null);

    const tests: TestResult[] = [
      { test: 'YouTube Authentication', status: 'pending' },
      { test: 'Token Validation', status: 'pending' },
      { test: 'Google Cloud Storage Access', status: 'pending' },
      { test: 'Firebase Functions Connection', status: 'pending' },
      { test: 'YouTube Channel Access', status: 'pending' },
    ];

    setTestResults([...tests]);

    // Test 1: Check YouTube Authentication
    updateTest(0, 'running');
    try {
      const tokenResponse = await fetch('/api/auth/youtube/token');
      const tokenData = await tokenResponse.json();
      
      if (tokenData.hasToken) {
        updateTest(0, 'success', 'YouTube tokens found');
      } else {
        updateTest(0, 'error', 'No YouTube tokens found. Please authenticate.');
      }
    } catch (error: any) {
      updateTest(0, 'error', `Failed to check tokens: ${error.message}`);
    }

    // Test 2: Validate Token with Firebase Functions
    updateTest(1, 'running');
    try {
      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/face-by-lisa/us-central1';
      
      // Get token for the request
      const tokenResponse = await fetch('/api/auth/youtube/token');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.hasToken || !tokenData.accessToken) {
        updateTest(1, 'error', 'No access token available');
      } else {
        const response = await fetch(`${functionsUrl}/api/youtube/test?detailed=true`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (result.success) {
          updateTest(1, 'success', 'Token is valid');
          setDetailedResults(result);
          
          // Check token expiry
          if (result.detailed?.tokenInfo) {
            const tokenInfo = result.detailed.tokenInfo;
            if (!tokenInfo.valid) {
              updateTest(1, 'error', 'Token is expired. Please re-authenticate.');
            } else {
              const scopes = tokenInfo.scopes || [];
              if (!scopes.includes('https://www.googleapis.com/auth/youtube.upload')) {
                updateTest(1, 'error', 'Token missing YouTube upload scope');
              }
            }
          }
        } else {
          updateTest(1, 'error', result.error || 'Token validation failed');
          if (result.detailed?.tokenError) {
            updateTest(1, 'error', `Token error: ${result.detailed.tokenError.message}`);
          }
        }
      }
    } catch (error: any) {
      updateTest(1, 'error', `Failed to validate token: ${error.message}`);
    }

    // Test 3: Google Cloud Storage Access
    updateTest(2, 'running');
    try {
      // Check if we have GCS credentials configured
      const hasGcsCredentials = detailedResults?.environment?.hasGoogleCredentials;
      
      if (hasGcsCredentials) {
        updateTest(2, 'success', 'Google Cloud credentials configured');
      } else {
        updateTest(2, 'error', 'Google Cloud credentials not configured');
      }
    } catch (error: any) {
      updateTest(2, 'error', `Failed to check GCS: ${error.message}`);
    }

    // Test 4: Firebase Functions Connection
    updateTest(3, 'running');
    try {
      const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || 'http://localhost:5001/face-by-lisa/us-central1';
      const response = await fetch(`${functionsUrl}/api/youtube/uploads?limit=1`);
      
      if (response.ok) {
        updateTest(3, 'success', 'Firebase Functions connected');
      } else {
        updateTest(3, 'error', `Firebase Functions error: ${response.status}`);
      }
    } catch (error: any) {
      updateTest(3, 'error', `Failed to connect to Firebase Functions: ${error.message}`);
    }

    // Test 5: YouTube Channel Access
    updateTest(4, 'running');
    if (detailedResults?.channel) {
      updateTest(4, 'success', `Channel: ${detailedResults.channel.title}`);
    } else if (detailedResults?.error) {
      updateTest(4, 'error', detailedResults.error);
    } else {
      updateTest(4, 'error', 'Could not access YouTube channel');
    }

    setIsRunning(false);
  };

  const updateTest = (index: number, status: TestResult['status'], message?: string, details?: any) => {
    setTestResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, message, details };
      return updated;
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const reAuthenticate = () => {
    window.location.href = '/api/auth/youtube';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>YouTube Integration Test Panel</CardTitle>
          <CardDescription>
            Run diagnostics to check YouTube upload configuration and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </Button>
            <Button
              onClick={reAuthenticate}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Key className="h-4 w-4" />
              <span>Re-authenticate YouTube</span>
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3 mt-6">
              <h3 className="font-medium text-sm text-gray-600">Test Results</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.test}</div>
                    {result.message && (
                      <div className="text-sm text-gray-600 mt-1">{result.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {detailedResults && (
            <div className="mt-6 space-y-4">
              <h3 className="font-medium text-sm text-gray-600">Detailed Information</h3>
              
              {/* Environment Info */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Cloud className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Environment Configuration</span>
                </div>
                <div className="text-sm space-y-1 ml-6">
                  <div>Client ID: {detailedResults.environment?.hasClientId ? '✓ Set' : '✗ Missing'}</div>
                  <div>Client Secret: {detailedResults.environment?.hasClientSecret ? '✓ Set' : '✗ Missing'}</div>
                  <div>Redirect URL: {detailedResults.environment?.hasRedirectUrl ? '✓ Set' : '✗ Missing'}</div>
                  <div>Google Credentials: {detailedResults.environment?.hasGoogleCredentials ? '✓ Set' : '✗ Missing'}</div>
                  <div>Project ID: {detailedResults.environment?.googleProjectId || 'Not set'}</div>
                </div>
              </div>

              {/* Token Info */}
              {detailedResults.detailed?.tokenInfo && (
                <div className="p-4 bg-green-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Token Information</span>
                  </div>
                  <div className="text-sm space-y-1 ml-6">
                    <div>Valid: {detailedResults.detailed.tokenInfo.valid ? '✓ Yes' : '✗ No'}</div>
                    <div>Scopes: {detailedResults.detailed.tokenInfo.scopes?.join(', ') || 'None'}</div>
                    {detailedResults.detailed.tokenInfo.expiry_date && (
                      <div>Expires: {new Date(detailedResults.detailed.tokenInfo.expiry_date).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Channel Info */}
              {detailedResults.channel && (
                <div className="p-4 bg-purple-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">YouTube Channel</span>
                  </div>
                  <div className="text-sm space-y-1 ml-6">
                    <div>Channel ID: {detailedResults.channel.id}</div>
                    <div>Title: {detailedResults.channel.title}</div>
                    {detailedResults.channel.description && (
                      <div>Description: {detailedResults.channel.description}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Errors */}
              {(detailedResults.detailed?.apiError || detailedResults.detailed?.tokenError) && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="font-medium mb-1">API Errors Detected</div>
                    {detailedResults.detailed?.tokenError && (
                      <div className="text-sm">Token Error: {detailedResults.detailed.tokenError.message}</div>
                    )}
                    {detailedResults.detailed?.apiError && (
                      <div className="text-sm">
                        API Error: {detailedResults.detailed.apiError.message}
                        {detailedResults.detailed.apiError.errors && (
                          <pre className="mt-2 text-xs bg-red-100 p-2 rounded">
                            {JSON.stringify(detailedResults.detailed.apiError.errors, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>This test panel checks:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>YouTube OAuth2 authentication status</li>
                  <li>Token validity and expiration</li>
                  <li>Required API scopes for uploading</li>
                  <li>Google Cloud Storage configuration</li>
                  <li>Firebase Functions connectivity</li>
                  <li>YouTube channel access permissions</li>
                </ul>
                <p className="mt-2 text-sm">If any tests fail, use the "Re-authenticate YouTube" button to refresh your credentials.</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 