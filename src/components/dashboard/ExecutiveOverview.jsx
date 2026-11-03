import React, { useMemo } from 'react'
import {
  ClipboardCheck,
  Timer,
  Wrench,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  FileSpreadsheet
} from 'lucide-react'

export default function ExecutiveOverview({ tickets = [] }) {
  const totalTickets = tickets.length
  const troubleshootItems = useMemo(
    () => tickets.filter((it) => it.type === 'TROUBLESHOOT'),
    [tickets]
  )
  const inSlaCount = troubleshootItems.filter((it) => it.slaStatus === 'IN SLA').length
  const overSlaCount = troubleshootItems.filter((it) => it.slaStatus === 'OVER SLA').length

  const slaRatePercent = troubleshootItems.length > 0
    ? (inSlaCount * 100.0) / troubleshootItems.length
    : 0.0

  const overSlaRatePercent = troubleshootItems.length > 0
    ? (overSlaCount * 100.0) / troubleshootItems.length
    : 0.0

  const maintenanceItems = useMemo(
    () => tickets.filter((it) => it.type === 'MAINTENANCE'),
    [tickets]
  )
  const completedMaintenance = maintenanceItems.filter((it) => it.maintenanceStatus === 'DONE').length
  const mntRatePercent = maintenanceItems.length > 0
    ? (completedMaintenance * 100.0) / maintenanceItems.length
    : 0.0

  const adminItems = useMemo(
    () => tickets.filter((it) => it.type === 'ADMINISTRASI'),
    [tickets]
  )

  // Workload categories distribution
  const distribution = useMemo(() => {
    if (totalTickets === 0) {
      return [
        { label: 'Troubleshoot', count: 0, percent: 0, color: '#4B45F5' },
        { label: 'Maintenance', count: 0, percent: 0, color: '#2E90FA' },
        { label: 'Administrasi', count: 0, percent: 0, color: '#12B76A' }
      ]
    }
    return [
      {
        label: 'Troubleshoot',
        count: troubleshootItems.length,
        percent: Math.round((troubleshootItems.length * 100) / totalTickets),
        color: '#4B45F5'
      },
      {
        label: 'Maintenance',
        count: maintenanceItems.length,
        percent: Math.round((maintenanceItems.length * 100) / totalTickets),
        color: '#2E90FA'
      },
      {
        label: 'Administrasi',
        count: adminItems.length,
        percent: Math.round((adminItems.length * 100) / totalTickets),
        color: '#12B76A'
      }
    ]
  }, [totalTickets, troubleshootItems.length, maintenanceItems.length, adminItems.length])

  // Root cause breakdown
  const rootCauseGroups = useMemo(() => {
    if (troubleshootItems.length === 0) return []
    const map = {}
    troubleshootItems.forEach((t) => {
      const rc = t.rootCause || 'OTHER'
      map[rc] = (map[rc] || 0) + 1
    })
    return Object.entries(map)
      .map(([cause, count]) => ({
        cause,
        count,
        percent: (count * 100.0) / troubleshootItems.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [troubleshootItems])

  // Donut chart calculations (Circumference math)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const sweepOverFraction = troubleshootItems.length > 0 ? overSlaCount / troubleshootItems.length : 0
  const sweepInFraction = troubleshootItems.length > 0 ? inSlaCount / troubleshootItems.length : 0

  const overStrokeDash = sweepOverFraction * circumference
  const inStrokeDash = sweepInFraction * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 1. DISTRIBUTION WORKLOAD METRICS */}
      <div
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #E4E7EC',
          padding: '16px 18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#101828' }}>
              Operational Workload Distribution
            </div>
            <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
              Workload ratio compilation categorized by operational ticket type
            </div>
          </div>

          <span
            style={{
              borderRadius: 6,
              background: '#F9FAFB',
              border: '1px solid #E4E7EC',
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#344054'
            }}
          >
            {totalTickets} Total Tickets
          </span>
        </div>

        {totalTickets === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#98A2B3', fontSize: 12 }}>
            No operational ticket records found.
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                alignItems: 'flex-end',
                height: 56,
                marginTop: 8
              }}
            >
              {distribution.map(({ label, count, percent, color }) => {
                const fraction = Math.max(0.2, Math.min(1, percent / 100))
                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#344054', marginBottom: 4 }}>
                      {percent}% ({count})
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.round(36 * fraction)}px`,
                        borderRadius: '4px 4px 0 0',
                        background: color
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginTop: 6,
                textAlign: 'center'
              }}
            >
              {distribution.map(({ label }) => (
                <div key={label} style={{ fontSize: 11, fontWeight: 700, color: '#475467' }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. OPERATIONAL SLA & ROOT CAUSE SECTION */}
      <div
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #E4E7EC',
          padding: '16px 18px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#101828' }}>
              SLA Compliance Analysis
            </div>
            <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
              Incident handling turnaround and SLA adherence
            </div>
          </div>

          <span
            style={{
              borderRadius: 6,
              background: slaRatePercent >= 80 ? '#ECFDF3' : '#FEF3F2',
              color: slaRatePercent >= 80 ? '#12B76A' : '#F04438',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 8px'
            }}
          >
            {slaRatePercent.toFixed(1)}% IN SLA
          </span>
        </div>

        {/* Donut Chart and Breakdown Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(120px, 140px) 1fr',
            gap: 20,
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto' }}>
            <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#F2F4F7"
                strokeWidth="12"
              />
              {sweepInFraction > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#4B45F5"
                  strokeWidth="12"
                  strokeDasharray={`${inStrokeDash} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
              )}
              {sweepOverFraction > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#F04438"
                  strokeWidth="12"
                  strokeDasharray={`${overStrokeDash} ${circumference}`}
                  strokeDashoffset={-inStrokeDash}
                  strokeLinecap="round"
                />
              )}
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: slaRatePercent >= 80 || troubleshootItems.length === 0 ? '#4B45F5' : '#F04438'
                }}
              >
                {slaRatePercent.toFixed(1)}%
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#667085' }}>
                IN SLA
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DiagramPercentageItem
              label="In SLA"
              percentage={`${slaRatePercent.toFixed(1)}%`}
              countText={`${inSlaCount} Tickets`}
              color="#4B45F5"
            />
            <DiagramPercentageItem
              label="Over SLA"
              percentage={`${overSlaRatePercent.toFixed(1)}%`}
              countText={`${overSlaCount} Tickets`}
              color="#F04438"
            />
            <DiagramPercentageItem
              label="Maintenance Completed"
              percentage={`${mntRatePercent.toFixed(1)}%`}
              countText={`${completedMaintenance}/${maintenanceItems.length} Activities`}
              color="#2E90FA"
            />
          </div>
        </div>

        {/* Root Cause breakdown */}
        {troubleshootItems.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #F2F4F7' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#101828', marginBottom: 10 }}>
              Root Cause Breakdown
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rootCauseGroups.map(({ cause, count, percent }) => (
                <div key={cause}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#344054' }}>{cause}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#4B45F5' }}>
                      {percent.toFixed(1)}% ({count})
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      background: '#F2F4F7',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(5, percent))}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: '#4B45F5'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DiagramPercentageItem({ label, percentage, countText, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 10px',
        borderRadius: 8,
        background: '#F9FAFB',
        border: '1px solid #F2F4F7'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color
          }}
        />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#101828' }}>{label}</div>
          <div style={{ fontSize: 10, color: '#667085' }}>{countText}</div>
        </div>
      </div>

      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          color: color,
          background: `${color}15`,
          padding: '2px 6px',
          borderRadius: 4
        }}
      >
        {percentage}
      </span>
    </div>
  )
}