import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Mail, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../auth-provider'
import { getFriendlyAuthError } from '../auth-errors'

type RecoveryStep = 'request' | 'verify' | 'reset' | 'success'

export const ForgotPasswordPage: React.FC = () => {
  const { requestPasswordReset, verifyRecoveryOtp, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<RecoveryStep>('request')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const [emailError, setEmailError] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const handleRequest = async (e: React.FormEvent) => {
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
        console.error('Password reset request error response:', resetError)
        setError(getFriendlyAuthError(resetError))
      } else {
        setStep('verify')
      }
    } catch (err: unknown) {
      console.error('Password reset request caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!navigator.onLine) {
      setError('Unable to connect. Check your internet connection and try again.')
      return
    }

    const cleanOtp = otpCode.trim()
    if (!cleanOtp) {
      setOtpError('Verification code is required.')
      return
    }
    if (cleanOtp.length < 6 || cleanOtp.length > 8 || !/^\d+$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-to-8 digit code.')
      return
    }
    setOtpError(null)

    setLoading(true)
    try {
      const { error: verifyError } = await verifyRecoveryOtp(email, cleanOtp)

      if (verifyError) {
        console.error('OTP verification error response:', verifyError)
        setError(getFriendlyAuthError(verifyError))
      } else {
        setStep('reset')
      }
    } catch (err: unknown) {
      console.error('OTP verification caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!navigator.onLine) {
      setError('Unable to connect. Check your internet connection and try again.')
      return
    }

    let isValid = true

    if (!password) {
      setPasswordError('New password is required.')
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

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password.')
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.')
      isValid = false
    } else {
      setConfirmPasswordError(null)
    }

    if (!isValid) return

    setLoading(true)
    try {
      const { error: updateError } = await updatePassword(password)

      if (updateError) {
        console.error('Password update error response:', updateError)
        setError(getFriendlyAuthError(updateError))
      } else {
        setStep('success')
      }
    } catch (err: unknown) {
      console.error('Password update caught exception:', err)
      setError(getFriendlyAuthError(err as Error))
    } finally {
      setLoading(false)
    }
  }

  // Phase 4: Success
  if (step === 'success') {
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
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 cursor-pointer text-center block border-none outline-none"
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
        
        {/* Step 1: Request Reset */}
        {step === 'request' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Reset password</h2>
              <p className="text-text-secondary text-sm mt-2 text-center">
                Enter your email to receive a 6-digit verification code
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequest} noValidate className="space-y-5">
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
                    <span>Sending code...</span>
                  </>
                ) : (
                  'Send Reset Code'
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
          </>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Enter verification code</h2>
              <p className="text-text-secondary text-sm mt-2 text-center">
                We sent a verification code to <span className="text-text-primary font-medium">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="otpCode"
                  className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2"
                >
                  Verification Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  name="otpCode"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''))
                    if (otpError) setOtpError(null)
                  }}
                  placeholder="12345678"
                  disabled={loading}
                  className={`w-full bg-surface-secondary border rounded-custom-md px-4 py-2.5 text-center tracking-[0.3em] font-mono text-text-primary text-lg font-bold outline-none transition-all duration-200 ${
                    otpError
                      ? 'border-state-expense focus:border-state-expense'
                      : 'border-border-neutral focus:border-brand-purple'
                  }`}
                />
                {otpError && (
                  <p className="text-state-expense text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {otpError}
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
                    <span>Verifying code...</span>
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm flex flex-col gap-2">
              <button
                onClick={handleRequest}
                disabled={loading}
                className="text-brand-purple hover:text-brand-purple/80 font-medium transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                Resend Code
              </button>
              <button
                onClick={() => setStep('request')}
                className="text-text-secondary hover:text-text-primary font-medium transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                Change Email Address
              </button>
            </div>
          </>
        )}

        {/* Step 3: Reset Password */}
        {step === 'reset' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create new password</h2>
              <p className="text-text-secondary text-sm mt-2 text-center">
                Create a new secure password for your account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-state-expense/10 border border-state-expense/20 text-state-expense rounded-custom-md flex items-start gap-3 text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} noValidate className="space-y-4">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer bg-transparent border-none outline-none"
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 cursor-pointer bg-transparent border-none outline-none"
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
                    <span>Resetting password...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
