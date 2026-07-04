import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-provider'
import { LoadingState } from '@/components/ui/LoadingState'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isRecoveryMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingState message="Restoring session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect users in password recovery mode to the reset password page
  if (isRecoveryMode && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />
  }

  return <>{children}</>
}
