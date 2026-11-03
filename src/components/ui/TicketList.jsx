import React from 'react'
import { MapPin, Eye, Edit2 } from 'lucide-react'
import { Badge } from './Primitives'
import { useFosis } from '../../context/FosisContext'
import { canEditTicket } from '../../utils/permissions'

export default function TicketList({ items, onSelect, onEdit }) {
  const { activeUser } = useFosis()

  if (!items.length) {
    return (
      <div className="card">
        <div style={{ padding: 34, textAlign: 'center', color: '#64748B' }}>No matching records found.</div>
      </div>
    )
  }

  return (
    <div className="ticket-list">
      {items.map((item) => {
        const typeStr = (item.type || '').toUpperCase()
        let badgeLabel = ''
        let badgeTone = 'blue'

        if (typeStr === 'TROUBLESHOOT') {
          badgeLabel = item.slaStatus || 'IN SLA'
          badgeTone = badgeLabel === 'OVER SLA' ? 'red' : badgeLabel === 'ON HOLD' ? 'yellow' : 'green'
        } else if (typeStr === 'MAINTENANCE') {
          let rawMnt = item.maintenanceStatus || 'ON PROGRESS'
          if (rawMnt === 'ON PROGRES') rawMnt = 'ON PROGRESS'
          badgeLabel = rawMnt
          badgeTone = badgeLabel === 'DONE' ? 'green' : badgeLabel === 'ON HOLD' ? 'yellow' : badgeLabel === 'CANCEL' ? 'red' : 'blue'
        } else if (typeStr === 'ADMINISTRASI') {
          badgeLabel = item.adminStatus || item.workflowStatus || 'CONTINUE'
          badgeTone = item.locked ? 'green' : 'blue'
        } else {
          badgeLabel = item.workflowStatus || '-'
          badgeTone = item.locked ? 'green' : 'blue'
        }

        const userCanEdit = canEditTicket(activeUser, item)
        const isRejected = (item.workflowStatus || '').toLowerCase().includes('ditolak') || (item.workflowStatus || '').toLowerCase().includes('revisi')
        const isCompleted = (item.workflowStatus || '').toLowerCase().includes('disahkan') || (item.workflowStatus || '').toLowerCase().includes('selesai') || item.locked || item.isLocked

        let cardBorderColor = '#E2E8F0'
        let cardBg = '#FFFFFF'
        if (isRejected) {
          cardBorderColor = '#EF4444' // border-red-500
          cardBg = '#FEF2F2' // bg-red-50
        } else if (isCompleted) {
          cardBorderColor = '#86EFAC'
          cardBg = '#F0FDF4'
        }

        // Status workflow badge styling
        let workflowBadgeTone = 'blue'
        let workflowBadgeStyle = { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }
        if (isRejected) {
          workflowBadgeTone = 'red'
          workflowBadgeStyle = { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }
        } else if (isCompleted) {
          workflowBadgeTone = 'green'
          workflowBadgeStyle = { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
        }

        return (
          <article
            className="ticket-card"
            key={item.id}
            onClick={() => onSelect?.(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(item)
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              position: 'relative',
              borderColor: cardBorderColor,
              backgroundColor: cardBg,
              transition: 'all 0.15s ease'
            }}
          >
            <div className="ticket-head" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="ticket-no">{item.ticketNo}</div>
                {item.workflowStatus && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      marginTop: 4,
                      ...workflowBadgeStyle
                    }}
                  >
                    {item.workflowStatus}
                  </span>
                )}
              </div>
              <Badge tone={isRejected ? 'red' : badgeTone}>{badgeLabel}</Badge>
            </div>
            <div className="ticket-title">{item.title}</div>
            <div className="ticket-meta">
              <span>
                <MapPin size={12} style={{ verticalAlign: '-2px' }} /> {item.siteLocationName}
              </span>
              <span>Field Engineer: {item.engineerName}</span>
            </div>

            {/* Rejection alert banner from IC team if status is rejected */}
            {isRejected && (item.revisionReason || item.notes) && (
              <div
                style={{
                  marginTop: 8,
                  marginBottom: 4,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: 11,
                  lineHeight: 1.4
                }}
              >
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⚠️ IC Rejection Note:</span>
                </div>
                <div style={{ marginTop: 2 }}>{item.revisionReason || item.notes}</div>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 'auto',
                paddingTop: 8
              }}
            >
              <div className="ticket-tags" style={{ marginTop: 0, flex: 1 }}>
                {typeStr === 'TROUBLESHOOT' && (
                  <>
                    {item.rootCause && <Badge>{item.rootCause}</Badge>}
                    {item.impact && <Badge>{item.impact}</Badge>}
                  </>
                )}
                {typeStr === 'MAINTENANCE' && (
                  <>
                    {item.kegiatan && <Badge>{item.kegiatan}</Badge>}
                    {item.requestor && <Badge>{item.requestor}</Badge>}
                  </>
                )}
                {typeStr === 'ADMINISTRASI' && (
                  <>
                    {item.adminTask && <Badge>{item.adminTask}</Badge>}
                    {item.adminKategori && <Badge>{item.adminKategori}</Badge>}
                  </>
                )}
              </div>

              {/* Action buttons at bottom right */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  marginLeft: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* View Button */}
                <button
                  type="button"
                  aria-label="View details"
                  title="View details"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect?.(item)
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    color: '#334155',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F5F9'
                    e.currentTarget.style.borderColor = '#94A3B8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F8FAFC'
                    e.currentTarget.style.borderColor = '#CBD5E1'
                  }}
                >
                  <Eye size={15} />
                </button>

                {/* Edit Button */}
                {userCanEdit && (
                  <button
                    type="button"
                    aria-label="Edit ticket"
                    title="Edit ticket"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(item)
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      color: '#2563EB',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#DBEAFE'
                      e.currentTarget.style.borderColor = '#93C5FD'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#EFF6FF'
                      e.currentTarget.style.borderColor = '#BFDBFE'
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
