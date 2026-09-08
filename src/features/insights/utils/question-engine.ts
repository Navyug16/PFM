// Deterministic Question Engine for PFM Insights (M13)
// Architecture: User Query -> Parser -> Intent & Parameters -> Trusted Metric Execution -> QuestionResult -> UI

import type { Transaction, Account, Category } from '@/features/financial/types'
import {
  calculatePeriodIncome,
  calculatePeriodExpenses,
  calculatePeriodSavings,
  calculateSavingsRate,
  calculateAvailableBalance,
  getSingleCurrencyNetPosition,
  calculateCategorySpending,
  identifyLargestExpenseCategory,
  calculatePeriodComparison
} from '@/features/financial/utils/calculations'
import {
  getReportPeriodBounds,
  getReportComparisonBounds
} from '@/features/financial/utils/date-utils'
import type { ReportPeriodPreset } from '@/features/financial/utils/date-utils'
import { formatCurrency, formatPercentage } from '@/features/financial/utils/formatters'

export type QuestionIntent =
  | 'total_income'
  | 'total_expenses'
  | 'period_savings'
  | 'savings_rate'
  | 'available_balance'
  | 'account_balance'
  | 'net_position'
  | 'category_spending'
  | 'largest_spending_category'
  | 'income_vs_expenses'
  | 'period_expense_comparison'
  | 'period_income_comparison'
  | 'savings_comparison'
  | 'transaction_count'

export interface QuestionResult {
  intent: QuestionIntent | 'unsupported'
  status: 'success' | 'unsupported' | 'no_data' | 'clarification_needed'
  metricValue: number | null
  formattedValue: string
  periodLabel: string
  categoryName?: string
  comparisonText?: string
  explanation: string
  unsupportedReason?: string
}

export interface SuggestedQuestion {
  id: string
  text: string
  intent: QuestionIntent
  description: string
}

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'sq-1',
    text: 'How much did I earn this period?',
    intent: 'total_income',
    description: 'Calculates total income credited during the selected period.'
  },
  {
    id: 'sq-2',
    text: 'How much did I spend this period?',
    intent: 'total_expenses',
    description: 'Calculates total expense outlays during the selected period.'
  },
  {
    id: 'sq-3',
    text: 'What is my savings rate?',
    intent: 'savings_rate',
    description: 'Computes the percentage of income retained after expenses.'
  },
  {
    id: 'sq-4',
    text: 'What is my available balance?',
    intent: 'available_balance',
    description: 'Sums current liquid funds across checking, savings, and cash accounts.'
  },
  {
    id: 'sq-5',
    text: 'What was my largest spending category?',
    intent: 'largest_spending_category',
    description: 'Identifies the expense category with the highest outlay total.'
  },
  {
    id: 'sq-6',
    text: 'How do my expenses compare to last period?',
    intent: 'period_expense_comparison',
    description: 'Compares period expense totals and computes absolute & percentage change.'
  },
  {
    id: 'sq-7',
    text: 'What is my net financial position?',
    intent: 'net_position',
    description: 'Shows cumulative net position across all active financial accounts.'
  },
  {
    id: 'sq-8',
    text: 'What is my income vs expenses breakdown?',
    intent: 'income_vs_expenses',
    description: 'Provides side-by-side totals for income, expenses, and net cash flow.'
  }
]

// Period Preset Human Labels Map
const PERIOD_LABELS: Record<ReportPeriodPreset, string> = {
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  this_calendar_year: 'This Calendar Year',
  indian_financial_year: 'Indian Financial Year',
  custom: 'Selected Period'
}

// 1. Period Phrase Resolver
export const resolveQuestionPeriod = (
  query: string,
  fallbackPreset: ReportPeriodPreset
): { preset: ReportPeriodPreset; isExplicit: boolean; isUnsupported: boolean; label: string } => {
  const lower = query.toLowerCase()

  // Detect explicit unsupported/future period terms
  const unsupportedPeriods = ['next month', 'next year', 'tomorrow', 'next week', 'future', '5 years ago', 'in 2030', 'projection']
  if (unsupportedPeriods.some((p) => lower.includes(p))) {
    return { preset: fallbackPreset, isExplicit: true, isUnsupported: true, label: 'Unsupported Period' }
  }

  if (lower.includes('this week') || lower.includes('current week')) {
    return { preset: 'this_week', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.this_week }
  }
  if (lower.includes('last month') || lower.includes('previous month')) {
    return { preset: 'last_month', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.last_month }
  }
  if (lower.includes('this month') || lower.includes('current month')) {
    return { preset: 'this_month', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.this_month }
  }
  if (lower.includes('last 3 months') || lower.includes('past 3 months') || lower.includes('3 months')) {
    return { preset: 'last_3_months', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.last_3_months }
  }
  if (lower.includes('last 6 months') || lower.includes('past 6 months') || lower.includes('6 months')) {
    return { preset: 'last_6_months', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.last_6_months }
  }
  if (lower.includes('financial year') || lower.includes('fiscal year') || lower.includes('fy')) {
    return { preset: 'indian_financial_year', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.indian_financial_year }
  }
  if (lower.includes('this year') || lower.includes('calendar year') || lower.includes('this calendar year')) {
    return { preset: 'this_calendar_year', isExplicit: true, isUnsupported: false, label: PERIOD_LABELS.this_calendar_year }
  }

  // Fallback to active Insights period
  return { preset: fallbackPreset, isExplicit: false, isUnsupported: false, label: PERIOD_LABELS[fallbackPreset] || 'Selected Period' }
}

// 2. Category Matcher
export const matchCategoryFromQuery = (
  query: string,
  categories: Category[]
): Category | null => {
  if (!categories || categories.length === 0) return null

  const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

  let bestMatch: Category | null = null
  let maxMatchLength = 0

  for (const cat of categories) {
    const catNameNorm = cat.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
    
    // Check if query contains the category name or exact match
    if (normalizedQuery === catNameNorm || normalizedQuery.includes(catNameNorm)) {
      if (catNameNorm.length > maxMatchLength) {
        maxMatchLength = catNameNorm.length
        bestMatch = cat
      }
    }
  }

  return bestMatch
}

// 3. Question Intent Recognizer & Parser
export interface ParsedQuestion {
  intent: QuestionIntent | 'unsupported'
  matchedCategory: Category | null
  periodPreset: ReportPeriodPreset
  periodLabel: string
  unsupportedReason?: string
}

export const parseQuestion = (
  query: string,
  categories: Category[],
  fallbackPreset: ReportPeriodPreset
): ParsedQuestion => {
  const lower = query.toLowerCase().trim()

  // Flag predictive / LLM / investment advice queries as unsupported
  const predictiveTerms = [
    'predict',
    'future',
    'should i buy',
    'should i spend',
    'how to invest',
    'tax advice',
    'tax optimization',
    'ai recommendations',
    'forecast',
    'stock market'
  ]
  if (predictiveTerms.some((term) => lower.includes(term))) {
    return {
      intent: 'unsupported',
      matchedCategory: null,
      periodPreset: fallbackPreset,
      periodLabel: PERIOD_LABELS[fallbackPreset],
      unsupportedReason: 'PFM M13 uses deterministic financial calculations. Future predictions and investment advice require AI modules (deferred to M15).'
    }
  }

  // Resolve period phrase
  const periodRes = resolveQuestionPeriod(lower, fallbackPreset)
  if (periodRes.isUnsupported) {
    return {
      intent: 'unsupported',
      matchedCategory: null,
      periodPreset: fallbackPreset,
      periodLabel: 'Unsupported Period',
      unsupportedReason: 'Questions for future or unsupported date ranges cannot be answered deterministically.'
    }
  }

  // Check Category match
  const matchedCategory = matchCategoryFromQuery(lower, categories)

  // Intent pattern matching (explicit rules)

  // A. Category Spending
  if (
    matchedCategory &&
    (lower.includes('spend') ||
      lower.includes('spent') ||
      lower.includes('expense') ||
      lower.includes('outlay') ||
      lower.includes('how much') ||
      lower.includes('cost'))
  ) {
    return {
      intent: 'category_spending',
      matchedCategory,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // B. Largest Category
  if (
    lower.includes('largest category') ||
    lower.includes('top category') ||
    lower.includes('highest spending category') ||
    lower.includes('biggest expense category') ||
    lower.includes('largest spending category') ||
    lower.includes('where did most') ||
    lower.includes('most money go')
  ) {
    return {
      intent: 'largest_spending_category',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // C. Available Balance
  if (
    lower.includes('available balance') ||
    lower.includes('liquid balance') ||
    lower.includes('liquid cash') ||
    lower.includes('how much available') ||
    lower.includes('available money')
  ) {
    return {
      intent: 'available_balance',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // D. Net Position / Total Account Balance
  if (
    lower.includes('net position') ||
    lower.includes('net worth') ||
    lower.includes('total balance') ||
    lower.includes('net financial position') ||
    lower.includes('overall balance')
  ) {
    return {
      intent: 'net_position',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  if (
    lower.includes('account balance') ||
    lower.includes('bank balance') ||
    lower.includes('balance across accounts')
  ) {
    return {
      intent: 'account_balance',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // E. Savings Rate
  if (
    lower.includes('savings rate') ||
    lower.includes('savings percentage') ||
    lower.includes('saving rate') ||
    lower.includes('percent saved') ||
    lower.includes('percentage saved')
  ) {
    return {
      intent: 'savings_rate',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // F. Income vs Expenses / Breakdown
  if (
    lower.includes('income vs expense') ||
    lower.includes('income versus expense') ||
    lower.includes('income vs spending') ||
    lower.includes('cash flow summary') ||
    lower.includes('breakdown of income')
  ) {
    return {
      intent: 'income_vs_expenses',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // G. Comparisons
  if (
    lower.includes('expense comparison') ||
    lower.includes('expenses compare') ||
    lower.includes('spending compared') ||
    lower.includes('spending change') ||
    lower.includes('expenses vs last') ||
    lower.includes('spending vs last') ||
    lower.includes('how did spending change')
  ) {
    return {
      intent: 'period_expense_comparison',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  if (
    lower.includes('income comparison') ||
    lower.includes('income compare') ||
    lower.includes('income compared') ||
    lower.includes('income change') ||
    lower.includes('income vs last') ||
    lower.includes('how did income change')
  ) {
    return {
      intent: 'period_income_comparison',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  if (
    lower.includes('savings comparison') ||
    lower.includes('savings compare') ||
    lower.includes('savings compared') ||
    lower.includes('savings change') ||
    lower.includes('savings vs last') ||
    lower.includes('how did savings change')
  ) {
    return {
      intent: 'savings_comparison',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // H. Savings Total
  if (
    lower.includes('how much did i save') ||
    lower.includes('total savings') ||
    lower.includes('savings this') ||
    lower.includes('period savings') ||
    lower.includes('net savings')
  ) {
    return {
      intent: 'period_savings',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // I. Total Income
  if (
    lower.includes('total income') ||
    lower.includes('how much did i earn') ||
    lower.includes('how much income') ||
    lower.includes('total earnings') ||
    lower.includes('income this') ||
    lower.includes('income in')
  ) {
    return {
      intent: 'total_income',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // J. Total Expenses
  if (
    lower.includes('total expenses') ||
    lower.includes('total spend') ||
    lower.includes('how much did i spend') ||
    lower.includes('total outlays') ||
    lower.includes('expenses this') ||
    lower.includes('spending this')
  ) {
    return {
      intent: 'total_expenses',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // K. Transaction Count
  if (
    lower.includes('how many transactions') ||
    lower.includes('transaction count') ||
    lower.includes('total transactions') ||
    lower.includes('number of transactions') ||
    lower.includes('activity count')
  ) {
    return {
      intent: 'transaction_count',
      matchedCategory: null,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  // Generic fallback checks if matched category is found but action verb was ambiguous
  if (matchedCategory) {
    return {
      intent: 'category_spending',
      matchedCategory,
      periodPreset: periodRes.preset,
      periodLabel: periodRes.label
    }
  }

  return {
    intent: 'unsupported',
    matchedCategory: null,
    periodPreset: fallbackPreset,
    periodLabel: PERIOD_LABELS[fallbackPreset],
    unsupportedReason: 'Query could not be mapped to one of the 14 supported financial intents. Try selecting one of the suggested financial questions.'
  }
}

// 4. Metric Executor (Calls trusted functions from calculations.ts)
export const executeQuestionIntent = (params: {
  intent: QuestionIntent | 'unsupported'
  matchedCategory: Category | null
  periodPreset: ReportPeriodPreset
  periodLabel: string
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  customStart?: string
  customEnd?: string
}): QuestionResult => {
  const {
    intent,
    matchedCategory,
    periodPreset,
    periodLabel,
    transactions,
    accounts,
    categories,
    customStart,
    customEnd
  } = params

  if (intent === 'unsupported') {
    return {
      intent: 'unsupported',
      status: 'unsupported',
      metricValue: null,
      formattedValue: 'Unsupported Question',
      periodLabel,
      explanation:
        'This question requires capabilities outside M13 deterministic scope. Supported questions cover period totals, savings rates, category spending, balances, and period comparisons.'
    }
  }

  const today = new Date()
  const { start, end } = getReportPeriodBounds(periodPreset, today, customStart, customEnd)
  const { start: prevStart, end: prevEnd } = getReportComparisonBounds(periodPreset, start, end)

  switch (intent) {
    case 'total_income': {
      const income = calculatePeriodIncome(transactions, start, end)
      return {
        intent,
        status: 'success',
        metricValue: income,
        formattedValue: formatCurrency(income),
        periodLabel,
        explanation: `Your total income earned during ${periodLabel} was ${formatCurrency(income)}.`
      }
    }

    case 'total_expenses': {
      const expenses = calculatePeriodExpenses(transactions, start, end)
      return {
        intent,
        status: 'success',
        metricValue: expenses,
        formattedValue: formatCurrency(expenses),
        periodLabel,
        explanation: `Your total expenses during ${periodLabel} were ${formatCurrency(expenses)}.`
      }
    }

    case 'period_savings': {
      const savings = calculatePeriodSavings(transactions, start, end)
      const isDeficit = savings < 0
      return {
        intent,
        status: 'success',
        metricValue: savings,
        formattedValue: formatCurrency(savings),
        periodLabel,
        explanation: isDeficit
          ? `Expenses exceeded income by ${formatCurrency(Math.abs(savings))} during ${periodLabel}.`
          : `You saved a total of ${formatCurrency(savings)} during ${periodLabel}.`
      }
    }

    case 'savings_rate': {
      const income = calculatePeriodIncome(transactions, start, end)
      const expenses = calculatePeriodExpenses(transactions, start, end)
      const rate = calculateSavingsRate(income, expenses)
      return {
        intent,
        status: 'success',
        metricValue: rate,
        formattedValue: formatPercentage(rate),
        periodLabel,
        explanation:
          income > 0
            ? `Your savings rate for ${periodLabel} was ${rate.toFixed(1)}%.`
            : `Income for ${periodLabel} was ₹0.00, so savings rate is 0.0%.`
      }
    }

    case 'available_balance': {
      const available = calculateAvailableBalance(accounts, transactions)
      return {
        intent,
        status: 'success',
        metricValue: available,
        formattedValue: formatCurrency(available),
        periodLabel: 'Current Balance',
        explanation: `Your available liquid balance across checking, savings, and cash accounts is ${formatCurrency(available)}.`
      }
    }

    case 'account_balance':
    case 'net_position': {
      let net: number
      try {
        net = getSingleCurrencyNetPosition(accounts, transactions)
      } catch {
        net = accounts.reduce((acc, a) => acc + a.opening_balance, 0)
      }
      return {
        intent,
        status: 'success',
        metricValue: net,
        formattedValue: formatCurrency(net),
        periodLabel: 'Current Position',
        explanation: `Your net financial position across all active accounts is ${formatCurrency(net)}.`
      }
    }

    case 'category_spending': {
      if (!matchedCategory) {
        return {
          intent,
          status: 'clarification_needed',
          metricValue: null,
          formattedValue: 'Category Not Specified',
          periodLabel,
          explanation: 'Please specify a valid category name (e.g. Food & Dining, Utilities, Shopping) to view category spending.'
        }
      }
      const spendingMap = calculateCategorySpending(transactions, start, end)
      const amount = spendingMap[matchedCategory.id] || 0
      return {
        intent,
        status: 'success',
        metricValue: amount,
        formattedValue: formatCurrency(amount),
        periodLabel,
        categoryName: matchedCategory.name,
        explanation: `You spent ${formatCurrency(amount)} on ${matchedCategory.name} during ${periodLabel}.`
      }
    }

    case 'largest_spending_category': {
      const { category, amount } = identifyLargestExpenseCategory(transactions, categories, start, end)
      if (!category || amount === 0) {
        return {
          intent,
          status: 'no_data',
          metricValue: 0,
          formattedValue: '₹0.00',
          periodLabel,
          explanation: `No category expenses were recorded during ${periodLabel}.`
        }
      }
      return {
        intent,
        status: 'success',
        metricValue: amount,
        formattedValue: formatCurrency(amount),
        periodLabel,
        categoryName: category.name,
        explanation: `Your largest spending category during ${periodLabel} was "${category.name}" at ${formatCurrency(amount)}.`
      }
    }

    case 'income_vs_expenses': {
      const income = calculatePeriodIncome(transactions, start, end)
      const expenses = calculatePeriodExpenses(transactions, start, end)
      const savings = calculatePeriodSavings(transactions, start, end)
      return {
        intent,
        status: 'success',
        metricValue: savings,
        formattedValue: `Net: ${formatCurrency(savings)}`,
        periodLabel,
        explanation: `During ${periodLabel}: Income was ${formatCurrency(income)}, Expenses were ${formatCurrency(expenses)}, resulting in a net cash flow of ${formatCurrency(savings)}.`
      }
    }

    case 'period_expense_comparison': {
      const current = calculatePeriodExpenses(transactions, start, end)
      const previous = calculatePeriodExpenses(transactions, prevStart, prevEnd)
      const comp = calculatePeriodComparison(current, previous, true)

      if (!comp.percentChangeAvailable) {
        return {
          intent,
          status: 'success',
          metricValue: current,
          formattedValue: formatCurrency(current),
          periodLabel,
          comparisonText: 'Baseline Unavailable',
          explanation: `Expenses during ${periodLabel} were ${formatCurrency(current)}. Comparison period expenses were ₹0.00, so percentage growth is mathematically unavailable.`
        }
      }

      const diffFormatted = formatCurrency(Math.abs(comp.absoluteChange))
      const directionText = comp.direction === 'up' ? 'increased' : comp.direction === 'down' ? 'decreased' : 'remained unchanged'
      return {
        intent,
        status: 'success',
        metricValue: current,
        formattedValue: formatCurrency(current),
        periodLabel,
        comparisonText: `${comp.direction === 'up' ? '+' : comp.direction === 'down' ? '-' : ''}${comp.percentageChange.toFixed(1)}%`,
        explanation: `Expenses ${directionText} by ${diffFormatted} (${comp.percentageChange.toFixed(1)}%) compared to the previous period (${formatCurrency(previous)}).`
      }
    }

    case 'period_income_comparison': {
      const current = calculatePeriodIncome(transactions, start, end)
      const previous = calculatePeriodIncome(transactions, prevStart, prevEnd)
      const comp = calculatePeriodComparison(current, previous, true)

      if (!comp.percentChangeAvailable) {
        return {
          intent,
          status: 'success',
          metricValue: current,
          formattedValue: formatCurrency(current),
          periodLabel,
          comparisonText: 'Baseline Unavailable',
          explanation: `Income during ${periodLabel} was ${formatCurrency(current)}. Comparison period income was ₹0.00, so percentage growth is mathematically unavailable.`
        }
      }

      const diffFormatted = formatCurrency(Math.abs(comp.absoluteChange))
      const directionText = comp.direction === 'up' ? 'increased' : comp.direction === 'down' ? 'decreased' : 'remained unchanged'
      return {
        intent,
        status: 'success',
        metricValue: current,
        formattedValue: formatCurrency(current),
        periodLabel,
        comparisonText: `${comp.direction === 'up' ? '+' : comp.direction === 'down' ? '-' : ''}${comp.percentageChange.toFixed(1)}%`,
        explanation: `Income ${directionText} by ${diffFormatted} (${comp.percentageChange.toFixed(1)}%) compared to the previous period (${formatCurrency(previous)}).`
      }
    }

    case 'savings_comparison': {
      const current = calculatePeriodSavings(transactions, start, end)
      const previous = calculatePeriodSavings(transactions, prevStart, prevEnd)
      const diff = current - previous
      const diffFormatted = formatCurrency(Math.abs(diff))

      let explanation: string
      if (diff > 0) {
        explanation = `You saved ${diffFormatted} more during ${periodLabel} compared to the previous period (${formatCurrency(previous)}).`
      } else if (diff < 0) {
        explanation = `You saved ${diffFormatted} less during ${periodLabel} compared to the previous period (${formatCurrency(previous)}).`
      } else {
        explanation = `Savings remained unchanged at ${formatCurrency(current)} compared to the previous period.`
      }

      return {
        intent,
        status: 'success',
        metricValue: current,
        formattedValue: formatCurrency(current),
        periodLabel,
        comparisonText: diff >= 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`,
        explanation
      }
    }

    case 'transaction_count': {
      const currentPeriodTxs = transactions.filter(
        (tx) => tx.transaction_date >= start && tx.transaction_date <= end
      )
      const count = currentPeriodTxs.length
      return {
        intent,
        status: 'success',
        metricValue: count,
        formattedValue: `${count} transactions`,
        periodLabel,
        explanation: `A total of ${count} transaction records were logged during ${periodLabel}.`
      }
    }

    default: {
      return {
        intent: 'unsupported',
        status: 'unsupported',
        metricValue: null,
        formattedValue: 'Unsupported',
        periodLabel,
        explanation: 'Intent not recognized.'
      }
    }
  }
}
