import React, { useState } from 'react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { WifiOff, X } from 'lucide-react'

export const NetworkStatus: React.FC = () => {
  const isOnline = useNetworkStatus()
  const [prevIsOnline, setPrevIsOnline] = useState(isOnline)
  const [dismissed, setDismissed] = useState(false)

  if (isOnline !== prevIsOnline) {
    setPrevIsOnline(isOnline)
    if (!isOnline) {
      setDismissed(false)
    }
  }

  if (isOnline || dismissed) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] bg-state-expense text-text-primary px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <WifiOff size={16} className="shrink-0" />
        <span>
          Offline Mode. Financial ledger aggregates may be stale until connection is restored.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-primary hover:text-text-primary/80 transition-colors p-1 cursor-pointer"
        aria-label="Dismiss offline notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}
export default NetworkStatus
