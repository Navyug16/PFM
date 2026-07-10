import React, { useState } from 'react'
import { useSettings } from '../hooks/useSettings'
import type { ThemeOption } from '../types'
import { Sun, Moon, Laptop } from 'lucide-react'

export const AppearanceSettings: React.FC = () => {
  const { profile, updateProfile } = useSettings()
  const [theme, setTheme] = useState<ThemeOption>(profile?.theme || 'system')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTheme = async (selected: ThemeOption) => {
    setTheme(selected)
    setSuccess(null)
    setError(null)
    setLoading(true)

    try {
      await updateProfile({ theme: selected })
      setSuccess(`Theme changed to ${selected} successfully.`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save theme preference.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-6">
      <div>
        <h3 className="text-base font-bold text-text-primary">Theme Appearance</h3>
        <p className="text-xs text-text-secondary mt-1">
          Customize how the application displays on your device.
        </p>
      </div>

      <div className="space-y-4 max-w-md">
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

        <div className="grid grid-cols-3 gap-4">
          {/* Light Theme Button */}
          <button
            onClick={() => handleSelectTheme('light')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 border rounded-custom-lg cursor-pointer transition-all duration-200 ${
              theme === 'light'
                ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                : 'border-border-neutral bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sun size={20} className="mb-2" />
            <span className="text-xs font-semibold">Light</span>
          </button>

          {/* Dark Theme Button */}
          <button
            onClick={() => handleSelectTheme('dark')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 border rounded-custom-lg cursor-pointer transition-all duration-200 ${
              theme === 'dark'
                ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                : 'border-border-neutral bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Moon size={20} className="mb-2" />
            <span className="text-xs font-semibold">Dark</span>
          </button>

          {/* System Theme Button */}
          <button
            onClick={() => handleSelectTheme('system')}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 border rounded-custom-lg cursor-pointer transition-all duration-200 ${
              theme === 'system'
                ? 'border-brand-purple bg-brand-purple/5 text-brand-purple'
                : 'border-border-neutral bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Laptop size={20} className="mb-2" />
            <span className="text-xs font-semibold">System</span>
          </button>
        </div>
        
        <p className="text-[11px] text-text-secondary leading-relaxed">
          * Choosing <strong>System</strong> automatically matches your browser/operating system's preferred color scheme.
        </p>
      </div>
    </div>
  )
}
