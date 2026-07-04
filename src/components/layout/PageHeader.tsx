import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="border-b border-border-neutral pb-5">
      <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">{title}</h1>
      {description && (
        <p className="text-text-secondary text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  )
}
