import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { useFosis } from '../../context/FosisContext'
import { normalizeRole, ROLES } from '../../utils/permissions'

const TITLES = {
  dashboard: [
    'Operations Dashboard',
    'FOSIS Field Operation Support & Information System'
  ],
  troubleshoot: [
    'TroubleShoot',
    'Incident & Network Outage'
  ],
  maintenance: [
    'Maintenance',
    'Preventive & Planned Maintenance'
  ],
  perijinan: [
    'Work Permits (SIK)',
    'Work Permit & Safety Compliance'
  ],
  administrasi: [
    'Administration',
    'Operational Reports & Logistics'
  ],
  workflow: [
    'Workflow',
    '4-Tier Workflow Approval'
  ],
  kendaraan: [
    'Fleet & Vehicles',
    'GPS & Operational Logbook'
  ],
  chat: [
    'Field Chat',
    'Field Team Coordination'
  ],
  users: [
    'Team Access',
    'User & Permission Management'
  ]
}

export default function TopBar({
  active,
  onNavigate,
  user,
  online,
  onToggleOnline,
  pendingSync,
  runningJobs = 0,
  runningJobsList = [],
  onSelectTicket,
  onMenu,
  sidebarCollapsed,
  onToggleSidebar
}) {
  const { tickets = [], vehicleLogs = [], activityLogs = [] } = useFosis()

  const [title, subtitle] = TITLES[active] || TITLES.dashboard

  const [showJobsPopover, setShowJobsPopover] = useState(false)
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false)

  const jobsRef = useRef(null)
  const notifRef = useRef(null)

  // Close dropdown popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (jobsRef.current && !jobsRef.current.contains(event.target)) {
        setShowJobsPopover(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotificationsPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // User role normalization
  const role = normalizeRole(user?.role)
  const isTeknisi = role === ROLES.TEKNISI
  const isIC = role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE
  const isAdmin = role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
  const isDeptHead = role === ROLES.DEPT_HEAD

  // Read notification state
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('fosis_read_notifications')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Dynamic real-time notification generator based on SRS workflow events
  const notifications = useMemo(() => {
    const list = []

    // 1. Revisions / Rejections from IC (Perlu Revisi JRR)
    tickets.forEach((t) => {
      const isRevisi =
        (t.workflowStatus || '').toLowerCase().includes('revisi') ||
        (t.workflowStatus || '').toLowerCase().includes('revision') ||
        (t.workflowStatus || '').toLowerCase().includes('ditolak') ||
        (t.workflowStatus || '').toLowerCase().includes('reject')
      if (isRevisi) {
        if (!isTeknisi || (user?.name && (t.engineerName || '').toLowerCase().includes(user.name.toLowerCase()))) {
          list.push({
            id: `notif-rev-${t.id}`,
            type: 'ticket',
            title: `Revision Required: ${t.ticketNo}`,
            message: t.revisionReason || t.notes || `Ticket "${t.title}" returned by IC Team Leader for corrections.`,
            timestamp: t.updatedAt || t.createdAt || Date.now() - 1800000,
            ticket: t,
            category: 'REVISION',
            badgeBg: '#FEE2E2',
            badgeColor: '#DC2626'
          })
        }
      }
    })

    // 2. New JRR / submitted tickets awaiting IC verification (Pending IC Verification)
    tickets.forEach((t) => {
      const norm = (t.workflowStatus || '').toUpperCase()
      const isPendingIC = norm.includes('MENUNGGU VERIFIKASI') || norm.includes('PENDING IC') || norm.includes('SUBMITTED')
      if (isPendingIC) {
        const tType = (t.type || '').toUpperCase()
        const isMatchIC =
          (role === ROLES.IC_TROUBLESHOOT && tType === 'TROUBLESHOOT') ||
          (role === ROLES.IC_MAINTENANCE && tType === 'MAINTENANCE') ||
          isAdmin ||
          isDeptHead

        if (isMatchIC) {
          list.push({
            id: `notif-ic-${t.id}`,
            type: 'ticket',
            title: `Pending IC Verification: ${t.ticketNo}`,
            message: `New JRR submitted by field engineer ${t.engineerName || 'Engineer'} (${t.siteLocationName || 'Site'}).`,
            timestamp: t.submittedAt || t.createdAt || Date.now() - 3600000,
            ticket: t,
            category: 'IC VERIFICATION',
            badgeBg: '#ECFDF5',
            badgeColor: '#059669'
          })
        }
      }
    })

    // 3. Level 1 Verified by IC awaiting Admin Lock (Pending Admin Approval)
    tickets.forEach((t) => {
      const norm = (t.workflowStatus || '').toUpperCase()
      const isPendingAdmin = norm.includes('VERIFIED_LEADER') || norm.includes('PENDING ADMIN') || norm.includes('MENUNGGU PENGESAHAN ADMIN') || t.verifiedBy
      if (isPendingAdmin && !t.locked) {
        if (isAdmin || isDeptHead) {
          list.push({
            id: `notif-admin-${t.id}`,
            type: 'ticket',
            title: `Pending Admin Approval: ${t.ticketNo}`,
            message: `Verified by IC (${t.verifiedBy || 'Team Leader'}). Pending Admin integrity lock.`,
            timestamp: t.verifiedAt || Date.now() - 5400000,
            ticket: t,
            category: 'ADMIN VALIDATION',
            badgeBg: '#FFFBEB',
            badgeColor: '#D97706'
          })
        }
      }
    })

    // 4. Locked final by FE Admin (Data integrity locked)
    tickets.forEach((t) => {
      if (
        t.locked ||
        (t.workflowStatus || '').toLowerCase().includes('disahkan admin') ||
        (t.workflowStatus || '').toLowerCase().includes('approved by admin') ||
        (t.workflowStatus || '').toLowerCase().includes('disahkan dept') ||
        (t.workflowStatus || '').toLowerCase().includes('approved by dept')
      ) {
        list.push({
          id: `notif-lock-${t.id}`,
          type: 'ticket',
          title: `Data Integrity Locked: ${t.ticketNo}`,
          message: `Operational report for ${t.title} authorized and locked by Admin Hub.`,
          timestamp: t.lockedAt || Date.now() - 7200000,
          ticket: t,
          category: 'LOCKED',
          badgeBg: '#EFF6FF',
          badgeColor: '#2563EB'
        })
      }
    })

    // 5. Vehicle / Fleet updates (Dispatch / Return / Scheduled Maintenance)
    vehicleLogs.forEach((v) => {
      const st = (v.statusArmada || '').toUpperCase()
      if (st === 'SERVICE' || st === 'PERLU SERVIS' || st === 'MAINTENANCE') {
        list.push({
          id: `notif-veh-${v.id}`,
          type: 'vehicle',
          title: `Fleet Service Due: ${v.platKendaraan}`,
          message: `${v.namaKendaraan || 'Vehicle'} (${v.tipeKendaraan || 'Fleet'}) scheduled for periodic maintenance.`,
          timestamp: v.serviceDate ? new Date(v.serviceDate).getTime() : Date.now() - 9000000,
          vehicle: v,
          category: 'FLEET',
          badgeBg: '#FEF3C7',
          badgeColor: '#B45309'
        })
      } else if (st === 'DIPINJAM' || st === 'BORROWED') {
        list.push({
          id: `notif-veh-borrow-${v.id}`,
          type: 'vehicle',
          title: `Fleet Dispatched: ${v.platKendaraan}`,
          message: `Currently dispatched to ${v.peminjamSaatIni || 'Field Engineer'}.`,
          timestamp: Date.now() - 10800000,
          vehicle: v,
          category: 'FLEET',
          badgeBg: '#F1F5F9',
          badgeColor: '#475569'
        })
      }
    })

    // Sort descending by timestamp
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 25)
  }, [tickets, vehicleLogs, role, user?.name, isTeknisi, isAdmin, isDeptHead])

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem('fosis_read_notifications', JSON.stringify(allIds))
    } catch (e) {
      console.warn(e)
    }
  }

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id]
      setReadIds(next)
      try {
        localStorage.setItem('fosis_read_notifications', JSON.stringify(next))
      } catch (e) {
        console.warn(e)
      }
    }
  }

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length

  return (
    <header className="topbar dashboard-topbar">
      {/* LEFT AREA */}
      <div className="topbar-left">
        <button
          className="icon-btn mobile-menu-btn"
          onClick={onMenu}
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>

        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? 'Buka sidebar' : 'Ciutkan sidebar'}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div className="topbar-heading">
          <div className="topbar-title">{title}</div>
          <div className="topbar-subtitle">{subtitle}</div>
        </div>
      </div>

      {/* CENTER STATUS: Clickable Running Jobs */}
      <div className="topbar-center" style={{ position: 'relative' }} ref={jobsRef}>
        <button
          type="button"
          className="header-info-pill"
          onClick={() => {
            setShowJobsPopover((prev) => !prev)
            setShowNotificationsPopover(false)
          }}
          title="Click to view active jobs"
          style={{
            cursor: 'pointer',
            border: showJobsPopover ? '1px solid #4F46E5' : '1px solid #C7D2FE',
            background: showJobsPopover ? '#EEF2FF' : '#FFFFFF',
            transition: 'all 0.15s ease'
          }}
        >
          <span className="header-pill-icon">
            <BriefcaseBusiness size={16} />
          </span>
          <span style={{ textAlign: 'left' }}>
            <small>RUNNING JOBS</small>
            <strong>{runningJobs} {runningJobs === 1 ? 'Job' : 'Jobs'}</strong>
          </span>
          <ChevronDown
            size={13}
            color="#64748B"
            style={{
              transform: showJobsPopover ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
              marginLeft: 2
            }}
          />
        </button>

        {/* RUNNING JOBS DROPDOWN POPOVER */}
        {showJobsPopover && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 'min(420px, 92vw)',
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Popover Header */}
            <div
              style={{
                padding: '12px 16px',
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BriefcaseBusiness size={16} color="#2563EB" />
                <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
                  Active Operational Jobs
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE'
                }}
              >
                {runningJobsList?.length || 0} Active
              </span>
            </div>

            {/* List of Running Jobs */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px' }}>
              {!runningJobsList || runningJobsList.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                  No active jobs running at the moment.
                </div>
              ) : (
                runningJobsList.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      onSelectTicket?.(job)
                      setShowJobsPopover(false)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #F1F5F9',
                      marginBottom: 6,
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F8FAFC'
                      e.currentTarget.style.borderColor = '#CBD5E1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF'
                      e.currentTarget.style.borderColor = '#F1F5F9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: '#2563EB' }}>
                        {job.ticketNo}
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE'
                        }}
                      >
                        {job.workflowStatus || 'Active'}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                      {job.title}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: 10,
                        color: '#64748B',
                        marginTop: 2
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <MapPin size={11} color="#94A3B8" /> {job.siteLocationName || '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <User size={11} color="#94A3B8" /> {job.engineerName || 'Field Engineer'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT AREA */}
      <div className="topbar-right">
        {/* Clickable Notification Button & Popover */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            type="button"
            className="notification-btn"
            aria-label="Notifikasi"
            onClick={() => {
              setShowNotificationsPopover((prev) => !prev)
              setShowJobsPopover(false)
            }}
            style={{
              cursor: 'pointer',
              background: showNotificationsPopover ? '#F1F5F9' : '#FFFFFF',
              borderColor: showNotificationsPopover ? '#94A3B8' : 'var(--outline-variant)'
            }}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="notification-dot">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATIONS DROPDOWN POPOVER */}
          {showNotificationsPopover && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 'min(380px, 92vw)',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18)',
                zIndex: 1000,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={16} color="#2563EB" />
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
                    Operational Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: '#DCFCE7',
                        color: '#15803D'
                      }}
                    >
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#2563EB',
                      fontSize: 10.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: '2px 6px'
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
                    No operational workflow notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isUnread = !readIds.includes(item.id)
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          markAsRead(item.id)
                          if (item.ticket) {
                            onSelectTicket?.(item.ticket)
                          } else if (item.type === 'vehicle') {
                            onNavigate?.('kendaraan')
                          }
                          setShowNotificationsPopover(false)
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: isUnread ? '1px solid #C7D2FE' : '1px solid #F1F5F9',
                          marginBottom: 5,
                          background: isUnread ? '#F8FAFC' : '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#EFF6FF'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isUnread ? '#F8FAFC' : '#FFFFFF'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 6,
                              marginBottom: 2
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 900,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: item.badgeBg,
                                color: item.badgeColor
                              }}
                            >
                              {item.category}
                            </span>
                            <span style={{ fontSize: 9, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={10} />
                              {new Date(item.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div style={{ fontSize: 11.5, fontWeight: isUnread ? 800 : 700, color: '#0F172A' }}>
                            {item.title}
                          </div>

                          <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 2, lineHeight: 1.35 }}>
                            {item.message}
                          </div>
                        </div>

                        {/* Unread indicator dot */}
                        {isUnread && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: '#2563EB',
                              marginTop: 6,
                              flexShrink: 0
                            }}
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <button type="button" className="header-profile">
          <div className="avatar">{user?.initials || 'U'}</div>
          <div className="header-profile-copy">
            <strong>{user?.name || '-'}</strong>
            <span>{user?.role || '-'}</span>
          </div>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  )
}