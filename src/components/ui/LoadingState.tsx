import React from 'react'

interface LoadingStateProps {
  message?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center animate-pulse">
      <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-text-secondary text-sm font-medium">{message}</p>
    </div>
  )
}
