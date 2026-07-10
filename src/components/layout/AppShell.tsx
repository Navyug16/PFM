import React, { useState, useEffect, useRef } from 'react'
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
  ChevronDown,
  Sliders,
  Calendar
} from 'lucide-react'

import { useAuth } from '@/features/auth/auth-provider'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { APP_CONFIG } from '@/config/app-config'

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
  { name: 'Budgets & Planning', path: '/planning', icon: Sliders },
  { name: 'Recurring Rules', path: '/recurring', icon: Calendar },
  { name: 'Insights', path: '/insights', icon: TrendingUp },
  { name: 'Metals', path: '/metals', icon: Coins },
  { name: 'Settings', path: '/settings', icon: Settings },
]

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile } = useSettings()
  const navigate = useNavigate()
  
  // Dropdown States and Refs
  const [profileOpen, setProfileOpen] = useState(false)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const email = user?.email || 'user@example.com'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideDesktop = !desktopDropdownRef.current || !desktopDropdownRef.current.contains(target)
      const clickedOutsideMobile = !mobileDropdownRef.current || !mobileDropdownRef.current.contains(target)
      
      if (clickedOutsideDesktop && clickedOutsideMobile) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-surface-primary border-r border-border-neutral h-screen sticky top-0 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-border-neutral">
          <Wallet className="text-brand-purple" size={24} />
          <span className="font-bold text-lg tracking-tight text-text-primary">
            {APP_CONFIG.shortName}
          </span>
          <span className="text-[10px] uppercase font-semibold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-custom-sm">
            v1.0
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-end px-8 border-b border-border-neutral bg-surface-primary/20 backdrop-blur-md sticky top-0 z-30">
          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-custom-md hover:bg-surface-secondary transition-all cursor-pointer border-none bg-transparent"
            >
              <div className="w-8 h-8 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center font-semibold text-xs text-brand-purple">
                {initials}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-text-primary leading-none">{displayName}</p>
                <p className="text-[10px] text-text-muted mt-0.5 leading-none">{email}</p>
              </div>
              <ChevronDown size={14} className="text-text-secondary" />
            </button>

            {/* Desktop Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-primary border border-border-neutral rounded-custom-md shadow-elevated py-1 z-50">
                <div className="px-4 py-2.5 border-b border-border-neutral lg:hidden">
                  <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">{email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-state-expense hover:bg-state-expense/10 transition-colors duration-200 cursor-pointer border-none bg-transparent text-left"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Top Header */}
        <header className="md:hidden h-14 bg-surface-primary border-b border-border-neutral flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Wallet className="text-brand-purple" size={20} />
            <span className="font-bold text-base tracking-tight text-text-primary">
              {APP_CONFIG.shortName}
            </span>
          </div>

          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center font-semibold text-xs text-brand-purple cursor-pointer"
            >
              {initials}
            </button>

            {/* Mobile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-primary border border-border-neutral rounded-custom-md shadow-elevated py-1 z-50">
                <div className="px-3 py-2 border-b border-border-neutral">
                  <p className="text-xs font-semibold text-text-primary truncate">{displayName}</p>
                  <p className="text-[9px] text-text-muted truncate mt-0.5">{email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-state-expense hover:bg-state-expense/10 transition-colors cursor-pointer border-none bg-transparent text-left"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

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
              `flex flex-col items-center justify-center gap-1 text-center transition-all ${
                isActive ? 'text-brand-purple' : 'text-text-secondary'
              }`
            }
          >
            <item.icon size={16} />
            <span className="text-[8px] font-semibold tracking-tighter truncate max-w-[48px]">
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
export default AppShell
