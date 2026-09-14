import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Note Replace renderer error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 32, background: '#f5f7fb', color: '#1e2a42', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: 'min(520px, 100%)', background: '#fff', border: '1px solid #dfe5ee', borderRadius: 18, padding: 24, boxShadow: '0 24px 70px rgba(37,48,69,.12)' }}>
        <strong style={{ display: 'block', fontSize: 17 }}>Note Replace could not render this workspace.</strong>
        <p style={{ color: '#7b879c', fontSize: 12, lineHeight: 1.6 }}>The renderer hit an unexpected error. Reload the editor to start from a clean UI state.</p>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#536078', background: '#f7f8fb', padding: 12, borderRadius: 10, overflow: 'auto' }}>{this.state.error.message}</pre>
        <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 10, height: 36, padding: '0 14px', border: 0, borderRadius: 9, background: '#665cf3', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Reload workspace</button>
      </div>
    </div>
  }
}
