import React from 'react'

interface SkeletonProps {
  className?: string
}

/**
 * A basic visual shimmer block to standardize skeleton loading layouts.
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`bg-surface-secondary/60 animate-pulse rounded-custom-sm ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * A skeleton card representing a dashboard widget block.
 */
export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 space-y-4 shadow-subtle">
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
export default Skeleton
