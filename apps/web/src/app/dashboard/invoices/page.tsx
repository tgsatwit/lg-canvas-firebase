"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InvoicesTab } from './components/InvoicesTab';
import { TaxTab } from './components/TaxTab';
import { SettingsTab } from './components/SettingsTab';

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'invoices' | 'tax' | 'settings'>('invoices');

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
              <h1 className="text-3xl font-bold text-gray-900">Invoices & Tax</h1>
              <p className="text-gray-600 mt-1">Manage business expenses and tax preparation</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
              <Button
                variant={activeTab === 'invoices' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('invoices')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'invoices' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'invoices' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Invoices
              </Button>
              <Button
                variant={activeTab === 'tax' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('tax')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'tax' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'tax' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Tax Calculation
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "rounded-xl transition-all duration-200 px-6 py-2",
                  activeTab === 'settings' 
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={activeTab === 'settings' ? {
                  background: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
                } : {}}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'invoices' && <InvoicesTab />}
            {activeTab === 'tax' && <TaxTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}