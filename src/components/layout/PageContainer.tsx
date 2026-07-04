import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
}
