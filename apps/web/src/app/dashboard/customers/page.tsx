"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AllMembersTab } from './components/AllMembersTab';
import { MembersTab } from './components/MembersTabNew';
import { MailchimpTab } from './components/MailchimpTab';
import { ReconcileTab } from './components/ReconcileTab';

export default function VimeoOttPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'members' | 'videos' | 'mailchimp' | 'reconcile'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div 
      className="relative min-h-screen"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(148, 163, 184, 0.08) 0%,
            rgba(203, 213, 225, 0.04) 50%,
            rgba(148, 163, 184, 0.08) 100%
          )
        `,
      }}
    >
      {/* Ambient background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 35% 25%, rgba(148, 163, 184, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 65% 75%, rgba(203, 213, 225, 0.12) 0%, transparent 50%),
              radial-gradient(circle at 50% 10%, rgba(156, 163, 175, 0.08) 0%, transparent 40%)
            `,
          }}
        />
      </div>

      <div className="relative z-10 p-6">
        <div className="w-full max-w-none">
          {/* Header */}
          <div 
            className="p-6 rounded-2xl border mb-8"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255, 255, 255, 0.25) 0%,
                  rgba(255, 255, 255, 0.1) 100%
                )
              `,
              backdropFilter: 'blur(20px) saturate(150%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-1">Manage your customer database and marketing integrations</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <Button
                variant={activeTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('all')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'all' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'all' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                All Members
              </Button>
              <Button
                variant={activeTab === 'members' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('members')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'members' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'members' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Vimeo OTT Members
              </Button>
              <Button
                variant={activeTab === 'mailchimp' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('mailchimp')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'mailchimp' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'mailchimp' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Mailchimp
              </Button>
              <Button
                variant={activeTab === 'reconcile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('reconcile')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'reconcile' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'reconcile' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Reconcile
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'all' && <AllMembersTab searchQuery={searchQuery} onSearchChange={handleSearchChange} />}
            {activeTab === 'members' && <MembersTab searchQuery={searchQuery} onSearchChange={handleSearchChange} />}
            {activeTab === 'mailchimp' && <MailchimpTab searchQuery={searchQuery} onSearchChange={handleSearchChange} />}
            {activeTab === 'reconcile' && <ReconcileTab searchQuery={searchQuery} onSearchChange={handleSearchChange} />}
          </div>
        </div>
      </div>
    </div>
  );
}