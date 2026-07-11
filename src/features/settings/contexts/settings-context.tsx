/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/auth-provider'
import { APP_CONFIG } from '@/config/app-config'
import type { UserProfile, ThemeOption } from '../types'
import { getProfile, updateProfile as apiUpdateProfile, createDefaultProfile } from '../api/settings-api'

interface SettingsContextType {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>
  refetchProfile: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (!user) {
      setProfile(null)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }

  // Fast theme bootstrap from localStorage to prevent dark-mode flash during render
  const [theme, setTheme] = useState<ThemeOption>(() => {
    const cached = localStorage.getItem('pfm_theme') as ThemeOption
    return cached || APP_CONFIG.defaults.theme
  })

  // Theme Applier Helper
  const applyThemeClass = useCallback((targetTheme: ThemeOption) => {
    const root = document.documentElement
    if (targetTheme === 'dark') {
      root.classList.add('dark')
    } else if (targetTheme === 'light') {
      root.classList.remove('dark')
    } else {
      // System resolution
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [])

  // Sync profile data from database
  const refetchProfile = useCallback(async () => {
    if (!user) {
      return
    }

    try {
      const data = await getProfile(user.id)
      setProfile(data)
      setTheme(data.theme)
      localStorage.setItem('pfm_theme', data.theme)
      setError(null)
    } catch (err: unknown) {
      const errorObj = err as Record<string, unknown>
      // Catch row not found (PGRST116) or missing row, and self-bootstrap profile
      if (errorObj && (errorObj.code === 'PGRST116' || (typeof errorObj.message === 'string' && (errorObj.message.includes('PGRST116') || errorObj.message.includes('0 rows'))))) {
        try {
          const defaultData = await createDefaultProfile(user.id, user.email)
          setProfile(defaultData)
          setTheme(defaultData.theme)
          localStorage.setItem('pfm_theme', defaultData.theme)
          setError(null)
          return
        } catch (bootstrapErr) {
          console.error('Self-bootstrapping profile failed:', bootstrapErr)
        }
      }
      console.error('Failed to load user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Call on update
  const updateProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return

    try {
      setLoading(true)
      const data = await apiUpdateProfile(user.id, updates)
      setProfile(data)
      setTheme(data.theme)
      localStorage.setItem('pfm_theme', data.theme)
      setError(null)
    } catch (err: unknown) {
      console.error('Profile update failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Effect to load profile when user becomes authenticated
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refetchProfile()
    }
  }, [user, refetchProfile])

  // Apply theme class instantly whenever theme state changes
  useEffect(() => {
    applyThemeClass(theme)
  }, [theme, applyThemeClass])

  // Listen to system theme updates dynamically
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyThemeClass('system')
      }
    }
    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme, applyThemeClass])

  // Cleanup on Sign Out
  useEffect(() => {
    if (!user) {
      // Sign out clean up
      localStorage.removeItem('pfm_theme')
    }
  }, [user])

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refetchProfile,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettingsContext = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}
export default SettingsContext
