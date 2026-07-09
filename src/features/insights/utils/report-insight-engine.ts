import { formatCurrency } from '@/features/financial/utils/formatters'
import type { CategoryBreakdownDetail } from './report-calculations'
import type { Goal } from '@/features/financial/types'

export interface FinancialInsight {
  id: string
  type:
    | 'negative_cash_flow'
    | 'spending_increase'
    | 'spending_decrease'
    | 'budget_exceeded'
    | 'budget_warning'
    | 'goal_behind'
    | 'spending_spike'
    | 'savings_rate_alert'
    | 'savings_improvement'
    | 'category_concentration'
    | 'recurring_commitments'
    | 'largest_expense'
  title: string
  statement: string
  explanation: string
  severity: 'positive' | 'neutral' | 'review' | 'important'
  priority: number // Higher = more important
  actionLabel?: string
  actionPath?: string
  relatedCategory?: string
  relatedTransactionId?: string
}

export const generateReportInsights = (params: {
  income: number
  expenses: number
  savings: number
  savingsRate: number
  prevExpenses: number
  prevSavings: number
  dailyAverage: number
  breakdown: CategoryBreakdownDetail[]
  spike: { spikeDate: string; amount: number; ratio: number } | null
  concentration: { topCategoryPercent: number; top3CategoriesPercent: number }
  recurringRatio: number
  budgetSpent: number // budget spent amount
  budgetLimit: number // budget limit
  goals: Goal[]
  goalPaceMap: { [goalId: string]: 'ahead' | 'on_pace' | 'behind' }
}): FinancialInsight[] => {
  const {
    income,
    expenses,
    savings,
    savingsRate,
    prevExpenses,
    prevSavings,
    breakdown,
    spike,
    concentration,
    recurringRatio,
    budgetSpent,
    budgetLimit,
    goals,
    goalPaceMap
  } = params

  const insights: FinancialInsight[] = []

  // 1. Negative Cash Flow (Deficit)
  if (savings < 0) {
    insights.push({
      id: 'insight-negative-cash-flow',
      type: 'negative_cash_flow',
      title: 'Net Cash Flow Deficit',
      statement: `Expenses exceeded income by ${formatCurrency(Math.abs(savings))}.`,
      explanation: 'You spent more than you earned during this period. Review discretionary spending to prevent balance depletion.',
      severity: 'important',
      priority: 95,
      actionLabel: 'Review Ledger',
      actionPath: '/transactions'
    })
  }

  // 2. Spending Increase
  if (prevExpenses > 0) {
    const diff = expenses - prevExpenses
    const pct = (diff / prevExpenses) * 100
    if (pct > 15) {
      const topExpenseCatName = breakdown.length > 0 ? breakdown[0].name : 'your top categories'
      insights.push({
        id: 'insight-spending-increase',
        type: 'spending_increase',
        title: 'High Spending Growth',
        statement: `Spending is up by ${formatCurrency(diff)} (+${Math.round(pct)}%) vs previous period.`,
        explanation: `Increases in ${topExpenseCatName} explain most of this relative growth in period outlays.`,
        severity: 'important',
        priority: 90,
        actionLabel: 'Analyze Categories',
        actionPath: '/transactions?type=expense'
      })
    } else if (pct < -10) {
      insights.push({
        id: 'insight-spending-decrease',
        type: 'spending_decrease',
        title: 'Spending Reduction',
        statement: `You spent ${formatCurrency(Math.abs(diff))} less (-${Math.round(Math.abs(pct))}%) than last period.`,
        explanation: 'Excellent outlays constraint! Keeping your expenses lower builds your long-term savings capacity.',
        severity: 'positive',
        priority: 40
      })
    }
  }

  // 3. Budget Limits
  if (budgetLimit > 0) {
    const usage = (budgetSpent / budgetLimit) * 100
    if (usage >= 100) {
      insights.push({
        id: 'insight-budget-exceeded',
        type: 'budget_exceeded',
        title: 'Budget Limit Exceeded',
        statement: `You exceeded your overall budget limit by ${formatCurrency(budgetSpent - budgetLimit)}.`,
        explanation: `Total spending reached ${Math.round(usage)}% of your planned limit. Plan category caps early for the next period.`,
        severity: 'important',
        priority: 85,
        actionLabel: 'Adjust Budget',
        actionPath: '/planning'
      })
    } else if (usage >= 80) {
      insights.push({
        id: 'insight-budget-warning',
        type: 'budget_warning',
        title: 'Budget Threshold Warning',
        statement: `You have consumed ${Math.round(usage)}% of your period spending plan.`,
        explanation: `Only ${formatCurrency(budgetLimit - budgetSpent)} remains. Consider slowing down discretionary purchases.`,
        severity: 'review',
        priority: 80,
        actionLabel: 'View Allocations',
        actionPath: '/planning'
      })
    }
  }

  // 4. Goals Pace
  const behindGoalsCount = goals.filter((g) => goalPaceMap[g.id] === 'behind').length
  if (behindGoalsCount > 0) {
    insights.push({
      id: 'insight-goals-behind',
      type: 'goal_behind',
      title: 'Goals Behind Pace',
      statement: `You are behind pace on ${behindGoalsCount} active goal${behindGoalsCount > 1 ? 's' : ''}.`,
      explanation: 'Insufficient periodic contributions. Open goals details to calculate monthly recovery plans.',
      severity: 'review',
      priority: 75,
      actionLabel: 'Manage Goals',
      actionPath: '/goals'
    })
  }

  // 5. Volatility Spikes
  if (spike) {
    insights.push({
      id: 'insight-spending-spike',
      type: 'spending_spike',
      title: 'Spending Volatility Spike',
      statement: `Spike of ${formatCurrency(spike.amount)} detected on ${spike.spikeDate}.`,
      explanation: `Outlays on this single day represented ${spike.ratio}x your average daily outlays for this period.`,
      severity: 'review',
      priority: 70,
      actionLabel: 'Inspect Day',
      actionPath: `/transactions?date=${spike.spikeDate}`
    })
  }

  // 6. Savings Rate Warning
  if (savingsRate < 10 && savings >= 0 && income > 0) {
    insights.push({
      id: 'insight-savings-rate-alert',
      type: 'savings_rate_alert',
      title: 'Low Savings Rate Alert',
      statement: `Your savings rate is only ${savingsRate.toFixed(1)}% for this period.`,
      explanation: 'Ideal ledger targets target saving at least 15-20% of net period income. Identify non-essential spending caps.',
      severity: 'review',
      priority: 65
    })
  }

  // 7. Savings Improvement
  if (prevSavings > 0 && savings > prevSavings) {
    insights.push({
      id: 'insight-savings-improvement',
      type: 'savings_improvement',
      title: 'Savings Improvement',
      statement: `You saved ${formatCurrency(savings - prevSavings)} more than previous period.`,
      explanation: 'Healthy budget performance! Continuing this saving trajectory directly shortens goal timelines.',
      severity: 'positive',
      priority: 60
    })
  }

  // 8. Category Concentration
  if (concentration.topCategoryPercent > 35 && breakdown.length > 0) {
    insights.push({
      id: 'insight-category-concentration',
      type: 'category_concentration',
      title: 'Heavy Spending Concentration',
      statement: `"${breakdown[0].name}" represents ${breakdown[0].percentage.toFixed(0)}% of total outlays.`,
      explanation: `A large share of expenses resides in one category. Ensure this aligns with your structural outlays strategy.`,
      severity: 'neutral',
      priority: 55,
      relatedCategory: breakdown[0].id
    })
  }

  // 9. Recurring Commitments Ratio
  if (recurringRatio > 25) {
    insights.push({
      id: 'insight-recurring-commitments',
      type: 'recurring_commitments',
      title: 'High Recurring Commitments',
      statement: `Confirmed recurring outlays represent ${recurringRatio.toFixed(0)}% of outlays.`,
      explanation: 'A significant portion of your budget is pre-committed to subscription, utilities, or rent structures.',
      severity: 'neutral',
      priority: 50,
      actionLabel: 'Manage Schedules',
      actionPath: '/recurring'
    })
  }

  // 10. Largest Expense Item
  if (breakdown.length > 0) {
    insights.push({
      id: 'insight-largest-expense',
      type: 'largest_expense',
      title: 'Top Expense Category',
      statement: `Your largest outlay category was "${breakdown[0].name}" at ${formatCurrency(breakdown[0].amount)}.`,
      explanation: `Outlays in this category made up the largest share of your spending plan.`,
      severity: 'neutral',
      priority: 40
    })
  }

  // Sort insights by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority)
}
