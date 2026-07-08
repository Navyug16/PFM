import type { Transaction, Goal, GoalContribution, Category } from '../../financial/types'
import type { FinancialInsight } from '../types'
import { formatCurrency } from '../../financial/utils/formatters'
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  calculateGoalSavedAmount,
  calculateGoalRemaining,
  calculateGoalProgressPercentage,
  calculateGoalPaceStatus,
  calculateRequiredMonthlySavings,
  calculatePeriodComparison,
  identifyLargestExpenseCategory
} from '../../financial/utils/calculations'

export const generateInsights = (
  transactions: Transaction[],
  categories: Category[],
  goals: Goal[],
  contributions: { [goalId: string]: GoalContribution[] },
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  todayString: string
): FinancialInsight[] => {
  const insights: FinancialInsight[] = []

  // Current Metrics
  const income = calculatePeriodIncome(transactions, startDate, endDate)
  const expenses = calculatePeriodExpenses(transactions, startDate, endDate)
  const savings = calculatePeriodSavings(transactions, startDate, endDate)
  const savingsRate = calculateSavingsRate(income, expenses)

  // Previous Metrics
  const prevExpenses = calculatePeriodExpenses(transactions, prevStartDate, prevEndDate)

  // Format Helpers

  // 1. Deficit Alert (A)
  if (savings < 0) {
    insights.push({
      id: 'insight-deficit',
      question: 'How much did I save this period?',
      answer: `**Deficit of ${formatCurrency(Math.abs(savings))}**. Your expenses exceeded your income this period.`,
      supportingValue: 'Budget deficit',
      direction: 'negative',
      priority: 6, // Highest priority
      actionLabel: 'Review Transactions',
      actionPath: '/transactions'
    })
  } else {
    insights.push({
      id: 'insight-savings',
      question: 'How much did I save this period?',
      answer: `**Saved ${formatCurrency(savings)}**. Resulted in a ${savingsRate.toFixed(1)}% savings rate.`,
      supportingValue: `${savingsRate.toFixed(0)}% saved`,
      direction: 'positive',
      priority: 2,
      actionLabel: 'View Transactions',
      actionPath: '/transactions'
    })
  }

  // 2. Spending Comparison (C)
  const spendCompare = calculatePeriodComparison(expenses, prevExpenses, true)
  if (spendCompare.comparisonAvailable) {
    const diffText = formatCurrency(Math.abs(spendCompare.absoluteChange))
    if (spendCompare.direction === 'up') {
      const percentageText = spendCompare.percentChangeAvailable ? ` (+${spendCompare.percentageChange.toFixed(0)}%)` : ''
      insights.push({
        id: 'insight-compare-spending',
        question: 'Am I spending more or less than last period?',
        answer: `**Spending is up by ${diffText}**${percentageText} compared to the previous period.`,
        supportingValue: spendCompare.percentChangeAvailable ? `+${spendCompare.percentageChange.toFixed(0)}% spend` : `Up by ${diffText}`,
        direction: 'negative',
        priority: spendCompare.percentageChange > 10 ? 5 : 3,
        actionLabel: 'Analyze Spending',
        actionPath: '/transactions?type=expense'
      })
    } else if (spendCompare.direction === 'down') {
      const percentageText = spendCompare.percentChangeAvailable ? ` (-${spendCompare.percentageChange.toFixed(0)}%)` : ''
      insights.push({
        id: 'insight-compare-spending',
        question: 'Am I spending more or less than last period?',
        answer: `**Spending is down by ${diffText}**${percentageText} compared to the previous period.`,
        supportingValue: spendCompare.percentChangeAvailable ? `-${spendCompare.percentageChange.toFixed(0)}% spend` : `Down by ${diffText}`,
        direction: 'positive',
        priority: 3,
        actionLabel: 'Analyze Spending',
        actionPath: '/transactions?type=expense'
      })
    } else {
      insights.push({
        id: 'insight-compare-spending',
        question: 'Am I spending more or less than last period?',
        answer: `**Spending is unchanged** compared to the previous period.`,
        direction: 'neutral',
        priority: 1,
      })
    }
  }

  // 3. Where Did My Money Go? (Largest Category) (A)
  const largestCat = identifyLargestExpenseCategory(transactions, categories, startDate, endDate)
  if (largestCat.category) {
    const catShare = calculatePeriodExpenses(transactions, startDate, endDate) > 0
      ? (largestCat.amount / calculatePeriodExpenses(transactions, startDate, endDate)) * 100
      : 0
    insights.push({
      id: 'insight-largest-category',
      question: 'Where did most of my money go?',
      answer: `**${largestCat.category.name} was your top category**: total of ${formatCurrency(largestCat.amount)} (${catShare.toFixed(0)}% of expenses).`,
      supportingValue: `${catShare.toFixed(0)}% on ${largestCat.category.name}`,
      direction: 'neutral',
      priority: 4,
      actionLabel: 'Filter Category',
      actionPath: `/transactions?categoryId=${largestCat.category.id}`
    })
  }

  // 4. Biggest Single Expense (B)
  const periodExpensesList = transactions.filter(
    (tx) =>
      tx.transaction_type === 'expense' &&
      (!startDate || tx.transaction_date >= startDate) &&
      (!endDate || tx.transaction_date <= endDate)
  )
  if (periodExpensesList.length > 0) {
    const maxTx = periodExpensesList.reduce((max, tx) => (tx.amount > max.amount ? tx : max), periodExpensesList[0])
    insights.push({
      id: 'insight-biggest-expense',
      question: 'What was my biggest expense?',
      answer: `**${formatCurrency(maxTx.amount)} spent at "${maxTx.payee_or_source || 'Unspecified'}"** on ${maxTx.transaction_date}.`,
      supportingValue: 'Largest expense',
      direction: 'neutral',
      priority: 3,
      actionLabel: 'View Details',
      actionPath: '/transactions'
    })
  }

  // 5. Active Goals Pace (E)
  const activeGoals = goals.filter((g) => g.status === 'active')
  for (const goal of activeGoals) {
    const goalContribs = contributions[goal.id] || []
    const saved = calculateGoalSavedAmount(goalContribs)
    const remaining = calculateGoalRemaining(goal.target_amount, saved)
    const progress = calculateGoalProgressPercentage(goal.target_amount, saved)
    const pace = calculateGoalPaceStatus(goal, saved, todayString)
    const reqMonthly = calculateRequiredMonthlySavings(remaining, goal.target_date, todayString)

    if (pace === 'behind') {
      insights.push({
        id: `insight-goal-behind-${goal.id}`,
        question: `Am I on track for my "${goal.name}" goal?`,
        answer: `**Behind pace for "${goal.name}"**. You need to save ${formatCurrency(reqMonthly)} monthly to meet target.`,
        supportingValue: 'Behind pace',
        direction: 'negative',
        priority: 5,
        actionLabel: 'Manage Goals',
        actionPath: '/goals'
      })
    } else if (pace === 'ahead') {
      insights.push({
        id: `insight-goal-ahead-${goal.id}`,
        question: `Am I on track for my "${goal.name}" goal?`,
        answer: `**Ahead of pace for "${goal.name}"** (${progress.toFixed(0)}% target saved).`,
        supportingValue: 'Ahead of pace',
        direction: 'positive',
        priority: 1,
        actionLabel: 'Manage Goals',
        actionPath: '/goals'
      })
    } else if (pace === 'on_track') {
      insights.push({
        id: `insight-goal-track-${goal.id}`,
        question: `Am I on track for my "${goal.name}" goal?`,
        answer: `**On track for "${goal.name}"** (${progress.toFixed(0)}% target saved).`,
        supportingValue: 'On track',
        direction: 'positive',
        priority: 1,
        actionLabel: 'Manage Goals',
        actionPath: '/goals'
      })
    }
  }

  // Prioritize insights (highest priority score first)
  return insights.sort((a, b) => b.priority - a.priority)
}
