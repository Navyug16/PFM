import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
          <div className="bg-surface-primary border border-border-neutral rounded-custom-xl p-8 max-w-md w-full text-center space-y-5 shadow-elevated">
            <div className="mx-auto w-12 h-12 bg-state-expense/10 text-state-expense rounded-full flex items-center justify-center">
              <AlertOctagon size={24} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-text-primary">Something went wrong</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                An unexpected application rendering error occurred. No financial data has been lost, but you may need to reload the browser to restore operations.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-text-primary font-medium text-sm rounded-custom-md cursor-pointer transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
export default AppErrorBoundary
