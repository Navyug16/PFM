import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth-provider'
import { getFriendlyAuthError } from '../auth-errors'

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!navigator.onLine) {
      setError('Unable to connect. Check your internet connection and try again.')
      return
    }

    if (!email) {
      setEmailError('Email is required.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError(null)

    setLoading(true)
    try {
      const { error: resetError } = await requestPasswordReset(email)

      if (resetError) {
        setError(getFriendlyAuthError(resetError))
      } else {
        // Privacy-first message: don't reveal if account exists
        setSuccess(true)
      }
    } catch (err: unknown) {
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
        <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated text-center">
          <div className="p-4 bg-brand-purple/10 text-brand-purple rounded-full w-fit mx-auto mb-6">
            <Mail size={36} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Check your email</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            If an account is registered with <span className="text-text-primary font-medium">{email}</span>,
            we have sent a password reset link to your inbox.
          </p>
          <Link
            to="/login"
            className="w-full py-2.5 bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-border-neutral hover:border-text-muted text-sm font-medium rounded-custom-md transition-all duration-200 block text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Reset password</h2>
          <p className="text-text-secondary text-sm mt-2 text-center">
            Enter your email and we'll send you a password recovery link
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleResetRequest} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              placeholder="name@example.com"
              disabled={loading}
              className={`w-full bg-surface-secondary border rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none transition-all duration-200 ${
                emailError
                  ? 'border-state-expense focus:border-state-expense'
                  : 'border-border-neutral focus:border-brand-purple'
              }`}
            />
            {emailError && (
              <p className="text-state-expense text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {emailError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-brand-purple/40 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 mt-2 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <Link
            to="/login"
            className="text-brand-purple hover:text-brand-purple/80 font-medium transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
