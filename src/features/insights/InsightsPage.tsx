import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { TrendingUp } from 'lucide-react'

export const InsightsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Insights"
        description="Receive detailed answers to your financial questions."
      />
      <div className="mt-8">
        <EmptyState
          title="Financial Insights Coming Soon"
          description="In future milestones, the Financial Questions Engine will analyze your spending patterns, compare periods, detect overspending, and suggest actionable optimizations."
          icon={<TrendingUp size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
