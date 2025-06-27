"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Types
type Platform = 'facebook' | 'instagram' | 'youtube' | 'twitter' | 'linkedin';

interface PlatformConfig {
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  authUrl: string;
  needsAccountId: boolean;
}

// Platform configurations
const platformConfigs: Record<Platform, PlatformConfig> = {
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-600',
    icon: <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 2C6.47813 2 2.00098 6.47715 2.00098 12C2.00098 16.9913 5.65783 21.1283 10.4385 21.8785V14.8906H7.89941V12H10.4385V9.79688C10.4385 7.29063 11.9314 5.90625 14.2156 5.90625C15.3097 5.90625 16.4541 6.10156 16.4541 6.10156V8.5625H15.1931C13.9509 8.5625 13.5635 9.33334 13.5635 10.1242V12H16.3369L15.8936 14.8906H13.5635V21.8785C18.3441 21.1283 22.001 16.9913 22.001 12C22.001 6.47715 17.5238 2 12.001 2Z"></path></svg>,
    description: 'Connect your Facebook page to monitor and respond to comments directly.',
    authUrl: 'https://www.facebook.com/dialog/oauth',
    needsAccountId: true,
  },
  instagram: {
    name: 'Instagram',
    color: 'bg-purple-600',
    icon: <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 9C10.3436 9 9.00098 10.3431 9.00098 12C9.00098 13.6573 10.3441 15 12.001 15C13.6583 15 15.001 13.6569 15.001 12C15.001 10.3427 13.6579 9 12.001 9ZM12.001 7C14.7614 7 17.001 9.2371 17.001 12C17.001 14.7605 14.7639 17 12.001 17C9.24051 17 7.00098 14.7629 7.00098 12C7.00098 9.23953 9.23808 7 12.001 7ZM18.501 6.74915C18.501 7.43926 17.9402 7.99917 17.251 7.99917C16.5609 7.99917 16.001 7.4384 16.001 6.74915C16.001 6.0599 16.5617 5.5 17.251 5.5C17.9393 5.49913 18.501 6.0599 18.501 6.74915ZM12.001 4C9.5265 4 9.12318 4.00655 7.97227 4.0578C7.18815 4.09461 6.66253 4.20007 6.17416 4.38967C5.74016 4.55799 5.42709 4.75898 5.09352 5.09255C4.75867 5.4274 4.55804 5.73963 4.3904 6.17383C4.20036 6.66332 4.09493 7.18811 4.05878 7.97115C4.00703 9.0752 4.00098 9.46105 4.00098 12C4.00098 14.4745 4.00753 14.8778 4.05877 16.0286C4.0956 16.8124 4.2012 17.3388 4.39034 17.826C4.5591 18.2606 4.7605 18.5744 5.09246 18.9064C5.42863 19.2421 5.74179 19.4429 6.17187 19.6094C6.66622 19.8005 7.19155 19.9061 7.97212 19.9422C9.07618 19.9939 9.46203 20 12.001 20C14.4755 20 14.8788 19.9934 16.0296 19.9422C16.8137 19.9054 17.3404 19.7996 17.827 19.6106C18.2604 19.4423 18.5752 19.2402 18.9074 18.9085C19.2436 18.5718 19.4445 18.2594 19.6107 17.8283C19.8013 17.3358 19.9071 16.8114 19.9432 16.0284C19.9949 14.9243 20.001 14.5385 20.001 12C20.001 9.52552 19.9944 9.12221 19.9432 7.97137C19.9064 7.18733 19.8005 6.66058 19.6113 6.17383C19.4434 5.74038 19.2417 5.42635 18.9084 5.09255C18.573 4.75715 18.2616 4.55693 17.8271 4.38942C17.338 4.19954 16.8124 4.09396 16.0298 4.05781C14.9258 4.00605 14.5399 4 12.001 4ZM12.001 2C14.7176 2 15.0568 2.01 16.1235 2.06C17.1876 2.10917 17.9135 2.2775 18.551 2.525C19.2101 2.77917 19.7668 3.1225 20.3226 3.67833C20.8776 4.23417 21.221 4.7925 21.476 5.45C21.7226 6.08667 21.891 6.81333 21.941 7.8775C21.9885 8.94417 22.001 9.28333 22.001 12C22.001 14.7167 21.991 15.0558 21.941 16.1225C21.8918 17.1867 21.7226 17.9133 21.476 18.55C21.2218 19.2092 20.8776 19.7658 20.3226 20.3217C19.7668 20.8767 19.2076 21.22 18.551 21.475C17.9135 21.7217 17.1876 21.89 16.1235 21.94C15.0568 21.9875 14.7176 22 12.001 22C9.28431 22 8.94514 21.99 7.87848 21.94C6.81431 21.8908 6.08848 21.7217 5.45098 21.475C4.79264 21.2208 4.23514 20.8767 3.67931 20.3217C3.12348 19.7658 2.78098 19.2067 2.52598 18.55C2.27848 17.9133 2.11098 17.1867 2.06098 16.1225C2.01348 15.0558 2.00098 14.7167 2.00098 12C2.00098 9.28333 2.01098 8.94417 2.06098 7.8775C2.11014 6.8125 2.27848 6.0875 2.52598 5.45C2.78014 4.79167 3.12348 4.23417 3.67931 3.67833C4.23514 3.1225 4.79348 2.78 5.45098 2.525C6.08848 2.2775 6.81348 2.11 7.87848 2.06C8.94514 2.0125 9.28431 2 12.001 2Z"></path></svg>,
    description: 'Connect your Instagram business account to monitor and respond to comments.',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    needsAccountId: false,
  },
  youtube: {
    name: 'YouTube',
    color: 'bg-red-600',
    icon: <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.244 4.00005C12.177 4.00082 12.111 4.00233 12.046 4.00458C11.4198 4.02502 10.9098 4.07247 10.4882 4.11777C10.3274 4.13683 10.1775 4.15524 10.0366 4.17277C9.45459 4.25643 8.95275 4.32989 8.41504 4.50116C7.28659 4.85748 6.47257 5.6411 6.07788 6.74546C5.87103 7.32161 5.79849 7.88039 5.73195 8.4641C5.70765 8.69318 5.6839 8.92532 5.65629 9.17262C5.56665 9.97579 5.5 10.9532 5.5 12.0001C5.5 13.0471 5.56665 14.0244 5.65629 14.8276C5.6839 15.0749 5.70765 15.307 5.73195 15.5361C5.79849 16.1198 5.87103 16.6786 6.07788 17.2548C6.47257 18.3591 7.28659 19.1427 8.41504 19.4991C8.95275 19.6703 9.45459 19.7438 10.0366 19.8274C10.1775 19.845 10.3274 19.8634 10.4882 19.8824C10.9098 19.9277 11.4198 19.9752 12.046 19.9956C12.111 19.9979 12.177 19.9994 12.244 20.0001H12.7563C12.8233 19.9994 12.8895 19.9979 12.9542 19.9956C13.5804 19.9752 14.0904 19.9277 14.512 19.8824C14.6728 19.8634 14.8227 19.845 14.9636 19.8274C15.5457 19.7438 16.0475 19.6703 16.5852 19.4991C17.7137 19.1427 18.5277 18.3591 18.9224 17.2548C19.1292 16.6786 19.2018 16.1198 19.2683 15.5361C19.2926 15.307 19.3164 15.0749 19.344 14.8276C19.4336 14.0244 19.5 13.0471 19.5 12.0001C19.5 10.9532 19.4336 9.97579 19.344 9.17262C19.3164 8.92532 19.2926 8.69318 19.2683 8.4641C19.2018 7.88039 19.1292 7.32161 18.9224 6.74546C18.5277 5.6411 17.7137 4.85748 16.5852 4.50116C16.0475 4.32989 15.5457 4.25643 14.9636 4.17277C14.8227 4.15524 14.6728 4.13683 14.512 4.11777C14.0904 4.07247 13.5804 4.02502 12.9542 4.00458C12.8895 4.00233 12.8233 4.00082 12.7563 4.00005H12.244ZM12.5003 6.00005C14.0858 6.00005 15.137 6.53981 15.7215 7.55389C16.0666 8.14753 16.1858 8.81354 16.2454 9.61474C16.3484 10.9168 16.2931 12.401 15.6905 13.5794C15.0995 14.7373 14.0278 15.5 12.5003 15.5C10.9729 15.5 9.9012 14.7373 9.31015 13.5794C8.70755 12.401 8.65231 10.9168 8.75531 9.61474C8.81488 8.81354 8.93407 8.14753 9.27915 7.55389C9.86371 6.53981 10.9149 6.00005 12.5003 6.00005ZM12.5003 8.00005C11.7542 8.00005 11.2502 8.23015 10.9421 8.7495C10.7616 9.05853 10.6797 9.46235 10.6419 9.97937C10.5735 10.9383 10.6345 11.9291 10.9401 12.5431C11.2605 13.1842 11.7477 13.5 12.5003 13.5C13.253 13.5 13.7402 13.1842 14.0606 12.5431C14.3662 11.9291 14.4271 10.9383 14.3588 9.97937C14.321 9.46235 14.2391 9.05853 14.0586 8.7495C13.7505 8.23015 13.2465 8.00005 12.5003 8.00005Z"></path></svg>,
    description: 'Connect your YouTube channel to monitor and respond to video comments.',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    needsAccountId: false,
  },
  twitter: {
    name: 'Twitter',
    color: 'bg-sky-500',
    icon: <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 2H1L9.26086 13.0145L1.44995 22H4.09998L10.4883 14.431L16 22H23L14.3917 10.5223L21.8001 2H19.1501L13.1643 9.06785L8 2ZM17 20L5 4H7L19 20H17Z"></path></svg>,
    description: 'Connect your X (Twitter) account to monitor and respond to mentions and replies.',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    needsAccountId: false,
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'bg-blue-700',
    icon: <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.94048 4.99993C6.94011 5.81424 6.44608 6.54702 5.69134 6.84953C4.9366 7.15204 4.07187 6.97253 3.5049 6.39951C2.93793 5.82648 2.76519 4.9603 3.07365 4.20799C3.38211 3.45569 4.12012 2.96737 4.93434 2.97C5.98947 2.97374 6.83725 3.83301 6.94048 4.88767V4.99993ZM7.00001 8.48002H3.00001V21H7.00001V8.48002ZM13.32 8.48002H9.34001V21H13.28V14.43C13.28 10.77 18.05 10.43 18.05 14.43V21H22V13.07C22 6.9 14.94 7.13 13.28 10.16L13.32 8.48002Z"></path></svg>,
    description: 'Connect your LinkedIn company page to monitor and respond to post comments.',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    needsAccountId: true,
  },
};

// Steps in the wizard
type WizardStep = 'select' | 'connect' | 'configure' | 'complete';

export default function ConnectPlatformWizard() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    accessToken: '',
    accountId: '',
    accountName: '',
  });

  // Handle platform selection
  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setStep('connect');
  };

  // Handle going back to previous step
  const handleBack = () => {
    if (step === 'connect') setStep('select');
    else if (step === 'configure') setStep('connect');
    else if (step === 'complete') router.push('/dashboard/social-monitor');
  };

  // Simulate OAuth authentication
  const handleConnect = async () => {
    if (!selectedPlatform) return;
    
    setIsLoading(true);
    
    // In a real implementation, this would redirect to the platform's OAuth page
    // For demo purposes, we'll simulate the process with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate a successful auth token
    setFormData(prev => ({ 
      ...prev, 
      accessToken: 'mock_oauth_token_' + Date.now() 
    }));
    
    setIsLoading(false);
    
    // If the platform needs additional account info, go to the configure step
    if (platformConfigs[selectedPlatform].needsAccountId) {
      setStep('configure');
    } else {
      handleSubmit();
    }
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit the connection request
  const handleSubmit = async () => {
    if (!selectedPlatform) return;
    
    setIsLoading(true);
    
    try {
      // API call to connect the platform
      const response = await fetch('/api/social/connect-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: selectedPlatform,
          accessToken: formData.accessToken,
          accountId: formData.accountId || undefined,
          accountName: formData.accountName || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect platform');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Platform Connected',
        description: `Successfully connected to ${platformConfigs[selectedPlatform].name}!`,
      });
      
      setStep('complete');
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: `There was an error connecting to ${platformConfigs[selectedPlatform].name}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Connect a Social Platform</CardTitle>
              <CardDescription>
                Choose a social media platform to connect for monitoring and engagement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Platforms</TabsTrigger>
                  <TabsTrigger value="connected">Connected</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(platformConfigs).map(([key, config]) => (
                    <div
                      key={key}
                      className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectPlatform(key as Platform)}
                    >
                      <div className={`flex items-center p-4 ${config.color} text-white`}>
                        <div className="mr-3">{config.icon}</div>
                        <div className="font-medium text-lg">{config.name}</div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600">{config.description}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="connected">
                  <div className="text-center py-6">
                    <p className="text-gray-500">No platforms connected yet.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </div>
        );
      
      case 'connect':
        if (!selectedPlatform) return null;
        
        const platform = platformConfigs[selectedPlatform];
        
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Connect to {platform.name}</CardTitle>
              <CardDescription>
                Authorize access to your {platform.name} account to enable monitoring and engagement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className={`p-6 rounded-lg ${platform.color} text-white flex items-center justify-center`}>
                <div className="mr-3 text-3xl">{platform.icon}</div>
                <div className="text-xl font-medium">{platform.name}</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium">This will allow Inbox Zero to:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-600">
                  <li>Read comments and messages from your {platform.name} account</li>
                  <li>Respond to comments and messages on your behalf</li>
                  <li>Monitor engagement metrics</li>
                  <li>Generate AI-powered response suggestions</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-500">
                We'll never post anything without your explicit permission. 
                You can disconnect this integration at any time.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect to ${platform.name}`
                )}
              </Button>
            </CardFooter>
          </div>
        );
      
      case 'configure':
        if (!selectedPlatform) return null;
        
        const configPlatform = platformConfigs[selectedPlatform];
        
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Configure {configPlatform.name}</CardTitle>
              <CardDescription>
                Provide additional information about your {configPlatform.name} account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlatform === 'facebook' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facebook Page ID</label>
                    <Input
                      name="accountId"
                      placeholder="e.g. 1234567890"
                      value={formData.accountId}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500">
                      Your Facebook Page ID can be found in your page's About section or in the URL.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Page Name</label>
                    <Input
                      name="accountName"
                      placeholder="e.g. My Business Page"
                      value={formData.accountName}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
              
              {selectedPlatform === 'linkedin' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">LinkedIn Company ID</label>
                    <Input
                      name="accountId"
                      placeholder="e.g. 1234567"
                      value={formData.accountId}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500">
                      Your LinkedIn Company ID can be found in your company page URL.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input
                      name="accountName"
                      placeholder="e.g. My Company"
                      value={formData.accountName}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !formData.accountId}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Complete Connection'
                )}
              </Button>
            </CardFooter>
          </div>
        );
      
      case 'complete':
        if (!selectedPlatform) return null;
        
        const completePlatform = platformConfigs[selectedPlatform];
        
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Connection Successful!</CardTitle>
              <CardDescription>
                Your {completePlatform.name} account has been successfully connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-800">Connection Complete</h3>
                <p className="text-green-600 mt-1">
                  Your {completePlatform.name} account is now ready for monitoring and engagement.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">What's next?</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                  <li>We'll start syncing your comments and messages (this may take a few minutes)</li>
                  <li>You can view and respond to comments from the Social Monitor dashboard</li>
                  <li>Set up automatic replies and AI-generated responses in the settings</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => router.push('/dashboard/social-monitor')}>
                Go to Social Monitor
              </Button>
            </CardFooter>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      {renderStepContent()}
    </Card>
  );
} 