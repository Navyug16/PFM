import React from 'react'
import { AlertCircle } from 'lucide-react'

export const RouteErrorState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] space-y-4">
      <div className="p-3 bg-state-expense/10 text-state-expense rounded-full">
        <AlertCircle size={28} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-text-primary">Failed to load section</h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          The requested section could not be downloaded. This may be due to an active network interruption or server restart.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-surface-secondary border border-border-neutral hover:bg-surface-elevated text-xs font-semibold rounded-custom-md cursor-pointer transition-all"
      >
        Retry Segment Load
      </button>
    </div>
  )
}
export default RouteErrorState
