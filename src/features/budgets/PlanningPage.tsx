import React, { useState } from 'react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sliders, Edit2, Archive, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useBudgetData } from './hooks/useBudgetData'
import { createBudget, updateBudget, archiveBudget } from './api/budgets-api'
import { BudgetProgressCard } from './components/BudgetProgressCard'
import { PlanningInsights } from './components/PlanningInsights'
import { CategoryAllocations } from './components/CategoryAllocations'
import { BudgetForm } from './components/BudgetForm'

export const PlanningPage: React.FC = () => {
  const {
    loading,
    error,
    activeBudget,
    spent,
    remaining,
    usagePercentage,
    dailySafeToSpend,
    projectedSpending,
    projectedVariance,
    paceStatus,
    daysCounts,
    categoryBreakdown,
    uncategorizedSpending,
    totalAllocatedAmount,
    totalUnallocatedAmount,
    refetch,
    expenseCategories,
  } = useBudgetData()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleFormSubmit = async (
    budgetData: { name: string; start_date: string; end_date: string; total_limit: number },
    allocationsData: { category_id: string; allocated_amount: number }[]
  ) => {
    setActionError(null)
    setActionLoading(true)
    try {
      if (activeBudget) {
        await updateBudget(activeBudget.id, budgetData, allocationsData)
      } else {
        await createBudget(budgetData, allocationsData)
      }
      setIsFormOpen(false)
      await refetch()
    } catch (err: unknown) {
      console.error(err)
      setActionError(err instanceof Error ? err.message : 'Failed to save spending plan')
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!activeBudget) return
    if (!confirm('Are you sure you want to archive this spending budget plan? Historical calculations will be saved.')) return
    
    setActionError(null)
    setActionLoading(true)
    try {
      await archiveBudget(activeBudget.id)
      await refetch()
    } catch (err: unknown) {
      console.error(err)
      setActionError(err instanceof Error ? err.message : 'Failed to archive budget')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Budgets & Planning" description="Analyzing your spending plan..." />
        <div className="mt-8 space-y-6 animate-pulse">
          <div className="h-40 bg-surface-secondary border border-border-neutral rounded-custom-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-surface-secondary border border-border-neutral rounded-custom-xl" />
            <div className="h-32 bg-surface-secondary border border-border-neutral rounded-custom-xl" />
            <div className="h-32 bg-surface-secondary border border-border-neutral rounded-custom-xl" />
          </div>
          <div className="h-60 bg-surface-secondary border border-border-neutral rounded-custom-xl" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Budgets & Planning"
        description="Plan your expenses, track daily safe allowance limits, and forecast savings."
      />

      {error && (
        <div className="mt-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-xl flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex-1 text-sm">{error}</div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs font-bold bg-state-expense/20 px-3 py-1.5 rounded-custom-md hover:bg-state-expense/30"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {actionError && (
        <div className="mt-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-xl flex items-center gap-3">
          <AlertTriangle size={20} className="shrink-0" />
          <div className="flex-1 text-sm">{actionError}</div>
          <button onClick={() => setActionError(null)} className="text-xs font-bold text-text-secondary hover:text-text-primary">
            Dismiss
          </button>
        </div>
      )}

      {!activeBudget && !isFormOpen ? (
        <div className="mt-8">
          <EmptyState
            title="No Active Spending Plan"
            description="Create a monthly budget to unlock safe-to-spend insights, category limits tracking, and variance alerts."
            actionLabel="Setup Spending Plan"
            icon={<Sliders className="text-brand-purple" size={40} />}
            onAction={() => setIsFormOpen(true)}
          />
        </div>
      ) : isFormOpen && !activeBudget ? (
        <div className="mt-8 max-w-xl mx-auto bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-text-primary">Create Monthly spending budget plan</h2>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary"
            >
              <X size={18} />
            </button>
          </div>
          <BudgetForm
            key="new"
            expenseCategories={expenseCategories}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          
          {/* Action Header bar for active budgets */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-border-neutral rounded-custom-md text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
              disabled={actionLoading}
            >
              <Edit2 size={14} /> Edit Spending Plan
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 px-4 py-2 border border-state-expense/20 hover:bg-state-expense/10 rounded-custom-md text-xs font-semibold text-state-expense"
              disabled={actionLoading}
            >
              <Archive size={14} /> Archive Plan
            </button>
          </div>

          {/* Core overall progress bar card */}
          <BudgetProgressCard
            name={activeBudget!.name}
            startDate={activeBudget!.start_date}
            endDate={activeBudget!.end_date}
            limit={activeBudget!.total_limit}
            spent={spent}
            remaining={remaining}
            usagePercentage={usagePercentage}
            dailySafeToSpend={dailySafeToSpend}
            projectedSpending={projectedSpending}
            projectedVariance={projectedVariance}
            paceStatus={paceStatus}
            daysCounts={daysCounts}
          />

          {/* Priority Insight cards list */}
          <PlanningInsights
            spent={spent}
            limit={activeBudget!.total_limit}
            remaining={remaining}
            dailySafeToSpend={dailySafeToSpend}
            projectedSpending={projectedSpending}
            projectedVariance={projectedVariance}
            paceStatus={paceStatus}
            remainingDays={daysCounts.remainingDays}
            categoryBreakdown={categoryBreakdown}
            uncategorizedSpending={uncategorizedSpending}
          />

          {/* Category break down list */}
          <CategoryAllocations
            categoryBreakdown={categoryBreakdown}
            uncategorizedSpending={uncategorizedSpending}
            totalAllocatedAmount={totalAllocatedAmount}
            totalUnallocatedAmount={totalUnallocatedAmount}
            totalLimit={activeBudget!.total_limit}
          />

          {/* Edit Budget Modal sheet */}
          {isFormOpen && activeBudget && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-base font-bold text-text-primary">Edit Spending Budget Plan</h2>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 hover:bg-surface-secondary rounded-custom-md text-text-secondary hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>
                <BudgetForm
                  key={activeBudget.id}
                  initialBudget={activeBudget}
                  expenseCategories={expenseCategories}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </div>
          )}

        </div>
      )}
    </PageContainer>
  )
}
