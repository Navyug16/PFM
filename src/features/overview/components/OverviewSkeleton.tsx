import React from 'react'

export const OverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-surface-secondary rounded-custom-md" />
          <div className="h-4 w-64 bg-surface-secondary/60 rounded-custom-sm" />
        </div>
        <div className="h-10 w-36 bg-surface-secondary rounded-custom-md" />
      </div>

      {/* Financial Hero Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-primary border border-border-neutral rounded-custom-xl p-6 h-36 flex flex-col justify-between">
          <div className="h-4 w-32 bg-surface-secondary rounded" />
          <div className="h-8 w-48 bg-surface-secondary rounded" />
          <div className="h-4 w-64 bg-surface-secondary/40 rounded" />
        </div>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 h-36 flex flex-col justify-between">
          <div className="h-4 w-32 bg-surface-secondary rounded" />
          <div className="h-8 w-40 bg-surface-secondary rounded" />
          <div className="h-4 w-48 bg-surface-secondary/40 rounded" />
        </div>
      </div>

      {/* Flow Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-primary border border-border-neutral rounded-custom-lg p-5 space-y-3">
            <div className="h-3 w-16 bg-surface-secondary rounded" />
            <div className="h-6 w-24 bg-surface-secondary rounded" />
          </div>
        ))}
      </div>

      {/* Insights Section Skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-48 bg-surface-secondary rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface-primary border border-border-neutral rounded-custom-xl p-5 h-28 flex flex-col justify-between">
              <div className="h-4 w-40 bg-surface-secondary rounded" />
              <div className="h-8 w-full bg-surface-secondary/40 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Spending Breakdown & Cash Flow Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 space-y-4">
          <div className="h-5 w-36 bg-surface-secondary rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-3.5 w-16 bg-surface-secondary rounded" />
                  <div className="h-3.5 w-10 bg-surface-secondary rounded" />
                </div>
                <div className="h-2 w-full bg-surface-secondary/40 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-6 h-52 flex flex-col justify-between">
          <div className="h-5 w-32 bg-surface-secondary rounded" />
          <div className="flex items-end justify-between gap-2 h-32 pt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 flex gap-1 items-end h-full">
                <div className="flex-1 bg-surface-secondary/45 rounded-t-custom-sm" style={{ height: `${i * 15}%` }} />
                <div className="flex-1 bg-surface-secondary/20 rounded-t-custom-sm" style={{ height: `${i * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
