import type { FrequencyType } from '../types/recurring'

export const clampToLastDayOfMonth = (year: number, month: number, targetDay: number): string => {
  // month is 1-indexed (e.g. 2 = February, last day is obtained by using 0th day of month 3)
  const lastDay = new Date(year, month, 0).getDate()
  const day = targetDay > lastDay ? lastDay : targetDay
  const mStr = String(month).padStart(2, '0')
  const dStr = String(day).padStart(2, '0')
  return `${year}-${mStr}-${dStr}`
}

export const calculateNextOccurrenceDate = (
  startDate: string,
  frequency: FrequencyType,
  currentDate: string
): string => {
  const startParts = startDate.split('-').map(Number)
  const curParts = currentDate.split('-').map(Number)
  
  if (startParts.length < 3 || curParts.length < 3) {
    throw new Error('Invalid date strings passed to calculation')
  }

  const startDay = startParts[2]
  
  if (frequency === 'weekly') {
    const curDateObj = new Date(Date.UTC(curParts[0], curParts[1] - 1, curParts[2]))
    curDateObj.setUTCDate(curDateObj.getUTCDate() + 7)
    return curDateObj.toISOString().split('T')[0]
  }
  
  let nextYear = curParts[0]
  let nextMonth = curParts[1]
  
  if (frequency === 'monthly') {
    nextMonth += 1
  } else if (frequency === 'quarterly') {
    nextMonth += 3
  } else if (frequency === 'yearly') {
    nextMonth += 12
  }
  
  if (nextMonth > 12) {
    const yearsToAdd = Math.floor((nextMonth - 1) / 12)
    nextYear += yearsToAdd
    nextMonth = ((nextMonth - 1) % 12) + 1
  }
  
  return clampToLastDayOfMonth(nextYear, nextMonth, startDay)
}

export const generateOccurrenceDates = (
  startDate: string,
  frequency: FrequencyType,
  startFrom: string,
  horizonDate: string,
  endDate?: string | null
): string[] => {
  const dates: string[] = []
  let current = startFrom
  const maxDate = endDate && endDate < horizonDate ? endDate : horizonDate
  
  while (current <= maxDate) {
    dates.push(current)
    const next = calculateNextOccurrenceDate(startDate, frequency, current)
    if (next <= current) {
      // Safety step to prevent stalling
      const curParts = current.split('-').map(Number)
      const curDateObj = new Date(Date.UTC(curParts[0], curParts[1] - 1, curParts[2]))
      curDateObj.setUTCDate(curDateObj.getUTCDate() + 1)
      current = curDateObj.toISOString().split('T')[0]
    } else {
      current = next
    }
  }
  return dates
}
