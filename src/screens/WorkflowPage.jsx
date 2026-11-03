import React, { useState, useMemo } from 'react'
import {
  GitFork,
  CheckCircle2,
  Lock,
  Unlock,
  Send,
  Eye,
  Pencil,
  Check,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  User,
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle,
  FileText,
  XCircle,
  X
} from 'lucide-react'
import { useFosis } from '../context/FosisContext'
import { useToast } from '../context/ToastContext'
import { canEditTicket, normalizeRole, ROLES } from '../utils/permissions'

// Normalisasi status alur kerja
function normalizeWorkflowStatus(status = '') {
  const s = status.toLowerCase()
  if (s.includes('draft')) return 'DRAFT'
  if (s.includes('ic') || s.includes('submitted')) return 'SUBMITTED_TEKNISI'
  if (s.includes('leader') || s.includes('verified')) return 'VERIFIED_LEADER'
  if (s.includes('kunci') || s.includes('locked')) return 'LOCKED_ADMIN'
  if (s.includes('head') || s.includes('sah') || s.includes('approved')) return 'APPROVED_DEPT_HEAD'
  return 'DRAFT'
}

export default function WorkflowPage({
  tickets = [],
  activeUser,
  user,
  onSelectItem,
  onEditItem,
  onSubmitTeknisi,
  onVerifyLeader,
  onToggleLockAdmin,
  onApproveDeptHead
}) {
  const { permissions, rejectByDeptHead, returnForRevisionByIC, verifyByIC } = useFosis()
  const { success, warning, error, info } = useToast()

  const currentUser = activeUser || user
  const userRole = currentUser?.role || 'Admin'

  const [selectedTier, setSelectedTier] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectDialogItem, setRejectDialogItem] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const role = normalizeRole(userRole)
  const isTeknisi = role === ROLES.TEKNISI
  const isIC = role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE

  // Filter out ADMINISTRASI tickets for Teknisi and IC
  const visibleWorkflowTickets = useMemo(() => {
    if (isTeknisi || isIC) {
      return tickets.filter((t) => (t.type || '').toUpperCase() !== 'ADMINISTRASI')
    }
    return tickets
  }, [tickets, isTeknisi, isIC])

  // Tier 1: Draft || Menunggu Verifikasi IC (Belum disubmit ke IC) || Ditolak IC
  const tier1Items = useMemo(
    () =>
      visibleWorkflowTickets.filter((it) => {
        const norm = normalizeWorkflowStatus(it.workflowStatus)
        // If not submitted to IC, or draft/revision, it belongs to Tier 1
        return norm === 'DRAFT' || it.submittedToIC === false || it.workflowStatus === 'Draft Teknisi'
      }),
    [visibleWorkflowTickets]
  )

  // Tier 2: Menunggu Verifikasi IC (Sudah disubmit ke IC)
  // Unified Workflow: IC SO hanya melihat TroubleShoot, IC SM hanya melihat Maintenance
  const tier2Items = useMemo(
    () =>
      visibleWorkflowTickets.filter((it) => {
        const norm = normalizeWorkflowStatus(it.workflowStatus)
        // Must be in IC stage and not unsubmitted
        const isPendingIC = norm === 'SUBMITTED_TEKNISI' && it.submittedToIC !== false
        if (!isPendingIC) return false

        const ticketType = (it.type || '').toUpperCase()
        if (role === ROLES.IC_TROUBLESHOOT) {
          return ticketType === 'TROUBLESHOOT'
        }
        if (role === ROLES.IC_MAINTENANCE) {
          return ticketType === 'MAINTENANCE'
        }
        return true
      }),
    [visibleWorkflowTickets, role]
  )

  // Tier 3: Verified Leader || Locked Admin
  const tier3Items = useMemo(
    () =>
      visibleWorkflowTickets.filter((it) => {
        const norm = normalizeWorkflowStatus(it.workflowStatus)
        return norm === 'VERIFIED_LEADER' || norm === 'LOCKED_ADMIN'
      }),
    [visibleWorkflowTickets]
  )

  // Tier 4: Locked Admin || Approved Dept Head
  const tier4Items = useMemo(
    () =>
      visibleWorkflowTickets.filter((it) => {
        const norm = normalizeWorkflowStatus(it.workflowStatus)
        return norm === 'LOCKED_ADMIN' || norm === 'APPROVED_DEPT_HEAD'
      }),
    [visibleWorkflowTickets]
  )

  const currentTierItems = useMemo(() => {
    // When Teknisi, tiers > 1 return empty
    if (isTeknisi && selectedTier > 1) {
      return []
    }
    if (isIC && selectedTier > 2) {
      return []
    }

    let list = []
    switch (selectedTier) {
      case 1:
        list = tier1Items
        break
      case 2:
        list = tier2Items
        break
      case 3:
        list = tier3Items
        break
      default:
        list = tier4Items
        break
    }

    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (item) =>
        (item.ticketNo && item.ticketNo.toLowerCase().includes(q)) ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.siteLocationName && item.siteLocationName.toLowerCase().includes(q)) ||
        (item.engineerName && item.engineerName.toLowerCase().includes(q))
    )
  }, [selectedTier, tier1Items, tier2Items, tier3Items, tier4Items, searchQuery, isTeknisi, isIC])

  const tierMeta = [
    {
      index: 1,
      title: 'Field Engineer',
      shortTitle: '1. Field Engineer',
      count: tier1Items.length,
      desc: 'Field operational work tickets submitted to verification pipeline',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '#BFDBFE',
      isLockedForUser: false
    },
    {
      index: 2,
      title: 'IC / Team Leader',
      shortTitle: '2. IC Team',
      count: isTeknisi ? 0 : tier2Items.length,
      desc: 'Technical specification validation & verification prior to Admin review',
      color: '#10B981',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      isLockedForUser: isTeknisi
    },
    {
      index: 3,
      title: 'Admin Operation Hub',
      shortTitle: '3. Admin Hub',
      count: isTeknisi || isIC ? 0 : tier3Items.length,
      desc: 'Data integrity locking and document completeness authorization',
      color: '#D97706',
      bg: '#FFFBEB',
      border: '#FDE68A',
      isLockedForUser: isTeknisi || isIC
    },
    {
      index: 4,
      title: 'Department Head Management',
      shortTitle: '4. Dept Head',
      count: isTeknisi || isIC ? 0 : tier4Items.length,
      desc: 'Executive authorization approval and official operational archiving',
      color: '#7C3AED',
      bg: '#F5F3FF',
      border: '#DDD6FE',
      isLockedForUser: isTeknisi || isIC
    }
  ]

  const activeMeta = tierMeta.find((t) => t.index === selectedTier)

  return (
    <div className="page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(6px)'
          }}
        >
          <CheckCircle2 size={16} color="#4ADE80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Alur Kerja & Verifikasi Card (Sesuai Jetpack Compose) */}
      <div
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
          border: '1px solid #E2E8F0',
          padding: '18px 22px',
          boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: '#2563EB',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)',
              flexShrink: 0
            }}
          >
            <GitFork size={24} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Alur Kerja &amp; Verifikasi Sistem</span>
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
                4-Tier Pipeline
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
              Role Anda Saat Ini: <strong style={{ color: '#2563EB' }}>{userRole}</strong> ({currentUser?.name || 'Sanderlina Imelda'})
            </div>
          </div>
        </div>

        {/* Step Indicator Badges (Mini visual pipeline) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '6px 10px',
            fontSize: 11,
            color: '#475569',
            fontWeight: 700
          }}
          className="desktop-pipeline-pill"
        >
          <span>Field Engineer</span>
          <ArrowRight size={12} color="#94A3B8" />
          <span>IC Team</span>
          <ArrowRight size={12} color="#94A3B8" />
          <span>Admin Hub</span>
          <ArrowRight size={12} color="#94A3B8" />
          <span style={{ color: '#7C3AED' }}>Dept Head</span>
        </div>
      </div>

      {/* Segmented Button Tier Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 6,
          background: '#E2E8F0',
          padding: '5px',
          borderRadius: 14
        }}
      >
        {tierMeta.map((t) => {
          const isSelected = selectedTier === t.index
          const isLockedTab = t.isLockedForUser
          return (
            <button
              key={t.index}
              type="button"
              disabled={isLockedTab}
              onClick={() => {
                if (isLockedTab) {
                  showToast('Access to this stage is restricted to verifiers and authorizers.')
                  return
                }
                setSelectedTier(t.index)
              }}
              style={{
                borderRadius: 10,
                border: 'none',
                background: isSelected ? '#FFFFFF' : 'transparent',
                color: isLockedTab ? '#94A3B8' : isSelected ? t.color : '#475569',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: isSelected ? 800 : 600,
                cursor: isLockedTab ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                opacity: isLockedTab ? 0.65 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              {isLockedTab && <Lock size={12} style={{ color: '#94A3B8' }} />}
              <span>{t.shortTitle}</span>
              {!isLockedTab && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: isSelected ? t.bg : '#CBD5E1',
                    color: isSelected ? t.color : '#334155'
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active Stage Description & Search */}
      <div
        style={{
          borderRadius: 14,
          background: activeMeta?.bg || '#F8FAFC',
          border: `1px solid ${activeMeta?.border || '#E2E8F0'}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: activeMeta?.color || '#0F172A' }}>
            Stage: {activeMeta?.title} ({activeMeta?.count} Tickets)
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
            {activeMeta?.desc}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: 'min(300px, 100%)' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket, field engineer, or location..."
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: 12,
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content Area: Ticket List or Empty State */}
      {currentTierItems.length === 0 ? (
        <div
          style={{
            flex: 1,
            minHeight: 280,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 18,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            textAlign: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#F1F5F9',
              color: '#94A3B8',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <GitFork size={24} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
            No tickets in this stage
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', maxWidth: 360 }}>
            All tasks in {activeMeta?.shortTitle} have been processed or are awaiting action from previous stages.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentTierItems.map((item) => (
            <WorkflowItemCard
              key={item.id}
              item={item}
              selectedTier={selectedTier}
              onClick={() => onSelectItem && onSelectItem(item)}
              onEdit={() => onEditItem && onEditItem(item)}
              currentUser={currentUser}
              onSubmitTeknisi={() => {
                if (onSubmitTeknisi) onSubmitTeknisi(item)
                showToast(`Ticket ${item.ticketNo} submitted to IC Team!`)
              }}
              onVerifyLeader={() => {
                if (onVerifyLeader) {
                  onVerifyLeader(item)
                } else {
                  verifyByIC(item.id)
                }
                showToast(`Ticket ${item.ticketNo} verified & forwarded to Admin!`)
              }}
              onRejectIC={() => {
                setRejectDialogItem(item)
                setRejectionReason('')
              }}
              onToggleLockAdmin={() => {
                if (onToggleLockAdmin) onToggleLockAdmin(item)
                showToast(
                  item.locked
                    ? `Integrity lock on ${item.ticketNo} unlocked!`
                    : `Ticket ${item.ticketNo} data integrity locked!`
                )
              }}
              onApproveDeptHead={() => {
                if (onApproveDeptHead) {
                  onApproveDeptHead(item, 'Approved in workflow review.')
                }
                showToast(`Ticket ${item.ticketNo} authorized by Department Head!`)
              }}
              onRejectDeptHead={() => {
                setRejectDialogItem(item)
                setRejectionReason('')
              }}
              permissions={permissions}
            />
          ))}
        </div>
      )}

      {/* Reject Modal Dialog for Dept Head / IC */}
      {rejectDialogItem && (
        <div
          className="modal-backdrop"
          onClick={() => setRejectDialogItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(460px, 94vw)',
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #CBD5E1',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>
                Return Ticket for Revision ({rejectDialogItem.ticketNo})
              </div>
              <button
                type="button"
                onClick={() => setRejectDialogItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#475569' }}>
              Provide the revision reason so the field engineer can correct and resubmit the report.
            </div>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. OTDR report attachment incomplete, site coordinates require verification..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setRejectDialogItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    warning('Rejection/revision reason is required.')
                    return
                  }
                  if (selectedTier === 2 || (rejectDialogItem.workflowStatus || '').toLowerCase().includes('ic') || (rejectDialogItem.workflowStatus || '').toLowerCase().includes('submitted')) {
                    returnForRevisionByIC(rejectDialogItem.id, rejectionReason.trim())
                    showToast(`Ticket ${rejectDialogItem.ticketNo} returned to field engineer for revision!`)
                  } else {
                    rejectByDeptHead(rejectDialogItem.id, rejectionReason.trim())
                    showToast(`Ticket ${rejectDialogItem.ticketNo} returned for revision by Dept Head!`)
                  }
                  setRejectDialogItem(null)
                  setRejectionReason('')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: rejectionReason.trim() ? '#DC2626' : '#E2E8F0',
                  color: rejectionReason.trim() ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Reject &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkflowItemCard({
  item,
  selectedTier,
  onClick,
  onEdit,
  currentUser,
  onSubmitTeknisi,
  onVerifyLeader,
  onRejectIC,
  onToggleLockAdmin,
  onApproveDeptHead,
  onRejectDeptHead,
  permissions
}) {
  const isLocked = item.locked || item.isLocked
  const normStatus = normalizeWorkflowStatus(item.workflowStatus)
  const canEdit = canEditTicket(currentUser, item)

  const isRejected = (item.workflowStatus || '').toLowerCase().includes('ditolak') || (item.workflowStatus || '').toLowerCase().includes('revisi')
  const isCompleted = (item.workflowStatus || '').toLowerCase().includes('disahkan') || (item.workflowStatus || '').toLowerCase().includes('selesai') || isLocked

  let cardBorder = isRejected ? '#EF4444' : isCompleted ? '#86EFAC' : '#E2E8F0'
  let cardBg = isRejected ? '#FEF2F2' : isCompleted ? '#F0FDF4' : '#FFFFFF'

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 14,
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        padding: '14px 16px',
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isRejected ? '#DC2626' : '#CBD5E1'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = cardBorder
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top Row: Ticket No & Status Surface Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 800,
            color: isRejected ? '#DC2626' : '#2563EB',
            letterSpacing: '0.2px'
          }}
        >
          {item.ticketNo}
        </span>

        <span
          style={{
            borderRadius: 10,
            padding: '3px 9px',
            fontSize: 10.5,
            fontWeight: 800,
            background: isRejected ? '#FEE2E2' : isCompleted ? '#DCFCE7' : '#EFF6FF',
            color: isRejected ? '#DC2626' : isCompleted ? '#166534' : '#1D4ED8',
            border: `1px solid ${isRejected ? '#FCA5A5' : isCompleted ? '#86EFAC' : '#BFDBFE'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {isLocked && <Lock size={10} />}
          <span>{item.workflowStatus}</span>
        </span>
      </div>

      {/* Ticket Title */}
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: '#0F172A',
          marginTop: 6
        }}
      >
        {item.title}
      </div>

      {/* Location & PIC Engineer Info */}
      <div
        style={{
          fontSize: 11.5,
          color: '#64748B',
          marginTop: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap'
        }}
      >
        <span>📍 {item.siteLocationName || item.site || '-'}</span>
        <span>•</span>
        <span>PIC : {item.engineerName || item.pic || 'Field Engineer'}</span>
      </div>

      {/* IC Rejection Notes if present */}
      {isRejected && (item.revisionReason || item.notes) && (
        <div
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: '#FFFFFF',
            border: '1px solid #FCA5A5',
            color: '#B91C1C',
            fontSize: 11
          }}
        >
          <strong>⚠️ IC Rejection Note:</strong> {item.revisionReason || item.notes}
        </div>
      )}

      {/* Action Toolbar Row with STRICT RBAC check */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tier 1: View (Eye) dan Edit (Pencil) */}
        {selectedTier === 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={onClick}
              title="View Details (Read-Only)"
              style={{
                background: '#F1F5F9',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <Eye size={13} />
              <span>View</span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                title="Edit Ticket"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Pencil size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Tier 2: IC WORKFLOW CARD ACTION BUTTONS */}
        {selectedTier === 2 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClick}
              title="View Full Details (Input &amp; Output)"
              style={{
                background: '#F8FAFC',
                color: '#334155',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#E2E8F0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#F8FAFC'
              }}
            >
              <Eye size={13} />
              <span>View</span>
            </button>

            {/* Reject Verification button */}
            {permissions?.canVerifyTicket(item) && (
              <button
                type="button"
                onClick={onRejectIC}
                title="Reject Verification &amp; Request Revision"
                style={{
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: '1px solid #FCA5A5',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#DC2626'
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.borderColor = '#DC2626'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FEF2F2'
                  e.currentTarget.style.color = '#DC2626'
                  e.currentTarget.style.borderColor = '#FCA5A5'
                }}
              >
                <XCircle size={13} />
                <span>Reject for Revision</span>
              </button>
            )}

            {/* Verify & Forward to Admin button */}
            {permissions?.canVerifyTicket(item) && (
              <button
                type="button"
                onClick={onVerifyLeader}
                title="Verify and Forward to Admin Hub"
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1D4ED8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563EB'
                }}
              >
                <Check size={14} />
                <span>Verify &amp; Forward to Admin</span>
              </button>
            )}
          </div>
        )}

        {/* Tier 3: ADMIN LOCK / BUKA LOCK (Only if Admin) */}
        {selectedTier === 3 && permissions?.canLockTicket() && (
          <button
            type="button"
            onClick={onToggleLockAdmin}
            style={{
              background: isLocked ? '#D97706' : '#0F4C81',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 11.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
            <span>{isLocked ? 'Unlock Integrity' : 'Lock Integrity'}</span>
          </button>
        )}

        {/* Tier 4: DEPT HEAD (VIEW ONLY) */}
        {selectedTier === 4 && (
          <div style={{ display: 'flex', gap: 6 }}>

            <button
              type="button"
              onClick={onClick}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <Eye size={14} />
              <span>View</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

