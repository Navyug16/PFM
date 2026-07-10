import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface SectionErrorStateProps {
  message?: string
  refetch?: () => void
}

export const SectionErrorState: React.FC<SectionErrorStateProps> = ({
  message = 'Failed to load this financial section.',
  refetch,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center border border-border-neutral bg-surface-secondary/20 rounded-custom-lg min-h-[180px] space-y-3">
      <AlertTriangle className="text-state-expense shrink-0" size={24} />
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-text-primary">Data Retrieve Error</h4>
        <p className="text-[11px] text-text-secondary max-w-xs leading-relaxed">
          {message}. Your historical financial details remain safe.
        </p>
      </div>
      {refetch && (
        <button
          onClick={refetch}
          className="px-3 py-1.5 bg-surface-primary border border-border-neutral hover:bg-surface-secondary text-[10px] font-bold rounded-custom-md cursor-pointer transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
export default SectionErrorState
