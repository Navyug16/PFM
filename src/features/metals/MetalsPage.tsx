import React from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Coins } from 'lucide-react'

export const MetalsPage: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Metals Tracker"
        description="Monitor real-time Gold and Silver market rates."
      />
      <div className="mt-8">
        <EmptyState
          title="Precious Metals Tracker Coming Soon"
          description="In future milestones, we will integrate live commodity APIs to fetch real-time and historical spot rates for Gold and Silver, helping you evaluate commodity asset values in your net worth."
          icon={<Coins size={32} className="text-brand-purple" />}
        />
      </div>
    </PageContainer>
  )
}
