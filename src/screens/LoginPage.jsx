import React, { useState } from 'react'
import {
  RadioTower,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  User
} from 'lucide-react'
import { authService } from '../services/authService'

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    const cleanId = identifier.trim()
    const cleanPw = password.trim()

    if (!cleanId) {
      setError('Username is required.')
      return
    }

    if (!cleanPw) {
      setError('PIN is required.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await new Promise((r) => setTimeout(r, 300))
      const user = await authService.login(cleanId, cleanPw, true)
      onLoginSuccess?.(user)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your username and PIN.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
        background: '#060B19',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif"
      }}
    >
      <style>{`
        .noc-login-input::placeholder {
          color: #64748B;
          opacity: 1;
        }
        .noc-login-input:focus {
          outline: none;
        }
      `}</style>

      {/* LEFT 60% HERO & BRANDING */}
      <section
        style={{
          flex: '1 1 60%',
          background: "linear-gradient(180deg, rgba(6, 11, 25, 0.85) 0%, rgba(6, 11, 25, 0.25) 45%, rgba(6, 11, 25, 0.1) 100%), url('/assets/bg-network.png') no-repeat bottom center / cover",
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start'
        }}
      >
        {/* Brand Header Kiri Atas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 44
          }}
        >
          <RadioTower
            size={42}
            color="#22D3EE"
            style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.65))' }}
          />
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: '1.6px',
              color: '#7DD3FC',
              lineHeight: 1.45,
              textTransform: 'uppercase'
            }}
          >
            <div>FIELD OPERATION SUPPORT</div>
            <div>&amp; INTEGRATED SYSTEM</div>
          </div>
        </div>

        {/* Judul Utama */}
        <h1 style={{ margin: 0 }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#FFFFFF',
              lineHeight: 1.2
            }}
          >
            Integrated Operations System
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              lineHeight: 1.15,
              marginTop: 4
            }}
          >
            FOSIS WEB
          </div>
        </h1>

        {/* Deskripsi */}
        <p
          style={{
            fontSize: 14.5,
            color: '#94A3B8',
            maxWidth: 500,
            lineHeight: 1.65,
            marginTop: 18,
            marginBottom: 0
          }}
        >
          Integrated operational platform for managing trouble tickets, preventive maintenance, work permits (SIK), fleet vehicles, and 4-tier hierarchical verification workflow.
        </p>
      </section>

      {/* RIGHT 40% LOGIN FORM */}
      <section
        style={{
          flex: '1 1 40%',
          background: 'radial-gradient(circle at 50% 40%, #111C35 0%, #0A1020 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 390,
            padding: '40px 34px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(34, 211, 238, 0.4)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55), 0 0 24px rgba(34, 211, 238, 0.1)'
          }}
        >
          {/* Header Brand di Dalam Kartu Login */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 16
            }}
          >
            <RadioTower
              size={42}
              color="#22D3EE"
              style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.65))' }}
            />
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.5px'
              }}
            >
              FOSIS
            </span>
          </div>

          {/* Login Title & Subtitle */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 4px 0'
            }}
          >
            Login
          </h2>
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: '#94A3B8',
              margin: '0 0 26px 0'
            }}
          >
            Field Support Authentication
          </p>

          {/* Error Message */}
          {error && (
            <div
              style={{
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '10px 12px',
                fontSize: 12,
                color: '#FCA5A5',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Field: Username */}
            <div>
              <label
                htmlFor="login-identifier"
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#E2E8F0',
                  marginBottom: 8
                }}
              >
                Username
              </label>
              <div
                style={{
                  background: 'rgba(10, 16, 32, 0.75)',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  height: 44,
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your username"
                  className="noc-login-input"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 13,
                    color: '#F8FAFC',
                    fontWeight: 500
                  }}
                />
                <User size={16} color="#94A3B8" style={{ flexShrink: 0, marginLeft: 8 }} />
              </div>
            </div>

            {/* Field: PIN */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#E2E8F0',
                  marginBottom: 8
                }}
              >
                PIN
              </label>
              <div
                style={{
                  background: 'rgba(10, 16, 32, 0.75)',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  height: 44,
                  padding: '0 14px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="Enter your PIN"
                  className="noc-login-input"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 13,
                    color: '#F8FAFC',
                    fontWeight: 500
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    marginLeft: 8
                  }}
                  aria-label={showPassword ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Tombol: Sign In */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 10,
                height: 46,
                borderRadius: 8,
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'background 0.15s ease'
              }}
            >
              <span>{loading ? 'Verifying...' : 'Sign In'}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
