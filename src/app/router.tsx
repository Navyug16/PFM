/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { PublicRoute } from '@/features/auth/components/PublicRoute'
import { LoadingState } from '@/components/ui/LoadingState'
import { AppErrorBoundary } from '@/components/errors/AppErrorBoundary'

// Lazy loaded page components
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage').then(m => ({ default: m.SignupPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))

const OverviewPage = lazy(() => import('@/features/overview/OverviewPage').then(m => ({ default: m.OverviewPage })))
const TransactionsPage = lazy(() => import('@/features/transactions/TransactionsPage').then(m => ({ default: m.TransactionsPage })))
const AccountsPage = lazy(() => import('@/features/accounts/AccountsPage').then(m => ({ default: m.AccountsPage })))
const GoalsPage = lazy(() => import('@/features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })))
const InsightsPage = lazy(() => import('@/features/insights/InsightsPage').then(m => ({ default: m.InsightsPage })))
const MetalsPage = lazy(() => import('@/features/metals/MetalsPage').then(m => ({ default: m.MetalsPage })))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PlanningPage = lazy(() => import('@/features/budgets/PlanningPage').then(m => ({ default: m.PlanningPage })))
const RecurringPage = lazy(() => import('@/features/transactions/RecurringPage').then(m => ({ default: m.RecurringPage })))

// Suspense Layout Wrappers
const AuthLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-primary">
    <LoadingState message="Loading..." />
  </div>
)

const SectionLoader = () => (
  <div className="min-h-[300px] flex items-center justify-center">
    <LoadingState message="Loading section..." />
  </div>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <AppErrorBoundary>
          <Suspense fallback={<AuthLoader />}>
            <LoginPage />
          </Suspense>
        </AppErrorBoundary>
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <AppErrorBoundary>
          <Suspense fallback={<AuthLoader />}>
            <SignupPage />
          </Suspense>
        </AppErrorBoundary>
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <AppErrorBoundary>
          <Suspense fallback={<AuthLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        </AppErrorBoundary>
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <ProtectedRoute>
        <AppErrorBoundary>
          <Suspense fallback={<AuthLoader />}>
            <ResetPasswordPage />
          </Suspense>
        </AppErrorBoundary>
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppErrorBoundary>
          <AppShell />
        </AppErrorBoundary>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/overview" replace />,
      },
      {
        path: 'overview',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <OverviewPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <TransactionsPage />
          </Suspense>
        ),
      },
      {
        path: 'accounts',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <AccountsPage />
          </Suspense>
        ),
      },
      {
        path: 'goals',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <GoalsPage />
          </Suspense>
        ),
      },
      {
        path: 'insights',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <InsightsPage />
          </Suspense>
        ),
      },
      {
        path: 'metals',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <MetalsPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: 'planning',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <PlanningPage />
          </Suspense>
        ),
      },
      {
        path: 'recurring',
        element: (
          <Suspense fallback={<SectionLoader />}>
            <RecurringPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/overview" replace />,
  },
])
export default router
