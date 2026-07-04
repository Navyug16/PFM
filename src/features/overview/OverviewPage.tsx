import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { LayoutDashboard } from 'lucide-react'

export const OverviewPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader title="Overview" description="Understand your money in under 60 seconds." />
      <div className="mt-8">
        <EmptyState
          title="Overview Dashboard Coming Soon"
          description="In future milestones, this dashboard will present key financial metrics, latest transaction highlights, and progress toward your goals. Active financial tracking starts here."
          icon={<LayoutDashboard size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
