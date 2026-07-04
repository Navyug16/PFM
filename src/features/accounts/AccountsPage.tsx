import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Landmark } from 'lucide-react'

export const AccountsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Accounts"
        description="Manage your bank accounts, credit cards, and cash assets."
      />
      <div className="mt-8">
        <EmptyState
          title="Account Management Coming Soon"
          description="In future milestones, you will be able to manage bank accounts, credit cards, investments, and physical assets, keeping track of their individual balances and overall net worth."
          icon={<Landmark size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
