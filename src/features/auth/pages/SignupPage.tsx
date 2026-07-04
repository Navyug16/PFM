import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff, AlertCircle, Mail } from 'lucide-react'
import { useAuth } from '../auth-provider'
import { getFriendlyAuthError } from '../auth-errors'

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    let isValid = true

    // Name Check
    if (!name.trim()) {
      setNameError('Name is required.')
      isValid = false
    } else {
      setNameError(null)
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.')
      isValid = false
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter.')
      isValid = false
    } else if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter.')
      isValid = false
    } else if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number.')
      isValid = false
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError('Password must contain at least one special character.')
      isValid = false
    } else {
      setPasswordError(null)
    }

    // Confirm Password Check
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      isValid = false
    } else {
      setConfirmPasswordError(null)
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
      const { error: signUpError, data } = await signUp(email, password, name)

      if (signUpError) {
        console.error('Signup error response:', signUpError)
        setError(getFriendlyAuthError(signUpError))
      } else if (data && !(data as { session?: unknown }).session) {
        // Case B: Email confirmation is enabled in Supabase dashboard
        setNeedsConfirmation(true)
      } else {
        // Case A: Email confirmation is disabled, user is logged in immediately
        navigate('/overview')
      }
    } catch (err: unknown) {
      console.error('Signup caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4 py-12">
        <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated text-center">
          <div className="p-4 bg-brand-purple/10 text-brand-purple rounded-full w-fit mx-auto mb-6">
            <Mail size={36} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Verify your email</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            We have sent a verification link to <span className="text-text-primary font-medium">{email}</span>.
            Please check your inbox and click the link to confirm your account.
          </p>
          <Link
            to="/login"
            className="w-full py-2.5 bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-border-neutral hover:border-text-muted text-sm font-medium rounded-custom-md transition-all duration-200 block"
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
            <UserPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create account</h2>
          <p className="text-text-secondary text-sm mt-2">Get started with your PFM tracking</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(null)
              }}
              placeholder="John Doe"
              disabled={loading}
              className={`w-full bg-surface-secondary border rounded-custom-md px-4 py-2.5 text-text-primary text-sm outline-none transition-all duration-200 ${
                nameError
                  ? 'border-state-expense focus:border-state-expense'
                  : 'border-border-neutral focus:border-brand-purple'
              }`}
            />
            {nameError && (
              <p className="text-state-expense text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} /> {nameError}
              </p>
            )}
          </div>

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
            <label
              htmlFor="password"
              className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
            >
              Password
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
              Confirm Password
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
                <span>Creating Account...</span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-secondary">Already have an account? </span>
          <Link
            to="/login"
            className="text-brand-purple hover:text-brand-purple/80 font-medium transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
