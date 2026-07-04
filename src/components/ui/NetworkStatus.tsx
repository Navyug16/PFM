import React, { useState, useEffect } from 'react'
import { WifiOff, X } from 'lucide-react'

export const NetworkStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setDismissed(false)
    }
    const handleOffline = () => {
      setIsOffline(true)
      setDismissed(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-state-expense text-text-primary px-4 py-3 flex items-center justify-between text-sm font-medium shadow-elevated">
      <div className="flex items-center gap-2">
        <WifiOff size={18} className="shrink-0" />
        <span>
          You are offline. Some features will be unavailable until the connection returns.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-primary hover:text-text-primary/80 transition-colors p-1 cursor-pointer"
        aria-label="Dismiss offline notification"
      >
        <X size={16} />
      </button>
    </div>
  )
}
