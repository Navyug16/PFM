import React, { useState } from 'react'
import { useAuth } from '@/features/auth/auth-provider'
import { useSettings } from '../hooks/useSettings'
import { validateDisplayName } from '../utils/settings-validation'
import { User, Mail, Calendar } from 'lucide-react'

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth()
  const { profile, updateProfile } = useSettings()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const email = user?.email || 'user@example.com'
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(profile?.locale || 'en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    setError(null)

    const validationError = validateDisplayName(displayName)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await updateProfile({ display_name: displayName.trim() })
      setSuccess('Profile updated successfully.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-primary">Profile Information</h3>
        <p className="text-xs text-text-secondary mt-1">
          Manage your personal account profile details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {error && (
          <div className="p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-state-positive/10 border border-state-positive/20 text-state-positive rounded-custom-md text-xs font-medium">
            {success}
          </div>
        )}

        {/* Display Name Input */}
        <div>
          <label htmlFor="display-name" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Display Name
          </label>
          <div className="relative flex items-center">
            <User size={16} className="absolute left-3.5 text-text-muted" />
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md pl-10 pr-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
              placeholder="Enter your name"
            />
          </div>
        </div>

        {/* Read-Only Email Field */}
        <div>
          <label htmlFor="user-email" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
            Email Address (Read-Only)
          </label>
          <div className="relative flex items-center">
            <Mail size={16} className="absolute left-3.5 text-text-muted" />
            <input
              id="user-email"
              type="text"
              value={email}
              readOnly
              className="w-full bg-surface-secondary/50 border border-border-neutral rounded-custom-md pl-10 pr-4 py-2.5 text-text-secondary text-sm outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Creation Date Display */}
        <div className="flex items-center gap-2 text-xs text-text-secondary pt-2">
          <Calendar size={14} className="text-text-muted" />
          <span>Member since {createdAt}</span>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
