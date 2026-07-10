import React, { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileSettings } from './components/ProfileSettings'
import { FinancialPreferences } from './components/FinancialPreferences'
import { AppearanceSettings } from './components/AppearanceSettings'
import { SecuritySettings } from './components/SecuritySettings'
import { DataPrivacySettings } from './components/DataPrivacySettings'
import { AccountDangerZone } from './components/AccountDangerZone'
import { User, Sliders, Sun, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react'

type SettingsTab = 'profile' | 'preferences' | 'appearance' | 'security' | 'privacy' | 'danger'

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Sliders },
    { id: 'appearance' as const, label: 'Theme', icon: Sun },
    { id: 'security' as const, label: 'Security', icon: ShieldCheck },
    { id: 'privacy' as const, label: 'Data & Privacy', icon: HelpCircle },
    { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Configure your profile, financial preferences, appearance, and security credentials."
      />

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar Tabs */}
        <aside className="w-full md:w-56 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-3 md:pb-0 md:overflow-x-visible border-b md:border-b-0 border-border-neutral">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-custom-md text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 border border-transparent'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Settings Tab Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'preferences' && <FinancialPreferences />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'privacy' && <DataPrivacySettings />}
          {activeTab === 'danger' && <AccountDangerZone />}
        </main>
      </div>
    </PageContainer>
  )
}
