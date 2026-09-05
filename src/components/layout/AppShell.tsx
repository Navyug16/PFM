import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Sliders,
  Coins,
  TrendingUp,
  Settings,
  LogOut,
  Wallet,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react'

import { useAuth } from '@/features/auth/auth-provider'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { APP_CONFIG } from '@/config/app-config'
import { HubSubNav } from './HubSubNav'

interface PrimaryHub {
  name: string
  path: string
  matchedPaths: string[]
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const PRIMARY_HUBS: PrimaryHub[] = [
  {
    name: 'Home',
    path: '/overview',
    matchedPaths: ['/overview'],
    icon: LayoutDashboard
  },
  {
    name: 'Transactions',
    path: '/transactions',
    matchedPaths: ['/transactions', '/accounts', '/recurring'],
    icon: Receipt
  },
  {
    name: 'Planning',
    path: '/planning',
    matchedPaths: ['/planning', '/goals'],
    icon: Sliders
  },
  {
    name: 'Metals',
    path: '/metals',
    matchedPaths: ['/metals'],
    icon: Coins
  },
  {
    name: 'Insights',
    path: '/insights',
    matchedPaths: ['/insights'],
    icon: TrendingUp
  }
]

const MOBILE_BOTTOM_HUBS = PRIMARY_HUBS.filter((h) => h.path !== '/metals')

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth()
  const { profile } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Collapsible Sidebar State (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pfm_sidebar_collapsed') === 'true'
  })

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

  // Persist sidebar state changes
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const nextState = !prev
      localStorage.setItem('pfm_sidebar_collapsed', String(nextState))
      return nextState
    })
  }

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

  // Helper to determine if a Hub is active based on current path
  const isHubActive = (hub: PrimaryHub) => {
    return hub.matchedPaths.some((p) => location.pathname.startsWith(p))
  }

  return (
    <div className="h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-surface-primary border-r border-border-neutral h-screen sticky top-0 shrink-0 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-neutral">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Wallet className="text-brand-orange shrink-0" size={24} />
            {!isCollapsed && (
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-lg tracking-tight text-text-primary truncate">
                  {APP_CONFIG.shortName}
                </span>
                <span className="text-[10px] uppercase font-semibold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-custom-sm shrink-0">
                  v1.1
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-custom-md transition-all cursor-pointer border-none bg-transparent"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto">
          {PRIMARY_HUBS.map((hub) => {
            const active = isHubActive(hub)
            return (
              <NavLink
                key={hub.path}
                to={hub.path}
                title={isCollapsed ? hub.name : undefined}
                className={
                  `flex items-center gap-3 px-3 py-2.5 rounded-custom-md text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-surface-secondary text-brand-orange border-l-2 border-brand-orange pl-2.5 shadow-subtle'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
              >
                <hub.icon size={20} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{hub.name}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Desktop Sidebar Footer: Settings & User Quick Link */}
        <div className="p-2 border-t border-border-neutral">
          <NavLink
            to="/settings"
            title={isCollapsed ? 'Settings' : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-custom-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-surface-secondary text-brand-orange'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
              } ${isCollapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex h-16 shrink-0 items-center justify-between px-8 border-b border-border-neutral bg-surface-primary/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
              {PRIMARY_HUBS.find(isHubActive)?.name || 'PFM'}
            </h1>
          </div>

          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-custom-md hover:bg-surface-secondary transition-all cursor-pointer border-none bg-transparent"
            >
              <div className="w-8 h-8 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-bold text-xs text-brand-orange">
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
                <NavLink
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <Settings size={16} />
                  <span>Preferences & Settings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-state-expense hover:bg-state-expense/10 transition-colors duration-200 cursor-pointer border-none bg-transparent text-left"
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
            <Wallet className="text-brand-orange" size={20} />
            <span className="font-bold text-base tracking-tight text-text-primary">
              {APP_CONFIG.shortName}
            </span>
          </div>

          <div className="flex items-center gap-2" ref={mobileDropdownRef}>
            <NavLink
              to="/metals"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1 rounded-custom-md border text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange'
                    : 'bg-surface-secondary/80 border-border-neutral text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Coins size={14} className="text-brand-orange shrink-0" />
              <span>Metals</span>
            </NavLink>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center font-semibold text-xs text-brand-orange cursor-pointer"
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
                  <NavLink
                    to="/metals"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Coins size={14} className="text-brand-orange" />
                    <span>Metals Tracker</span>
                  </NavLink>
                  <NavLink
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    <Settings size={14} />
                    <span>Settings</span>
                  </NavLink>
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
          </div>
        </header>

        {/* Content Body Container with Hub Sub-Nav */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 sm:py-6">
          <HubSubNav />
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (4 Primary Hub Destinations) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-primary border-t border-border-neutral grid grid-cols-4 z-40 px-2 shadow-elevated">
        {MOBILE_BOTTOM_HUBS.map((hub) => {
          const active = isHubActive(hub)
          return (
            <NavLink
              key={hub.path}
              to={hub.path}
              className={
                `flex flex-col items-center justify-center gap-1 text-center min-h-[44px] transition-all ${
                  active ? 'text-brand-orange font-bold' : 'text-text-secondary'
                }`
              }
            >
              <hub.icon size={18} />
              <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                {hub.name}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
export default AppShell
