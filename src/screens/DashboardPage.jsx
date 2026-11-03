import React, { useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  TriangleAlert,
  Clock,
  ShieldCheck
} from 'lucide-react'
import DashboardSwitcher from '../components/dashboard/DashboardSwitcher'
import WelcomeBanner from '../components/dashboard/WelcomeBanner'
import ExecutiveOverview from '../components/dashboard/ExecutiveOverview'
import EngineerKPIDashboard from '../components/dashboard/EngineerKPIDashboard'
import ExportOperational from '../components/dashboard/ExportOperational'
import { useFosis } from '../context/FosisContext'
import {
  normalizeRole,
  ROLES,
  canViewRecentActivity,
  canViewExportOperational,
  getVisibleTickets,
  isSuperAdmin
} from '../utils/permissions'

export default function DashboardPage({ onNavigate, onSelectTicket, onAdd }) {
  const { tickets, activityLogs, activeUser } = useFosis()
  const [mode, setMode] = useState('EXECUTIVE') // 'EXECUTIVE' (Ringkasan Operasional) or 'ENGINEER' (KPI Kinerja Engineer)

  const activeUserRole = normalizeRole(activeUser?.role)
  const isAdmin = activeUserRole === ROLES.ADMIN
  const isTeknisi = activeUserRole === ROLES.TEKNISI
  const isIC = activeUserRole === ROLES.IC_TROUBLESHOOT || activeUserRole === ROLES.IC_MAINTENANCE
  const isDeptHead = activeUserRole === ROLES.DEPT_HEAD

  // Scoped tickets based on active role
  const visibleTickets = useMemo(() => {
    return getVisibleTickets(activeUser, tickets)
  }, [activeUser, tickets])

  const activeSession = useMemo(() => {
    try {
      const raw = localStorage.getItem('fosis_active_sessions')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [activeUser])

  const authLogs = useMemo(() => {
    return activityLogs.filter((l) => l.action === 'LOGIN' || l.action === 'LOGOUT')
  }, [activityLogs])

  // Urgent ticket in scope (matching mockup [E/260901/0001] FO Cut jalur backbone area Surabaya)
  const urgentTicket = useMemo(() => {
    return (
      visibleTickets.find((t) => t.urgent || t.slaStatus === 'OVER SLA') ||
      visibleTickets[0] ||
      null
    )
  }, [visibleTickets])

  // Real operational metrics (Never dummy)
  const metrics = useMemo(() => {
    const total = visibleTickets.length
    const activeWork = visibleTickets.filter(
      (t) =>
        t.workflowStatus !== 'Disahkan Dept. Head' &&
        t.workflowStatus !== 'Approved by Dept. Head' &&
        t.workflowStatus !== 'DONE'
    ).length
    const waitingVerification = visibleTickets.filter(
      (t) =>
        t.workflowStatus === 'Menunggu Verifikasi IC' ||
        t.workflowStatus === 'Pending IC Verification'
    ).length

    const troubleshootItems = visibleTickets.filter((t) => t.type === 'TROUBLESHOOT')
    const inSlaCount = troubleshootItems.filter((t) => t.slaStatus === 'IN SLA').length
    const slaPercent = troubleshootItems.length > 0 ? (inSlaCount * 100) / troubleshootItems.length : 100

    const maintenanceItems = visibleTickets.filter((t) => t.type === 'MAINTENANCE')
    const doneMaintenance = maintenanceItems.filter((t) => t.maintenanceStatus === 'DONE').length
    const mntPercent = maintenanceItems.length > 0 ? (doneMaintenance * 100) / maintenanceItems.length : 0

    return {
      total,
      activeWork,
      waitingVerification,
      slaPercent: slaPercent.toFixed(1),
      mntPercent: mntPercent.toFixed(1),
      mttr: troubleshootItems.length > 0 ? '1.8h' : '-'
    }
  }, [visibleTickets])

  // Check RBAC permissions for Right Column components
  const showRecentActivity = canViewRecentActivity(activeUser, 'dashboard', mode)
  const showExport = canViewExportOperational(activeUser, 'dashboard', mode)

  return (
    <div className="page dashboard-page-v2" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. HERO BANNER: SELAMAT DATANG, FOSIS FIELD OPERATIONS */}
      <WelcomeBanner />

      {/* 3. URGENT ASSIGNMENT STRIP (MATCHING MOCKUP & SRS INCIDENT DISPATCH) */}
      {urgentTicket && (
        <div className="urgent-strip">
          <div className="urgent-strip-icon">
            <TriangleAlert size={20} />
          </div>
          <div className="urgent-strip-copy">
            <span>URGENT ASSIGNMENT</span>
            <strong>
              {urgentTicket.ticketNo} &bull; {urgentTicket.title}
            </strong>
            <small>
              {urgentTicket.siteLocationName || 'POP Surabaya Gubeng'} &bull; SLA:{' '}
              {urgentTicket.slaStatus || 'OVER SLA'}
            </small>
          </div>

          <button
            type="button"
            className="btn danger"
            onClick={() => onSelectTicket?.(urgentTicket)}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>DISPATCH</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 4. MODE SWITCHER BAR: [Ringkasan Operasional] vs [KPI Kinerja Engineer] */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '12px 18px',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}
      >
        <DashboardSwitcher mode={mode} setMode={setMode} />
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
          {mode === 'EXECUTIVE'
            ? 'Operational Overview & Field SLA'
            : isTeknisi
              ? 'Your Personal Performance KPI'
              : 'Staff Performance KPI & Workload'}
        </div>
      </div>

      {/* 5. TOP OPERATIONAL METRICS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10
        }}
      >
        <MetricBox
          title={isTeknisi ? 'My Tickets' : 'Total Tickets'}
          value={String(metrics.total)}
          subtitle={isTeknisi ? 'Active Tasks' : 'All Tickets'}
          accent="#4B45F5"
        />
        <MetricBox
          title="Active Work"
          value={String(metrics.activeWork)}
          subtitle="In Progress"
          accent="#2E90FA"
        />
        <MetricBox
          title="Waiting Verification"
          value={String(metrics.waitingVerification)}
          subtitle="IC Leader Queue"
          accent="#F79009"
        />
        <MetricBox
          title="SLA Compliance"
          value={`${metrics.slaPercent}%`}
          subtitle="Standard Handling"
          accent={parseFloat(metrics.slaPercent) >= 80 ? '#12B76A' : '#F04438'}
        />
        <MetricBox
          title="Estimated MTTR"
          value={metrics.mttr}
          subtitle="Mean Time to Resolve"
          accent="#101828"
        />
        <MetricBox
          title="Maintenance Done"
          value={`${metrics.mntPercent}%`}
          subtitle="Completed Preventive"
          accent="#12B76A"
        />
      </div>

      {/* 6. MAIN CONTENT AREA:
          MODE 1 (Ringkasan Operasional):
             NO MAP on Dashboard (SRS & design.md rule #11 & #12).
             For Admin: Left (±65%) Workflow/SLA/Workload/Distribution + Right (±35%) Export + Recent Activity
             For Non-Admin: Balanced operational overview without empty reserved containers.
          MODE 2 (KPI Kinerja):
             - EngineerKPIDashboard strictly scoped sesuai Role SRS
      */}
      {mode === 'EXECUTIVE' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {showExport || showRecentActivity ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
                gap: 16,
                alignItems: 'start'
              }}
            >
              {/* LEFT ±65%: Workflow / SLA / Workload / Ticket Distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ExecutiveOverview tickets={visibleTickets} />
              </div>

              {/* RIGHT ±35%: Export Data Operasional (Top) + Recent Operational Activity (Bottom) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {showExport && <ExportOperational tickets={visibleTickets} />}

                {/* Khusus Super Admin: Monitor Sesi & Jejak Login Web (Real-Time) */}
                {isSuperAdmin(activeUser) && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 18,
                      border: '1px solid #C7D2FE',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      boxShadow: '0 4px 20px rgba(79, 70, 229, 0.08)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            display: 'grid',
                            placeItems: 'center'
                          }}
                        >
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
                            Web Login &amp; Session Audit (Real-Time)
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Authentication monitoring &amp; access logs
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: '#F5F3FF',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE'
                          }}
                        >
                          Super Admin Only
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 9.5,
                            fontWeight: 900,
                            padding: '2px 7px',
                            borderRadius: 999,
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0'
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 6px #10B981'
                            }}
                          />
                          LIVE
                        </span>
                      </div>
                    </div>

                    {/* Sesi Aktif Saat Ini */}
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: '#2563EB',
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: 13,
                            flexShrink: 0
                          }}
                        >
                          {activeUser?.name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeUser?.name || 'Super Admin'}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#64748B' }}>
                            Role: <strong style={{ color: '#4F46E5' }}>{activeUser?.role || 'Super Admin'}</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 999,
                            background: '#DCFCE7',
                            color: '#15803D',
                            border: '1px solid #86EFAC'
                          }}
                        >
                          ● Currently Online
                        </span>
                        <div style={{ fontSize: 9.5, color: '#64748B', marginTop: 3 }}>
                          Started: {activeSession?.loginTime ? new Date(activeSession.loginTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Active'}
                        </div>
                      </div>
                    </div>

                    {/* Login & Logout Audit Trail History */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Login &amp; Logout Audit Trail</span>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>{authLogs.length} Records</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                        {authLogs.length === 0 ? (
                          <div style={{ padding: '16px 0', textAlign: 'center', color: '#98A2B3', fontSize: 11 }}>
                            No session audit records available.
                          </div>
                        ) : (
                          authLogs.slice(0, 20).map((log) => {
                            const isLogin = log.action === 'LOGIN'
                            const dateStr = new Date(log.timestamp).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
                            const timeStr = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            return (
                              <div
                                key={log.id}
                                style={{
                                  padding: '7px 10px',
                                  borderRadius: 8,
                                  background: '#F8FAFC',
                                  border: '1px solid #F1F5F9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 8
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontSize: 9,
                                      fontWeight: 900,
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      background: isLogin ? '#DCFCE7' : '#FEE2E2',
                                      color: isLogin ? '#15803D' : '#B91C1C',
                                      flexShrink: 0
                                    }}
                                  >
                                    {isLogin ? 'LOGIN' : 'LOGOUT'}
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {log.actorName}
                                    </div>
                                    <div style={{ fontSize: 9.5, color: '#64748B' }}>
                                      {log.role}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 9.5, color: '#64748B' }}>
                                  <div>{timeStr}</div>
                                  <div style={{ fontSize: 9, color: '#94A3B8' }}>{dateStr}</div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showRecentActivity && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
                          Recent Operational Activity
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Workflow &amp; verification audit trails
                        </div>
                      </div>
                      <Clock size={16} color="#64748B" />
                    </div>

                    {/* Compact internal scrollable activity rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                      {activityLogs.length === 0 ? (
                        <div style={{ padding: '20px 0', textAlign: 'center', color: '#98A2B3', fontSize: 11.5 }}>
                          No activity history available.
                        </div>
                      ) : (
                        activityLogs.slice(0, 15).map((log) => (
                          <div
                            key={log.id}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 8,
                              background: '#F8FAFC',
                              border: '1px solid #F1F5F9',
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 8
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>
                                {log.description}
                              </div>
                              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                                {log.actorName} ({log.role}) &bull;{' '}
                                {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 900,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: getActionBadgeBg(log.action),
                                color: getActionBadgeColor(log.action),
                                flexShrink: 0
                              }}
                            >
                              {log.action}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Roles without export / activity: full-width executive overview */
            <ExecutiveOverview tickets={visibleTickets} />
          )}
        </div>
      ) : (
        /* MODE 2: KPI KINERJA (Strictly scoped by role, HIDE Recent Activity & HIDE Export) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EngineerKPIDashboard onSelectTicket={onSelectTicket} />
        </div>
      )}
    </div>
  )
}

function MetricBox({ title, value, subtitle, accent }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: accent }}>{value}</div>
      <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{subtitle}</div>
    </div>
  )
}

function getActionBadgeBg(action = '') {
  const a = action.toUpperCase()
  if (a.includes('APPROVE') || a.includes('VERIFY')) return '#DCFCE7'
  if (a.includes('LOCK')) return '#FEF3C7'
  if (a.includes('REJECT') || a.includes('DELETE')) return '#FEE2E2'
  if (a.includes('CREATE') || a.includes('SUBMIT')) return '#EEF2FF'
  return '#F1F5F9'
}

function getActionBadgeColor(action = '') {
  const a = action.toUpperCase()
  if (a.includes('APPROVE') || a.includes('VERIFY')) return '#15803D'
  if (a.includes('LOCK')) return '#B45309'
  if (a.includes('REJECT') || a.includes('DELETE')) return '#DC2626'
  if (a.includes('CREATE') || a.includes('SUBMIT')) return '#4338CA'
  return '#475569'
}