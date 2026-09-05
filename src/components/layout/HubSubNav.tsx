import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Receipt, Landmark, Calendar, Sliders, Target, TrendingUp } from 'lucide-react'

interface SubTab {
  name: string
  path: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const TRANSACTIONS_TABS: SubTab[] = [
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Accounts', path: '/accounts', icon: Landmark },
  { name: 'Recurring Rules', path: '/recurring', icon: Calendar },
]

const PLANNING_TABS: SubTab[] = [
  { name: 'Budgets & Planning', path: '/planning', icon: Sliders },
  { name: 'Goals', path: '/goals', icon: Target },
]

const INSIGHTS_TABS: SubTab[] = [
  { name: 'Reports & Insights', path: '/insights', icon: TrendingUp },
]

export const HubSubNav: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  let tabs: SubTab[]

  if (['/transactions', '/accounts', '/recurring'].includes(path)) {
    tabs = TRANSACTIONS_TABS
  } else if (['/planning', '/goals'].includes(path)) {
    tabs = PLANNING_TABS
  } else if (['/insights'].includes(path)) {
    tabs = INSIGHTS_TABS
  } else {
    return null
  }

  // Single tab in hub does not require sub-nav rendering unless multi-tab
  if (tabs.length <= 1) {
    return null
  }

  return (
    <div className="mb-6 border-b border-border-neutral overflow-x-auto scrollbar-none">
      <nav className="flex space-x-1 sm:space-x-2 min-w-max pb-px">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-2 rounded-t-custom-md text-xs sm:text-sm font-semibold transition-all cursor-pointer border-b-2 ${
                isActive
                  ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary/50'
              }`
            }
          >
            <tab.icon size={16} />
            <span>{tab.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
