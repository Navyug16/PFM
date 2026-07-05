import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface OverviewErrorStateProps {
  message?: string
  onRetry?: () => void
}

export const OverviewErrorState: React.FC<OverviewErrorStateProps> = ({
  message = 'An unexpected database error occurred while building your money overview dashboard.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-primary border border-state-expense/20 rounded-custom-xl max-w-lg mx-auto mt-12 space-y-5">
      <div className="p-4 bg-state-expense/10 rounded-full text-state-expense animate-pulse">
        <AlertTriangle size={36} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary">Dashboard Loading Failed</h3>
        <p className="text-text-secondary text-sm max-w-sm">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-surface-secondary hover:bg-surface-secondary/80 text-text-primary font-semibold text-sm rounded-custom-md border border-border-neutral flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> Retry Loading
        </button>
      )}
    </div>
  )
}
