import React from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center max-w-lg mx-auto bg-surface-primary border border-border-neutral rounded-custom-lg shadow-subtle">
      <div className="p-4 bg-surface-secondary text-text-muted rounded-full mb-4">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
      <p className="text-text-secondary text-sm mb-6 leading-relaxed max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-surface-secondary hover:bg-surface-elevated text-text-primary border border-border-neutral hover:border-text-muted text-sm font-medium rounded-custom-md transition-all duration-200 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
