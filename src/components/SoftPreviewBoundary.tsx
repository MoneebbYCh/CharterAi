import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  failed: boolean
}

/** Soft boundary for gallery thumbs — one bad preview must not blank the grid. */
export class SoftPreviewBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TemplatePreview]', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div className="mp-card-preview-fallback">
            <span className="material-symbols-outlined" aria-hidden>
              draft
            </span>
            <span>Preview unavailable</span>
          </div>
        )
      )
    }
    return this.props.children
  }
}
