import React, { useState } from 'react'
import { useAuth } from '@/features/auth/auth-provider'
import { validateNewPassword } from '../utils/settings-validation'
import { KeyRound, ShieldAlert } from 'lucide-react'

export const SecuritySettings: React.FC = () => {
  const { user, updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const email = user?.email || 'user@example.com'
  const authProvider = user?.app_metadata?.provider || 'email'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    setError(null)

    // Password validations
    const passwordError = validateNewPassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: apiErr } = await updatePassword(password)
      if (apiErr) {
        throw apiErr
      }
      setSuccess('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-primary">Security & Credentials</h3>
        <p className="text-xs text-text-secondary mt-1">
          Harden your account credentials and inspect active session parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Change Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-neutral/30 pb-2">
            Change Password
          </h4>

          {error && (
            <div className="p-3 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md text-xs font-medium flex gap-2">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-state-positive/10 border border-state-positive/20 text-state-positive rounded-custom-md text-xs font-medium">
              {success}
            </div>
          )}

          {/* New Password Input */}
          <div>
            <label htmlFor="new-pw" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
              New Password
            </label>
            <div className="relative flex items-center">
              <KeyRound size={16} className="absolute left-3.5 text-text-muted" />
              <input
                id="new-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md pl-10 pr-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
                placeholder="••••••••"
              />
            </div>
            <p className="text-[10px] text-text-secondary mt-1.5 leading-normal">
              Requirements: At least 8 characters, with uppercase, lowercase, numbers, and special characters.
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirm-pw" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <KeyRound size={16} className="absolute left-3.5 text-text-muted" />
              <input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md pl-10 pr-4 py-2.5 text-text-primary text-sm outline-none focus:border-brand-purple transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        {/* Session / Context Meta Info */}
        <div className="bg-surface-secondary/50 border border-border-neutral/60 rounded-custom-lg p-5 space-y-4 font-medium text-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border-neutral/30 pb-2">
            Active Session Diagnostics
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between py-1.5 border-b border-border-neutral/20">
              <span className="text-text-secondary">Identity Account:</span>
              <span className="text-text-primary font-semibold">{email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-neutral/20">
              <span className="text-text-secondary">Auth Provider:</span>
              <span className="text-text-primary uppercase">{authProvider}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border-neutral/20">
              <span className="text-text-secondary">Session Status:</span>
              <span className="px-2 py-0.5 bg-state-positive/10 text-state-positive border border-state-positive/20 rounded-full text-[9px] font-bold">
                SIGNED_IN
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-text-secondary">Session Multi-Factor:</span>
              <span className="text-text-muted">Not Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
