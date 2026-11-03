import React, { useMemo, useState } from 'react'
import {
  Users,
  Search,
  CheckCircle2,
  TrendingUp,
  Award,
  Filter,
  X,
  ExternalLink,
  ChevronRight,
  Briefcase
} from 'lucide-react'
import KPICard from './KPICard'
import { useFosis } from '../../context/FosisContext'
import { normalizeRole, ROLES, getPersonalTickets } from '../../utils/permissions'

export default function EngineerKPIDashboard({ onSelectTicket }) {
  const { tickets, users, activeUser } = useFosis()

  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [selectedEngineerDetail, setSelectedEngineerDetail] = useState(null)

  const activeUserRole = normalizeRole(activeUser?.role)
  const isTeknisi = activeUserRole === ROLES.TEKNISI
  const isIC = activeUserRole === ROLES.IC_TROUBLESHOOT || activeUserRole === ROLES.IC_MAINTENANCE
  const isAdmin = activeUserRole === ROLES.ADMIN
  const isDeptHead = activeUserRole === ROLES.DEPT_HEAD

  // Compute dynamic KPI metrics per engineer based on real tickets in central store
  const engineerMetrics = useMemo(() => {
    const engMap = {}

    // Initialize from users list
    users.forEach((u) => {
      engMap[u.name] = {
        name: u.name,
        role: u.role,
        region: u.region || u.role,
        email: u.email,
        phone: u.phone,
        troubleshootCount: 0,
        maintenanceCount: 0,
        adminCount: 0,
        totalTickets: 0,
        inSlaCount: 0,
        doneCount: 0,
        tickets: []
      }
    })

    // Aggregate tickets
    tickets.forEach((t) => {
      const engName = t.engineerName || t.pic
      if (!engName) return

      if (!engMap[engName]) {
        engMap[engName] = {
          name: engName,
          role: 'Field Engineer',
          region: 'Operations',
          email: `${engName.toLowerCase().replace(/\s+/g, '.')}@fosis-ops.id`,
          phone: '+6281200000000',
          troubleshootCount: 0,
          maintenanceCount: 0,
          adminCount: 0,
          totalTickets: 0,
          inSlaCount: 0,
          doneCount: 0,
          tickets: []
        }
      }

      const eng = engMap[engName]

      if (monthFilter !== 'ALL' && t.bulan !== monthFilter) return

      eng.totalTickets += 1
      eng.tickets.push(t)

      if (t.type === 'TROUBLESHOOT') {
        eng.troubleshootCount += 1
        if (t.slaStatus === 'IN SLA') eng.inSlaCount += 1
      } else if (t.type === 'MAINTENANCE') {
        eng.maintenanceCount += 1
        if (t.maintenanceStatus === 'DONE') eng.doneCount += 1
      } else if (t.type === 'ADMINISTRASI') {
        eng.adminCount += 1
        if (t.adminStatus === 'DONE') eng.doneCount += 1
      }
    })

    return Object.values(engMap).map((e) => {
      const slaRate =
        e.troubleshootCount > 0
          ? Math.round((e.inSlaCount / e.troubleshootCount) * 100)
          : e.totalTickets > 0
          ? 100
          : 0

      const resolutionRate =
        e.totalTickets > 0
          ? Math.round(((e.inSlaCount + e.doneCount) / e.totalTickets) * 100)
          : 0

      return {
        ...e,
        slaRate,
        resolutionRate
      }
    })
  }, [tickets, users, monthFilter])

  // Filtered list based on role:
  // - Teknisi: ONLY personal activeUser
  // - IC: personal activeUser by default
  // - Admin: personal/admin workload by default
  // - Dept Head: management aggregate (can see engineers list)
  const filteredEngineers = useMemo(() => {
    let list = engineerMetrics

    if (isTeknisi || isIC) {
      const activeName = (activeUser?.name || '').trim().toLowerCase()
      const activeEmail = (activeUser?.email || '').trim().toLowerCase()
      list = list.filter(
        (eng) =>
          eng.name.trim().toLowerCase() === activeName ||
          (activeEmail && eng.email.trim().toLowerCase() === activeEmail)
      )
    }

    return list.filter((eng) => {
      if (moduleFilter === 'TROUBLESHOOT' && eng.troubleshootCount === 0) return false
      if (moduleFilter === 'MAINTENANCE' && eng.maintenanceCount === 0) return false
      if (moduleFilter === 'ADMINISTRASI' && eng.adminCount === 0) return false

      if (!search) return true
      const q = search.toLowerCase()
      return (
        eng.name.toLowerCase().includes(q) ||
        eng.email.toLowerCase().includes(q) ||
        eng.role.toLowerCase().includes(q)
      )
    })
  }, [engineerMetrics, search, moduleFilter, activeUser, isTeknisi, isIC])

  // Personal metrics for personal view (Teknisi & IC & Admin personal)
  const personalTickets = useMemo(() => {
    return getPersonalTickets(activeUser, tickets)
  }, [activeUser, tickets])

  const personalTroubleshoot = personalTickets.filter((t) => t.type === 'TROUBLESHOOT')
  const personalMaintenance = personalTickets.filter((t) => t.type === 'MAINTENANCE')
  const personalAdmin = personalTickets.filter((t) => t.type === 'ADMINISTRASI')
  const personalInSla = personalTroubleshoot.filter((t) => t.slaStatus === 'IN SLA').length
  const personalSlaRate = personalTroubleshoot.length > 0 ? Math.round((personalInSla / personalTroubleshoot.length) * 100) : 100
  const personalResolved = personalTickets.filter(
    (t) => t.slaStatus === 'IN SLA' || t.maintenanceStatus === 'DONE' || t.adminStatus === 'DONE'
  ).length
  const personalResolutionRate = personalTickets.length > 0 ? Math.round((personalResolved / personalTickets.length) * 100) : 0

  // Dept Head / Global aggregate statistics
  const totalPersonel = engineerMetrics.length
  const avgSla =
    engineerMetrics.length > 0
      ? Math.round(
          engineerMetrics.reduce((acc, curr) => acc + curr.slaRate, 0) /
            engineerMetrics.length
        )
      : 0

  const topResolver = useMemo(() => {
    if (!engineerMetrics.length) return '-'
    const sorted = [...engineerMetrics].sort((a, b) => b.totalTickets - a.totalTickets)
    return sorted[0]?.name || '-'
  }, [engineerMetrics])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI HEADER METRICS CARDS */}
      {isTeknisi || isIC ? (
        /* PERSONAL KPI CARDS (Field Engineer / IC) - strictly activeUser data, NO total personnel / global ranking */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          <KPICard
            title="My Assigned Tasks"
            value={String(personalTickets.length)}
            indicator="Assigned Tickets"
          />
          <KPICard
            title="Personal SLA Compliance"
            value={`${personalSlaRate}%`}
            indicator={`${personalInSla}/${personalTroubleshoot.length || personalTickets.length} IN SLA`}
          />
          <KPICard
            title="Resolution Rate"
            value={`${personalResolutionRate}%`}
            indicator={`${personalResolved} Tasks Completed`}
          />
          <KPICard
            title="Maintenance Completed"
            value={String(personalMaintenance.filter((t) => t.maintenanceStatus === 'DONE').length)}
            indicator={`Out of ${personalMaintenance.length} Preventive`}
          />
        </div>
      ) : isDeptHead ? (
        /* DEPT HEAD / MANAGEMENT AGGREGATE KPI */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          <KPICard title="Total Field Personnel" value={String(totalPersonel)} indicator="Registered Staff" />
          <KPICard title="Regional Average SLA" value={`${avgSla}%`} indicator="Resolution Compliance" />
          <KPICard title="Top Resolver" value={topResolver} indicator="Most Tickets Resolved" />
          <KPICard
            title="Total Operational Tickets"
            value={String(tickets.length)}
            indicator="All Regional Hubs"
          />
        </div>
      ) : (
        /* ADMIN KPI - fokus admin workload & personal task */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          <KPICard
            title="Administrative Workload"
            value={String(tickets.filter((t) => t.type === 'ADMINISTRASI').length)}
            indicator="Total Records"
          />
          <KPICard
            title="Locked Tickets"
            value={String(tickets.filter((t) => t.locked || t.isLocked).length)}
            indicator="Integrity Locked"
          />
          <KPICard
            title="Pending Validation"
            value={String(tickets.filter((t) => (t.workflowStatus || '').toLowerCase().includes('verif') || (t.workflowStatus || '').toLowerCase().includes('pending')).length)}
            indicator="Lock Queue"
          />
          <KPICard
            title="Total System Tickets"
            value={String(tickets.length)}
            indicator="Central Database"
          />
        </div>
      )}

      {/* FILTER TOOLBAR: Only show for Dept Head or Admin if viewing multi-engineer, or compact for personal */}
      <div
        style={{
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #E4E7EC',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px' }}>
          {(isDeptHead || isAdmin) && (
            <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#98A2B3'
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or role..."
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 12px 0 32px',
                  borderRadius: 8,
                  border: '1px solid #D0D5DD',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
            </div>
          )}

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              height: 36,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #D0D5DD',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer',
              background: '#FFFFFF'
            }}
          >
            <option value="ALL">All Modules</option>
            <option value="TROUBLESHOOT">Troubleshoot</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ADMINISTRASI">Administration</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{
              height: 36,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid #D0D5DD',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer',
              background: '#FFFFFF'
            }}
          >
            <option value="ALL">All Months</option>
            {[
              'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
              'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
            ].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 11.5, color: '#667085', fontWeight: 600 }}>
          {isTeknisi || isIC
            ? `Personal View: ${activeUser?.name || 'User'}`
            : `Displaying ${filteredEngineers.length} personnel`}
        </div>
      </div>

      {/* KPI TABLE */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E4E7EC',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E4E7EC' }}>
              <tr>
                <th style={thStyle}>PERSONNEL</th>
                <th style={thStyle}>ROLE</th>
                <th style={thStyle}>TOTAL TICKETS</th>
                <th style={thStyle}>TROUBLESHOOT</th>
                <th style={thStyle}>MAINTENANCE</th>
                <th style={thStyle}>ADMINISTRATION</th>
                <th style={thStyle}>SLA RATE</th>
                <th style={thStyle}>RESOLUTION</th>
                <th style={thStyle}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEngineers.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#98A2B3' }}>
                    No matching performance records found.
                  </td>
                </tr>
              ) : (
                filteredEngineers.map((eng) => (
                  <tr
                    key={eng.name}
                    onClick={() => setSelectedEngineerDetail(eng)}
                    style={{
                      borderBottom: '1px solid #F2F4F7',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                  >
                    <td style={tdStyle}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#101828' }}>{eng.name}</div>
                        <div style={{ fontSize: 11, color: '#667085' }}>{eng.email}</div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: '#EEF2FF',
                          color: '#4B45F5'
                        }}
                      >
                        {eng.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <strong style={{ fontSize: 13, color: '#101828' }}>{eng.totalTickets}</strong>
                    </td>
                    <td style={tdStyle}>{eng.troubleshootCount}</td>
                    <td style={tdStyle}>{eng.maintenanceCount}</td>
                    <td style={tdStyle}>{eng.adminCount}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: eng.slaRate >= 80 ? '#12B76A' : '#F79009'
                        }}
                      >
                        {eng.slaRate}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: eng.resolutionRate >= 75 ? '#12B76A' : '#475467'
                        }}
                      >
                        {eng.resolutionRate}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEngineerDetail(eng)
                        }}
                        style={{
                          border: '1px solid #D0D5DD',
                          background: '#FFFFFF',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#4B45F5',
                          cursor: 'pointer'
                        }}
                      >
                        View Tickets
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineer Performance Detail Modal */}
      {selectedEngineerDetail && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEngineerDetail(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 24, 40, 0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 16,
            backdropFilter: 'blur(3px)'
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(640px, 95vw)',
              maxHeight: '85vh',
              background: '#FFFFFF',
              borderRadius: 14,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid #E4E7EC',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E4E7EC',
                background: '#F9FAFB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#101828' }}>
                  Performance Details: {selectedEngineerDetail.name}
                </h3>
                <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                  {selectedEngineerDetail.role} &bull; {selectedEngineerDetail.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEngineerDetail(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667085',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10
                }}
              >
                <div style={{ background: '#F9FAFB', border: '1px solid #E4E7EC', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Total Tickets</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#101828', marginTop: 2 }}>
                    {selectedEngineerDetail.totalTickets}
                  </div>
                </div>
                <div style={{ background: '#ECFDF3', border: '1px solid #A6F4C5', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#039855', fontWeight: 600 }}>SLA Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#039855', marginTop: 2 }}>
                    {selectedEngineerDetail.slaRate}%
                  </div>
                </div>
                <div style={{ background: '#FFFAEB', border: '1px solid #FEDF89', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#B54708', fontWeight: 600 }}>Resolution</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#B54708', marginTop: 2 }}>
                    {selectedEngineerDetail.resolutionRate}%
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#101828', margin: '0 0 8px 0' }}>
                  Assigned Tickets ({selectedEngineerDetail.tickets.length})
                </h4>
                {selectedEngineerDetail.tickets.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: '#98A2B3', padding: '16px 0', textAlign: 'center' }}>
                    No tickets assigned to this personnel yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedEngineerDetail.tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedEngineerDetail(null)
                          onSelectTicket?.(t)
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #E4E7EC',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#4B45F5' }}>
                              {t.ticketNo}
                            </span>
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 700,
                                background: '#F2F4F7',
                                color: '#344054',
                                padding: '1px 5px',
                                borderRadius: 4
                              }}
                            >
                              {t.type}
                            </span>
                          </div>
                          <div style={{ fontSize: 11.5, color: '#344054', marginTop: 2 }}>{t.title}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#667085' }}>{t.workflowStatus}</span>
                          <ChevronRight size={14} color="#98A2B3" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = {
  padding: '10px 14px',
  fontWeight: 700,
  fontSize: 11,
  color: '#475467',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '10px 14px',
  whiteSpace: 'nowrap'
}