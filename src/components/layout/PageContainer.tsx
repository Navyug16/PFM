import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return <div className="w-full max-w-7xl mx-auto py-2 sm:py-4">{children}</div>
}
