import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth-provider'
import { getFriendlyAuthError } from '../auth-errors'

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    let isValid = true

    // Email Check
    if (!email) {
      setEmailError('Email is required.')
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.')
      isValid = false
    } else {
      setEmailError(null)
    }

    // Password Check
    if (!password) {
      setPasswordError('Password is required.')
      isValid = false
    } else {
      setPasswordError(null)
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!navigator.onLine) {
      setError('Unable to connect. Check your internet connection and try again.')
      return
    }

    if (!validateForm()) return

    setLoading(true)
    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) {
        console.error('Login error response:', signInError)
        setError(getFriendlyAuthError(signInError))
      } else {
        navigate('/overview')
      }
    } catch (err: unknown) {
      console.error('Login caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
      <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h2>
          <p className="text-text-secondary text-sm mt-2">Sign in to your PFM account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-text-secondary text-xs font-semibold uppercase tracking-wider"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-brand-purple hover:text-brand-purple/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:bg-brand-purple/40 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 mt-2 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-secondary">Don't have an account? </span>
          <Link
            to="/signup"
            className="text-brand-purple hover:text-brand-purple/80 font-medium transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
