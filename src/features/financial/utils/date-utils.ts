// Financial Date Boundary Utilities (Standard calendar and Indian FY April 1 - March 31)

// Formats a Date object to YYYY-MM-DD
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Determines the Indian Financial Year start and end dates for a given date
export const getIndianFinancialYear = (referenceDate: Date = new Date()): { start: string; end: string } => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() // 0-indexed: 0 = Jan, 11 = Dec, 2 = March, 3 = April

  let startYear = year
  if (month < 3) {
    // Before April, the financial year started in the previous calendar year
    startYear = year - 1
  }

  const startDate = new Date(startYear, 3, 1) // April 1
  const endDate = new Date(startYear + 1, 2, 31) // March 31

  return {
    start: formatDateString(startDate),
    end: formatDateString(endDate),
  }
}

// Gets first and last day of a specific month
export const getMonthBounds = (year: number, month: number): { start: string; end: string } => {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0) // Day 0 is last day of previous month
  return {
    start: formatDateString(start),
    end: formatDateString(end),
  }
}

// Gets boundaries for the current week (assumes Monday to Sunday)
export const getWeekBounds = (referenceDate: Date = new Date()): { start: string; end: string } => {
  const currentDay = referenceDate.getDay() // 0 = Sunday, 1 = Monday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay

  const monday = new Date(referenceDate)
  monday.setDate(referenceDate.getDate() + distanceToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: formatDateString(monday),
    end: formatDateString(sunday),
  }
}

// Calculates remaining calendar months between two dates (rounds up)
export const getRemainingMonths = (
  startDate: string | Date,
  targetDate: string | Date
): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate

  if (target < start) return 0

  const yearsDiff = target.getFullYear() - start.getFullYear()
  const monthsDiff = target.getMonth() - start.getMonth()
  
  const totalMonths = yearsDiff * 12 + monthsDiff

  // If there are remaining days in the month, count it as a partial month (round up to 1)
  const daysDiff = target.getDate() - start.getDate()
  return totalMonths + (daysDiff > 0 ? 1 : 0) || 1 // Return at least 1 if we're in the same month to avoid zero division
}

// Calculates remaining calendar weeks between two dates (rounds up)
export const getRemainingWeeks = (
  startDate: string | Date,
  targetDate: string | Date
): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate

  if (target < start) return 0

  const oneDay = 24 * 60 * 60 * 1000
  const diffDays = Math.ceil((target.getTime() - start.getTime()) / oneDay)

  const weeks = Math.ceil(diffDays / 7)
  return weeks || 1 // Return at least 1 to prevent division by zero
}

// Subtracts months safely without rolling over to next month if days mismatch (e.g., March 31 -> Feb 28)
const subtractMonthsSafely = (date: Date, months: number): Date => {
  const result = new Date(date)
  const day = result.getDate()
  result.setMonth(result.getMonth() - months)
  if (result.getDate() !== day) {
    result.setDate(0) // Adjust to last day of the intended month
  }
  return result
}

// Determines the start and end dates for a supported period option
export const getPeriodBounds = (
  periodType: 'week' | 'month' | 'last_month' | 'financial_year',
  referenceDate: Date = new Date()
): { start: string; end: string } => {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  switch (periodType) {
    case 'week':
      return getWeekBounds(referenceDate)
    case 'month':
      return getMonthBounds(year, month)
    case 'last_month': {
      const prevDate = subtractMonthsSafely(referenceDate, 1)
      return getMonthBounds(prevDate.getFullYear(), prevDate.getMonth())
    }
    case 'financial_year':
      return getIndianFinancialYear(referenceDate)
    default:
      return getMonthBounds(year, month)
  }
}

// Calculates equivalent previous elapsed period bounds
export const getEquivalentPreviousPeriod = (
  startDate: string,
  endDate: string,
  periodType: 'week' | 'month' | 'last_month' | 'financial_year'
): { start: string; end: string } => {
  const dStart = new Date(startDate)
  const dEnd = new Date(endDate)

  switch (periodType) {
    case 'week': {
      dStart.setDate(dStart.getDate() - 7)
      dEnd.setDate(dEnd.getDate() - 7)
      return { start: formatDateString(dStart), end: formatDateString(dEnd) }
    }
    case 'month':
    case 'last_month': {
      const prevStart = subtractMonthsSafely(dStart, 1)
      const prevEnd = subtractMonthsSafely(dEnd, 1)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    case 'financial_year': {
      dStart.setFullYear(dStart.getFullYear() - 1)
      dEnd.setFullYear(dEnd.getFullYear() - 1)
      return { start: formatDateString(dStart), end: formatDateString(dEnd) }
    }
    default:
      return { start: startDate, end: endDate }
  }
}

export type ReportPeriodPreset =
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_calendar_year'
  | 'indian_financial_year'
  | 'custom'

export const getReportPeriodBounds = (
  preset: ReportPeriodPreset,
  referenceDate: Date = new Date(),
  customStart?: string,
  customEnd?: string
): { start: string; end: string } => {
  const d = new Date(referenceDate)
  const year = d.getFullYear()
  const month = d.getMonth()

  switch (preset) {
    case 'this_week':
      return {
        start: getWeekBounds(d).start,
        end: formatDateString(d),
      }
    case 'this_month':
      return {
        start: formatDateString(new Date(year, month, 1)),
        end: formatDateString(d),
      }
    case 'last_month': {
      const prevDate = subtractMonthsSafely(d, 1)
      return getMonthBounds(prevDate.getFullYear(), prevDate.getMonth())
    }
    case 'last_3_months': {
      const start = new Date(year, month - 3, 1)
      const end = new Date(year, month, 0)
      return {
        start: formatDateString(start),
        end: formatDateString(end),
      }
    }
    case 'last_6_months': {
      const start = new Date(year, month - 6, 1)
      const end = new Date(year, month, 0)
      return {
        start: formatDateString(start),
        end: formatDateString(end),
      }
    }
    case 'this_calendar_year':
      return {
        start: formatDateString(new Date(year, 0, 1)),
        end: formatDateString(d),
      }
    case 'indian_financial_year': {
      const { start } = getIndianFinancialYear(d)
      return {
        start,
        end: formatDateString(d),
      }
    }
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date bounds require both start and end dates.')
      }
      return {
        start: customStart,
        end: customEnd,
      }
    default:
      return {
        start: formatDateString(new Date(year, month, 1)),
        end: formatDateString(d),
      }
  }
}

export const getReportComparisonBounds = (
  preset: ReportPeriodPreset,
  start: string,
  end: string
): { start: string; end: string } => {
  const dStart = new Date(start)
  const dEnd = new Date(end)

  switch (preset) {
    case 'this_week': {
      dStart.setDate(dStart.getDate() - 7)
      dEnd.setDate(dEnd.getDate() - 7)
      return { start: formatDateString(dStart), end: formatDateString(dEnd) }
    }
    case 'this_month': {
      const prevStart = subtractMonthsSafely(dStart, 1)
      const prevEnd = subtractMonthsSafely(dEnd, 1)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    case 'last_month': {
      const prevStart = subtractMonthsSafely(dStart, 1)
      const prevEnd = subtractMonthsSafely(dEnd, 1)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    case 'last_3_months': {
      const prevStart = subtractMonthsSafely(dStart, 3)
      const prevEnd = subtractMonthsSafely(dEnd, 3)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    case 'last_6_months': {
      const prevStart = subtractMonthsSafely(dStart, 6)
      const prevEnd = subtractMonthsSafely(dEnd, 6)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    case 'this_calendar_year': {
      dStart.setFullYear(dStart.getFullYear() - 1)
      dEnd.setFullYear(dEnd.getFullYear() - 1)
      return { start: formatDateString(dStart), end: formatDateString(dEnd) }
    }
    case 'indian_financial_year': {
      dStart.setFullYear(dStart.getFullYear() - 1)
      dEnd.setFullYear(dEnd.getFullYear() - 1)
      return { start: formatDateString(dStart), end: formatDateString(dEnd) }
    }
    case 'custom': {
      const diffTime = Math.abs(dEnd.getTime() - dStart.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      const prevStart = new Date(dStart)
      prevStart.setDate(prevStart.getDate() - diffDays)
      const prevEnd = new Date(dEnd)
      prevEnd.setDate(prevEnd.getDate() - diffDays)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
    default: {
      const prevStart = subtractMonthsSafely(dStart, 1)
      const prevEnd = subtractMonthsSafely(dEnd, 1)
      return { start: formatDateString(prevStart), end: formatDateString(prevEnd) }
    }
  }
}

