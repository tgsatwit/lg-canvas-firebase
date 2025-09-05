"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MembersTab } from './components/MembersTabNew';
import { VideosTab } from './components/VideosTab';

export default function VimeoOttPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'videos'>('members');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6">
        <div className="w-full max-w-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Customers
              </h1>
              <p className="text-gray-600">Manage your customer database and marketing integrations</p>
            </div>
            
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
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
                variant={activeTab === 'videos' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('videos')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'videos' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'videos' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Mailchimp
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'members' && <MembersTab searchQuery={searchQuery} onSearchChange={handleSearchChange} />}
            {activeTab === 'videos' && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mailchimp Integration</h3>
                <p className="text-gray-600">Mailchimp integration coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}