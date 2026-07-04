import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] p-6 text-center max-w-md mx-auto bg-surface-primary border border-state-expense/20 rounded-custom-lg shadow-subtle">
      <div className="p-3 bg-state-expense/10 text-state-expense rounded-full mb-4">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/80 text-text-primary text-sm font-medium rounded-custom-md transition-all duration-200 cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
