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

  // Stock Metrics (Current State) - Multi-Currency Dictionaries
  availableBalance: { [currency: string]: number }
  netPosition: { [currency: string]: number }

  // Flow Metrics (Period State) - Multi-Currency Dictionaries
  periodIncome: { [currency: string]: number }
  periodExpenses: { [currency: string]: number }
  periodSavings: { [currency: string]: number }
  savingsRate: { [currency: string]: number }

  // Flow Metrics (Previous Comparison State) - Multi-Currency Dictionaries
  prevPeriodIncome: { [currency: string]: number }
  prevPeriodExpenses: { [currency: string]: number }
  prevPeriodSavings: { [currency: string]: number }
  prevPeriodSavingsRate: { [currency: string]: number }

  // Today's Glance
  todayExpenses: { [currency: string]: number }
  todayCount: number
  todayMaxExpense: Transaction | null
  dailyAverage: { [currency: string]: number }

  // Spending Breakdown & Intervals
  categoryShare: { category: Category | null; amount: number; percentage: number }[]
  cashFlowIntervals: { label: string; income: number; expenses: number }[]

  // Prioritized Insights
  insights: FinancialInsight[]
}
