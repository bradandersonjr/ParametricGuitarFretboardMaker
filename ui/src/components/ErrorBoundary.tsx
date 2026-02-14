import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-950/30">
          <h2 className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">
            Something went wrong
          </h2>
          <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
            {this.state.error?.message}
          </pre>
          <pre className="text-xs text-red-500/70 dark:text-red-400/50 whitespace-pre-wrap break-words mt-2 max-h-40 overflow-auto">
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1 text-xs bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 rounded border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
