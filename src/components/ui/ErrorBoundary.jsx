import React from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('FOSIS Error Boundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset)
      }

      return (
        <div
          style={{
            padding: '32px 24px',
            maxWidth: '560px',
            margin: '40px auto',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #FCA5A5',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.1)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', margin: 0 }}>
            {this.props.title || 'Terjadi Kendala pada Komponen'}
          </h3>

          <p style={{ fontSize: '12.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            {this.props.message ||
              'Terjadi kesalahan saat memuat tampilan data ini. Data sistem Anda tetap aman dan tidak hilang.'}
          </p>

          {this.state.error && (
            <div
              style={{
                width: '100%',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#B91C1C',
                fontFamily: 'monospace',
                textAlign: 'left',
                overflowX: 'auto'
              }}
            >
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              <span>Coba Lagi</span>
            </button>

            <button
              type="button"
              onClick={this.handleReload}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              <span>Muat Ulang</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
