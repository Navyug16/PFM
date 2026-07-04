import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth-provider'
import { LoadingState } from '@/components/ui/LoadingState'

interface PublicRouteProps {
  children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isRecoveryMode } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (user) {
    if (isRecoveryMode) {
      return <Navigate to="/reset-password" replace />
    }
    // Redirect to the page they came from, or default to /overview
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/overview'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}
