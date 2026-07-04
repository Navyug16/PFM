import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { TransactionsPage } from '@/features/transactions/TransactionsPage'
import { AccountsPage } from '@/features/accounts/AccountsPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { InsightsPage } from '@/features/insights/InsightsPage'
import { MetalsPage } from '@/features/metals/MetalsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Navigate to="/overview" replace />,
      },
      {
        path: 'overview',
        element: <OverviewPage />,
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
      {
        path: 'goals',
        element: <GoalsPage />,
      },
      {
        path: 'insights',
        element: <InsightsPage />,
      },
      {
        path: 'metals',
        element: <MetalsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/overview" replace />,
  },
])
