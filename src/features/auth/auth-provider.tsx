/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isRecoveryMode: boolean
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error: AuthError | null; data: unknown }>
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null; data: unknown }>
  signOut: () => Promise<{ error: AuthError | null }>
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>
  verifyRecoveryOtp: (
    email: string,
    token: string
  ) => Promise<{ error: AuthError | null; data: unknown }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)

  useEffect(() => {
    // 1. Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const isRecovery = localStorage.getItem('pfm_is_recovery_mode') === 'true'
        if (isRecovery) {
          setIsRecoveryMode(true)
        }

        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error fetching initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Sync recovery mode across tabs using localStorage
      const isRecovery = localStorage.getItem('pfm_is_recovery_mode') === 'true'
      if (isRecovery) {
        setIsRecoveryMode(true)
      }

      if (event === 'PASSWORD_RECOVERY') {
        localStorage.setItem('pfm_is_recovery_mode', 'true')
        setIsRecoveryMode(true)
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('pfm_is_recovery_mode')
        setIsRecoveryMode(false)
      }

      if (event === 'INITIAL_SESSION') return

      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })
    return { error, data }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error, data }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      localStorage.removeItem('pfm_is_recovery_mode')
      setIsRecoveryMode(false)
    }
    return { error }
  }

  const requestPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const verifyRecoveryOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })
    if (!error) {
      localStorage.setItem('pfm_is_recovery_mode', 'true')
      setIsRecoveryMode(true)
    }
    return { error, data }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    if (!error) {
      localStorage.removeItem('pfm_is_recovery_mode')
      setIsRecoveryMode(false)
    }
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    isRecoveryMode,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    verifyRecoveryOtp,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
