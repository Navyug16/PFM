import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Receipt } from 'lucide-react'

export const TransactionsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        description="View, log, and filter your financial entries."
      />
      <div className="mt-8">
        <EmptyState
          title="Transaction History Coming Soon"
          description="In future milestones, you will be able to log income, expenses, and transfers, categorize your cash flows, attach tags, and search through your complete transaction history."
          icon={<Receipt size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
