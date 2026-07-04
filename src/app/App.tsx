import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { NetworkStatus } from '@/components/ui/NetworkStatus'

export const App: React.FC = () => {
  return (
    <>
      <NetworkStatus />
      <RouterProvider router={router} />
    </>
  )
}
