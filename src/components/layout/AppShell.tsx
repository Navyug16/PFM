import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  Target,
  TrendingUp,
  Coins,
  Settings,
  LogOut,
  Wallet,
} from 'lucide-react'

import { useAuth } from '@/features/auth/auth-provider'

interface NavItem {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/overview', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Accounts', path: '/accounts', icon: Landmark },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'Insights', path: '/insights', icon: TrendingUp },
  { name: 'Metals', path: '/metals', icon: Coins },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const email = user?.email || 'user@example.com'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-primary border-r border-border-neutral h-screen sticky top-0 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border-neutral">
          <Wallet className="text-brand-purple" size={24} />
          <span className="font-bold text-lg tracking-tight text-text-primary">PFM</span>
          <span className="text-[10px] uppercase font-semibold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-custom-sm">
            M2
          </span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-6 px-4 space-y-1">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-custom-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-surface-secondary text-brand-purple border-l-2 border-brand-purple pl-2.5 shadow-subtle'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary/50'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-border-neutral space-y-2 bg-surface-primary/50">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center font-semibold text-xs text-brand-purple">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
              <p className="text-[10px] text-text-muted truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-custom-md text-sm font-medium text-state-expense hover:bg-state-expense/10 transition-colors duration-200 cursor-pointer text-left border-none"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-14 bg-surface-primary border-b border-border-neutral flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Wallet className="text-brand-purple" size={20} />
          <span className="font-bold text-base tracking-tight text-text-primary">PFM</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-text-secondary hover:text-state-expense p-1.5 transition-colors cursor-pointer"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-primary border-t border-border-neutral grid grid-cols-7 z-40 px-1 shadow-elevated">
        {NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors duration-150 py-1 ${
                isActive ? 'text-brand-purple' : 'text-text-secondary hover:text-text-primary'
              }`
            }
          >
            <item.icon size={18} className="shrink-0" />
            <span className="truncate max-w-full px-0.5">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
