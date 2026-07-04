import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Settings } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Configure your profile, preferences, and security."
      />
      <div className="mt-8">
        <EmptyState
          title="App Settings Coming Soon"
          description="In future milestones, you will be able to customize currencies, configure UI themes, toggle email reports, configure security PIN/biometrics, and export your transaction data as CSV/PDF."
          icon={<Settings size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
