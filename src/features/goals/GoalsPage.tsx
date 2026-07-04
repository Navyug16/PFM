import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Target } from 'lucide-react'

export const GoalsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Goals"
        description="Set and track progress towards your financial objectives."
      />
      <div className="mt-8">
        <EmptyState
          title="Financial Goals Coming Soon"
          description="In future milestones, you will be able to set monthly savings goals and long-term financial-year objectives, tracking your real-time progress and forecasting completion timelines."
          icon={<Target size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
