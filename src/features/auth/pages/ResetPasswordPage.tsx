import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth-provider'
import { getFriendlyAuthError } from '../auth-errors'

export const ResetPasswordPage: React.FC = () => {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    let isValid = true

    if (!password) {
      setPasswordError('New password is required.')
      isValid = false
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      isValid = false
    } else {
      setPasswordError(null)
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      isValid = false
    } else {
      setConfirmPasswordError(null)
    }

    return isValid
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!navigator.onLine) {
      setError('Unable to connect. Check your internet connection and try again.')
      return
    }

    if (!validateForm()) return

    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(password)

      if (updateError) {
        console.error('Password update error response:', updateError)
        setError(getFriendlyAuthError(updateError))
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      console.error('Password update caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
        <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated text-center">
          <div className="p-4 bg-state-positive/10 text-state-positive rounded-full w-fit mx-auto mb-6">
            <ShieldCheck size={36} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Password updated</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            Your password has been successfully updated. Your session is now active.
          </p>
          <button
            onClick={() => navigate('/overview')}
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 cursor-pointer text-center block border-none"
          >
            Enter Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create new password</h2>
          <p className="text-text-secondary text-sm mt-2 text-center">
            Set your new credentials to secure your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                placeholder="••••••••"
                disabled={loading}
                className={`w-full bg-surface-secondary border rounded-custom-md pl-4 pr-10 py-2.5 text-text-primary text-sm outline-none transition-all duration-200 ${
                  passwordError
                    ? 'border-state-expense focus:border-state-expense'
                    : 'border-border-neutral focus:border-brand-purple'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-state-expense text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {passwordError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError(null)
                }}
                placeholder="••••••••"
                disabled={loading}
                className={`w-full bg-surface-secondary border rounded-custom-md pl-4 pr-10 py-2.5 text-text-primary text-sm outline-none transition-all duration-200 ${
                  confirmPasswordError
                    ? 'border-state-expense focus:border-state-expense'
                    : 'border-border-neutral focus:border-brand-purple'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-state-expense text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {confirmPasswordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-brand-purple/40 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 mt-4 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
