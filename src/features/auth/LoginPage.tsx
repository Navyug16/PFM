import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md bg-surface-primary border border-border-neutral rounded-custom-lg p-8 shadow-elevated">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-full mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome back</h2>
          <p className="text-text-secondary text-sm mt-2">Sign in to your PFM account</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              disabled
              placeholder="name@example.com"
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-muted text-sm outline-none cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              disabled
              placeholder="••••••••"
              className="w-full bg-surface-secondary border border-border-neutral rounded-custom-md px-4 py-2.5 text-text-muted text-sm outline-none cursor-not-allowed"
            />
          </div>

          <button
            onClick={() => navigate('/overview')}
            className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/80 text-text-primary font-medium text-sm rounded-custom-md transition-all duration-200 mt-2 cursor-pointer text-center block"
          >
            Enter App (Skip Authentication)
          </button>
        </div>

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
