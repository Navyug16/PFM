import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { NetworkStatus } from '@/components/ui/NetworkStatus'
import { AuthProvider } from '@/features/auth/auth-provider'
import { SettingsProvider } from '@/features/settings/contexts/settings-context'

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NetworkStatus />
        <RouterProvider router={router} />
      </SettingsProvider>
    </AuthProvider>
  )
}
export default App
