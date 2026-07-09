import { useState, useEffect, useCallback } from 'react'
import {
  listRecurringRules,
  createRecurringRule,
  updateRecurringRule,
  pauseRecurringRule,
  resumeRecurringRule,
  archiveRecurringRule,
  deleteRecurringRule,
  generateOccurrences,
  confirmOccurrence,
  skipOccurrence,
  listOccurrences,
  listDuplicateDismissals,
  dismissDuplicatePair
} from '../api/recurring-api'
import { calculateNextOccurrenceDate } from '../utils/recurrence-math'
import type { RecurringRule, RecurringOccurrence, DuplicateDismissal } from '../types/recurring'
import type { Transaction } from '@/features/financial/types'

export const useRecurringData = () => {
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [occurrences, setOccurrences] = useState<RecurringOccurrence[]>([])
  const [dismissedPairs, setDismissedPairs] = useState<DuplicateDismissal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const horizonDateObj = new Date()
      horizonDateObj.setDate(horizonDateObj.getDate() + 30)
      const horizonStr = horizonDateObj.toISOString().split('T')[0]

      // 1. Trigger database lazy occurrence generation up to horizon (Today + 30 days)
      await generateOccurrences(horizonStr)

      // 2. Fetch fresh rule, occurrence, and dismissal datasets
      const [rulesList, occurrencesList, dismissalsList] = await Promise.all([
        listRecurringRules(),
        listOccurrences(),
        listDuplicateDismissals()
      ])

      setRules(rulesList)
      setOccurrences(occurrencesList)
      setDismissedPairs(dismissalsList)
    } catch (err: unknown) {
      console.error('Error fetching recurring data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch recurring details.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchAll])

  const handleCreateRule = async (ruleData: Omit<RecurringRule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_active' | 'archived_at' | 'next_due_date'>) => {
    await createRecurringRule(ruleData)
    await fetchAll()
  }

  const handleEditRule = async (id: string, updates: Partial<Omit<RecurringRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    await updateRecurringRule(id, updates)
    await fetchAll()
  }

  const handlePauseRule = async (id: string) => {
    await pauseRecurringRule(id)
    await fetchAll()
  }

  const handleResumeRule = async (id: string, rule: RecurringRule) => {
    const todayStr = new Date().toISOString().split('T')[0]
    let nextDate = rule.next_due_date
    while (nextDate < todayStr) {
      nextDate = calculateNextOccurrenceDate(rule.start_date, rule.frequency, nextDate)
    }
    await resumeRecurringRule(id, nextDate)
    await fetchAll()
  }

  const handleArchiveRule = async (id: string) => {
    await archiveRecurringRule(id)
    await fetchAll()
  }

  const handleDeleteRule = async (id: string) => {
    await deleteRecurringRule(id)
    await fetchAll()
  }

  const handleConfirmOccurrence = async (occurrenceId: string): Promise<Transaction> => {
    const tx = await confirmOccurrence(occurrenceId)
    await fetchAll()
    return tx
  }

  const handleSkipOccurrence = async (occurrenceId: string) => {
    await skipOccurrence(occurrenceId)
    await fetchAll()
  }

  const handleDismissDuplicate = async (tx1Id: string, tx2Id: string) => {
    await dismissDuplicatePair(tx1Id, tx2Id)
    await fetchAll()
  }

  return {
    rules,
    occurrences,
    dismissedPairs,
    loading,
    error,
    refetch: fetchAll,
    createRule: handleCreateRule,
    editRule: handleEditRule,
    pauseRule: handlePauseRule,
    resumeRule: handleResumeRule,
    archiveRule: handleArchiveRule,
    deleteRule: handleDeleteRule,
    confirmOccurrence: handleConfirmOccurrence,
    skipOccurrence: handleSkipOccurrence,
    dismissDuplicate: handleDismissDuplicate
  }
}
