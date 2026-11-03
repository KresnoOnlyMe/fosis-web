import React from 'react'
import { Activity } from 'lucide-react'

export default function WelcomeBanner() {
  return (
    <section className="dashboard-welcome-hero">
      <div className="hero-pattern" />
      <div className="hero-copy">
        <span className="hero-kicker">WELCOME,</span>
        <h1>FOSIS FIELD OPERATIONS</h1>
        <strong>Field Operation Support &amp; Information System</strong>
        <p>
          Access all operational services and insights from a centralized dashboard to empower field teams with fast, secure, and data-driven execution.
        </p>
      </div>
      <div className="hero-status-card">
        <span className="hero-status-icon"><Activity size={20} /></span>
        <div>
          <small>OPERATIONAL STATUS</small>
          <strong>System Ready</strong>
          <span>Active frontend synchronization</span>
        </div>
      </div>
    </section>
  )
}
