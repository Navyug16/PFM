import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { NetworkStatus } from '@/components/ui/NetworkStatus'
import { AuthProvider } from '@/features/auth/auth-provider'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NetworkStatus />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
