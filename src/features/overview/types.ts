import type { Account, Transaction, Goal, GoalContribution, Category } from '../financial/types'

export type PeriodOption = 'week' | 'month' | 'last_month' | 'financial_year'

export interface FinancialInsight {
  id: string
  question: string
  answer: string
  supportingValue?: string
  direction?: 'positive' | 'negative' | 'neutral'
  priority: number
  actionLabel?: string
  actionPath?: string
}

export interface OverviewData {
  accounts: Account[]
  transactions: Transaction[]
  activeGoals: Goal[]
  goalContributions: { [goalId: string]: GoalContribution[] }
  categories: Category[]

  // Stock Metrics (Current State)
  availableBalance: number
  netPosition: number

  // Flow Metrics (Period State)
  periodIncome: number
  periodExpenses: number
  periodSavings: number
  savingsRate: number

  // Flow Metrics (Previous Comparison State)
  prevPeriodIncome: number
  prevPeriodExpenses: number
  prevPeriodSavings: number
  prevPeriodSavingsRate: number

  // Today's Glance
  todayExpenses: number
  todayCount: number
  todayMaxExpense: Transaction | null
  dailyAverage: number

  // Spending Breakdown & Intervals
  categoryShare: { category: Category | null; amount: number; percentage: number }[]
  cashFlowIntervals: { label: string; income: number; expenses: number }[]

  // Prioritized Insights
  insights: FinancialInsight[]
}
