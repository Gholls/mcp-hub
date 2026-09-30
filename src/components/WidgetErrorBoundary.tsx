import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/** Contains a widget crash so the surrounding page (or MCP host) stays usable. */
export default class WidgetErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[widget] render error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center text-sm text-rose-300">
            <p className="font-medium">This widget failed to render.</p>
            <p className="mt-1 font-mono text-xs text-rose-400/80">{this.state.error.message}</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}
