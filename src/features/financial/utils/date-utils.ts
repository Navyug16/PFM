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

