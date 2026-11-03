import React, { useState, useEffect } from 'react'
import {
  X,
  MapPin,
  Send,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  FileDown,
  Navigation,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Clock,
  Eye,
  CornerDownRight,
  ClipboardList,
  Sparkles,
  User,
  Calendar,
  Building,
  AlertCircle,
  Edit2,
  Trash2,
  Camera,
  RotateCcw
} from 'lucide-react'
import { useFosis } from '../../context/FosisContext'
import { useToast } from '../../context/ToastContext'
import PrintableTicket from './PrintableTicket'
import { canShareTicketPdfToWA, canEditRecord, isRecordCreator } from '../../utils/permissions'

// Status alur kerja index (1: Teknisi, 2: IC, 3: Admin, 4: Dept Head)
function getWorkflowStepIndex(workflowStatus = '') {
  const s = String(workflowStatus || '').toLowerCase()
  if (s.includes('draft') || s.includes('revisi') || s.includes('revision')) return 1
  if (s.includes('ic') || s.includes('submitted')) return 2
  if (s.includes('leader') || s.includes('verified')) return 3
  if (s.includes('admin') || s.includes('locked') || s.includes('terkunci')) return 3
  if (s.includes('head') || s.includes('sah') || s.includes('approved')) return 4
  return 1
}

export default function TicketDialog({
  item,
  onClose,
  onDismiss,
  onEditTicket,
  onDeleteTicket
}) {
  const {
    activeUser,
    submitByTechnician,
    verifyByIC,
    returnForRevisionByIC,
    lockByAdmin,
    unlockByAdmin,
    approveByDeptHead,
    permissions
  } = useFosis()

  const { success, info, warning } = useToast()
  const handleClose = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    if (typeof onDismiss === 'function') onDismiss()
    else if (typeof onClose === 'function') onClose()
  }

  // Keyboard accessibility: Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        handleClose(e)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onDismiss, onClose])

  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionReasonInput, setRevisionReasonInput] = useState('')
  const [showPrintablePreview, setShowPrintablePreview] = useState(false)

  if (!item) {
    return (
      <div
        className="modal-backdrop"
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 9999,
          padding: 16,
          backdropFilter: 'blur(4px)'
        }}
      >
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 420,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '24px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative'
          }}
        >
          {/* Top-right X button */}
          <button
            type="button"
            aria-label="Close Dialog"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#F1F5F9',
              color: '#64748B',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center', margin: '0 auto 12px auto' }}>
            <AlertTriangle size={22} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0' }}>Ticket Not Found</h3>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            The selected ticket record was not found in system memory or has been removed.
          </p>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '9px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const isLocked = Boolean(item.locked || item.isLocked)
  const currentStep = getWorkflowStepIndex(item.workflowStatus)

  const handlePrintPdf = () => {
    info(`Opening PDF preview for ticket ${item.ticketNo || 'FOSIS'}...`)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Type styling
  const typeStr = (item.type || 'TROUBLESHOOT').toUpperCase()
  const typeBg =
    typeStr === 'TROUBLESHOOT'
      ? '#FEE2E2'
      : typeStr === 'MAINTENANCE'
        ? '#E0F2FE'
        : '#FEF3C7'
  const typeColor =
    typeStr === 'TROUBLESHOOT'
      ? '#DC2626'
      : typeStr === 'MAINTENANCE'
        ? '#0284C7'
        : '#D97706'

  // PDF attachments parsing safely guarded
  const rawAttachments = item.otdrPdfAttachments || item.otdrAttachments || ''
  const pdfFiles = Array.isArray(rawAttachments)
    ? rawAttachments
    : typeof rawAttachments === 'string'
      ? rawAttachments
        .split(';')
        .map((f) => f.trim())
        .filter(Boolean)
      : []

  const openGoogleMaps = () => {
    const lat = item.latitude || -7.2575
    const lng = item.longitude || 112.7521
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank', 'noopener,noreferrer')
  }

  const handleSendWA = () => {
    const fullText = `*FOSIS Operational Ticket*\n• Number : ${item.ticketNo}\n• Title : ${item.title}\n• Status : ${item.workflowStatus}\n• Location : ${item.siteLocationName || item.site || '-'}\n• PIC : ${item.engineerName || '-'}`
    const url = `https://api.whatsapp.com/send?phone=6281234567890&text=${encodeURIComponent(fullText)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    info('Opening WhatsApp to dispatch ticket data...')
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: 16,
        backdropFilter: 'blur(4px)'
      }}
    >
      {/* 2-COLUMN DESKTOP MODAL (Width: 920px) */}
      <div
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(940px, 96vw)',
          maxHeight: '94vh',
          background: '#FFFFFF',
          borderRadius: 24,
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.3)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fosisModalFadeIn 0.2s ease-out'
        }}
      >
        {/* ===================== DETAIL HEADER ===================== */}
        {(() => {
          const isTicketRejected = (item.workflowStatus || '').toLowerCase().includes('ditolak') || (item.workflowStatus || '').toLowerCase().includes('revisi')
          const headerBg = isTicketRejected ? '#FEF2F2' : '#F8FAFC'
          const headerBorder = isTicketRejected ? '#FCA5A5' : '#E2E8F0'

          return (
            <div
              style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${headerBorder}`,
                background: headerBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    background: typeBg,
                    color: typeColor,
                    letterSpacing: '0.4px'
                  }}
                >
                  {typeStr}
                </span>

                <span style={{ fontSize: 16, fontWeight: 900, color: isTicketRejected ? '#DC2626' : '#2563EB' }}>
                  {item.ticketNo}
                </span>

                {/* Workflow Status Pill */}
                {item.workflowStatus && (
                  <span
                    style={{
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: isTicketRejected ? '#FEE2E2' : '#EFF6FF',
                      color: isTicketRejected ? '#DC2626' : '#1D4ED8',
                      border: `1px solid ${isTicketRejected ? '#FCA5A5' : '#BFDBFE'}`
                    }}
                  >
                    {item.workflowStatus}
                  </span>
                )}

                {isLocked && (
                  <span
                    style={{
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FCD34D',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Lock size={11} />
                    <span>ADMIN LOCKED</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: 'none',
                  background: isTicketRejected ? '#FEE2E2' : '#F1F5F9',
                  color: isTicketRejected ? '#DC2626' : '#475569',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
                title="Close (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          )
        })()}

        {/* Title row */}
        <div style={{ padding: '16px 24px 8px 24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
            {item.title}
          </h2>
        </div>

        {/* ===================== WORKFLOW INDICATOR BAR ===================== */}
        <div style={{ padding: '0 24px 12px 24px' }}>
          <div
            style={{
              borderRadius: 14,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '14px 18px'
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#4654F5', marginBottom: 12 }}>
              4-Tier Workflow Pipeline:
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                textAlign: 'center'
              }}
            >
              {[
                { step: 1, label: 'Field Engineer' },
                { step: 2, label: 'IC Team' },
                { step: 3, label: 'Admin Hub' },
                { step: 4, label: 'Dept Head' }
              ].map((s) => {
                const isDone = currentStep >= s.step
                return (
                  <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        background: isDone ? '#12B76A' : '#E4E7EC',
                        color: isDone ? '#FFFFFF' : '#667085',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                        fontSize: 12
                      }}
                    >
                      {isDone ? <Check size={16} /> : s.step}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: isDone ? 800 : 600, color: isDone ? '#027A48' : '#667085', marginTop: 4 }}>
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ===================== LOCK ALERT ===================== */}
        {isLocked && (
          <div style={{ padding: '0 24px 12px 24px' }}>
            <div
              style={{
                borderRadius: 12,
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#92400E'
              }}
            >
              <Lock size={16} color="#B45309" />
              <span>Locked by Admin &bull; Record is locked for integrity and cannot be modified until unlocked by Admin.</span>
            </div>
          </div>
        )}

        {/* ===================== TWO COLUMN DESKTOP GRID ===================== */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px 20px 24px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: 16
          }}
          className="dialog-scroll-body desktop-two-column-grid"
        >
          {/* LEFT COLUMN: Basic Information, Operational Detail, Location, Material */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Card: Technical Operational Specifications */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>
                Technical Information &amp; Specifications
              </div>

              <SpecRow label="Period" value={`${item.bulan || 'SEPTEMBER'} ${item.tahun || '2026'}`} />
              <SpecRow
                label="SLA Status"
                value={item.slaStatus || 'IN SLA'}
                isHighlight={item.slaStatus === 'OVER SLA'}
              />
              {/* Conditionally Render Technical Specifications Based on Module */}
              {typeStr === 'TROUBLESHOOT' ? (
                <>
                  <SpecRow label="Infrastructure Category" value={item.infraCategory || item.infra || 'Not Specified'} />
                  <SpecRow label="Infrastructure Activity" value={item.infraActivity || item.detailAktivitas || 'Not Specified'} />
                  <SpecRow label="Root Cause" value={item.rootCause || 'Not Specified'} />
                  <SpecRow label="Impact" value={item.impact || 'Not Specified'} />
                  <SpecRow label="Service Impact" value={item.serviceImpact || 'Not Specified'} />
                  <SpecRow
                    label="SLA Status"
                    value={item.slaStatus || 'IN SLA'}
                    isHighlight={item.slaStatus === 'OVER SLA'}
                  />
                  <SpecRow label="Change Request (CR)" value={item.crStatus || item.changeRequest || 'Not Specified'} />
                  <SpecRow label="Partner / Contractor" value={item.mitra || 'INTERNAL'} />
                  <SpecRow label="Field Engineer (PIC)" value={item.engineerName || item.pic || 'Not Assigned'} />
                  <SpecRow label="Site Location" value={item.siteLocationName || item.site || 'Not Specified'} />
                </>
              ) : typeStr === 'MAINTENANCE' ? (
                <>
                  <SpecRow label="Maintenance Activity" value={item.kegiatan || 'Not Specified'} />
                  <SpecRow label="Requestor" value={item.requestor || 'Not Specified'} />
                  <SpecRow label="Task Type" value={item.taskType || 'Not Specified'} />
                  <SpecRow
                    label="Maintenance Status"
                    value={item.maintenanceStatus || 'Not Specified'}
                    isHighlight={item.maintenanceStatus === 'ON HOLD'}
                  />
                  <SpecRow label="Infrastructure Category" value={item.infraCategory || item.infra || 'Not Specified'} />
                  <SpecRow label="Infrastructure Activity" value={item.infraActivity || item.detailAktivitas || 'Not Specified'} />
                  <SpecRow label="Field Engineer (PIC)" value={item.engineerName || item.pic || 'Not Assigned'} />
                  <SpecRow label="Site Location" value={item.siteLocationName || item.site || 'Not Specified'} />
                </>
              ) : (
                <>
                  <SpecRow label="Admin Task" value={item.adminTask || 'Not Specified'} />
                  <SpecRow label="Sub Task" value={item.subTask || 'Not Specified'} />
                  <SpecRow label="Sub Task 1" value={item.subTask1 || 'Not Specified'} />
                  <SpecRow label="Channel / Media" value={item.viaChannel || item.via || 'Not Specified'} />
                  <SpecRow label="Admin Status" value={item.adminStatus || 'Not Specified'} />
                  <SpecRow label="Category" value={item.adminKategori || 'Not Specified'} />
                  <SpecRow label="Activity / Regional" value={item.adminActivity || 'Not Specified'} />
                  <SpecRow label="Assigned Officer (PIC)" value={item.engineerName || item.pic || 'Not Assigned'} />
                </>
              )}
            </div>

            {/* Card: DATA INPUT (Field Operations) - for Troubleshoot & Maintenance */}
            {typeStr !== 'ADMINISTRASI' && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 2 }}>
                  Input Data (Field Operational Context)
                </div>
                <SpecRow label="Module Category" value={typeStr} />
                <SpecRow label="Site Location / POP" value={item.siteLocationName || item.site || 'Not Specified'} />
                <SpecRow label="Field Engineer PIC" value={item.engineerName || item.pic || 'Not Assigned'} />
                <SpecRow label="Vehicle / Odometer" value={item.vehicle || item.platKendaraan || item.odometer || 'B 2924 SKN (Grandmax / 45,210 KM)'} />
                <SpecRow label="Problem Description" value={item.title || 'Not Specified'} />
                {typeStr === 'TROUBLESHOOT' && (
                  <>
                    <SpecRow label="Initial Attenuation (dBm)" value={item.redamanAwal || '-28.5 dBm'} isHighlight={true} />
                    <SpecRow label="Fiber Break Point / Core" value={item.titikPutus || 'Core 4 (Tray 2)'} />
                  </>
                )}
              </div>
            )}

            {/* Card: DATA OUTPUT (Execution Results) - for Troubleshoot & Maintenance */}
            {typeStr !== 'ADMINISTRASI' && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1E293B', marginBottom: 2 }}>
                  Output Data (Execution &amp; Resolution)
                </div>
                <SpecRow label="Rectification Action / Result" value={item.detailAktivitas || item.infraActivity || 'Splicing Tray Core & Protection'} />
                {typeStr === 'TROUBLESHOOT' && (
                  <>
                    <SpecRow label="Final Attenuation (dBm)" value={item.redamanAkhir || '-18.2 dBm'} />
                    <SpecRow label="Link Status" value={item.statusLink || 'UP (NORMAL)'} isHighlight={item.statusLink === 'DOWN'} />
                  </>
                )}
              </div>
            )}

            {/* Card: Geolocation GPS - if coordinates available or non-administrative */}
            {(typeStr !== 'ADMINISTRASI' || (item.latitude && item.longitude)) && (
              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Sensor Device GPS Coordinates:</div>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: (item.latitude && item.longitude) ? '#0F172A' : '#94A3B8', marginTop: 2 }}>
                    {item.latitude && item.longitude
                      ? `${Number(item.latitude).toFixed(5)}, ${Number(item.longitude).toFixed(5)}`
                      : 'Coordinates not yet acquired'}
                  </div>
                </div>

                {item.latitude && item.longitude && (
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    style={{
                      border: 'none',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                  >
                    <MapPin size={13} />
                    <span>Open in Google Maps</span>
                  </button>
                )}
              </div>
            )}

            {/* Revision Required Reason Notice Banner if present */}
            {item.revisionReason && (
              <div
                style={{
                  background: '#FEF2F2',
                  borderRadius: 12,
                  border: '1px solid #FCA5A5',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#DC2626' }}>
                  <AlertCircle size={15} />
                  <span>Revision Request Notes:</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#991B1B' }}>
                  {item.revisionReason}
                </div>
                {item.revisionRequestedBy && (
                  <div style={{ fontSize: 10, color: '#B91C1C', marginTop: 2 }}>
                    Requested by: <strong>{item.revisionRequestedBy}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Card: Work Documentation Photos */}
            {(typeStr !== 'ADMINISTRASI' || (Array.isArray(item.workPhotos) && item.workPhotos.length > 0)) && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E4E7EC',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={16} color="#4B45F5" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#101828' }}>
                      Field Operational Photos
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>
                    {Array.isArray(item.workPhotos) ? item.workPhotos.length : 0} / 5 Photos
                  </span>
                </div>

                {!Array.isArray(item.workPhotos) || item.workPhotos.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: '#98A2B3', fontStyle: 'italic', padding: '6px 0' }}>
                    No documentation photos attached.
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: 8,
                      marginTop: 4
                    }}
                  >
                    {item.workPhotos.map((photo, pIdx) => {
                      const imgUrl = typeof photo === 'string' ? photo : (photo?.dataUrl || photo?.url || '')
                      const imgName = typeof photo === 'string' ? `Photo ${pIdx + 1}` : (photo?.name || `Photo ${pIdx + 1}`)
                      return (
                        <div
                          key={photo?.id || pIdx}
                          style={{
                            borderRadius: 8,
                            border: '1px solid #E4E7EC',
                            overflow: 'hidden',
                            background: '#F9FAFB'
                          }}
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={imgName}
                              style={{ width: '100%', height: 75, objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                              onClick={() => window.open(imgUrl, '_blank')}
                              title="Click to view full resolution"
                            />
                          ) : (
                            <div style={{ height: 75, display: 'grid', placeItems: 'center', fontSize: 10, color: '#94A3B8' }}>
                              [No Image]
                            </div>
                          )}
                          <div
                            style={{
                              padding: '4px 6px',
                              fontSize: 9.5,
                              fontWeight: 600,
                              color: '#344054',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {imgName}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Card: Materials Used */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '14px 16px'
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>
                {typeStr === 'ADMINISTRASI' ? 'Administrative Material / Documents:' : 'Operational Materials Consumed:'}
              </div>
              <div style={{ fontSize: 12, color: '#0F172A', marginTop: 4, lineHeight: 1.45 }}>
                {item.materialUsed || item.material || (typeStr === 'ADMINISTRASI' ? 'No administrative material recorded.' : 'No special material recorded.')}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Workflow Status, Attachment, Workflow History, Dept Head Comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* OTDR PDF Attachments - only for Troubleshoot/Maintenance or if files exist */}
            {(typeStr !== 'ADMINISTRASI' || pdfFiles.length > 0) && (
              <div
                style={{
                  background: '#F0FDF4',
                  borderRadius: 16,
                  border: '1px solid #BBF7D0',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#166534' }}>
                    OTDR PDF Attachments
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>
                    {pdfFiles.length}/50 Files
                  </span>
                </div>


                {pdfFiles.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: '#15803D', fontStyle: 'italic', marginTop: 4 }}>
                    No OTDR PDF files attached yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {pdfFiles.slice(0, 4).map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFFFFF',
                          padding: '5px 8px',
                          borderRadius: 6,
                          border: '1px solid #DCFCE7',
                          fontSize: 11
                        }}
                      >
                        <span style={{ color: '#0F172A' }}>{file}</span>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: '#16A34A' }}>Valid</span>
                      </div>
                    ))}
                    {pdfFiles.length > 4 && (
                      <span style={{ fontSize: 10, color: '#15803D' }}>+ {pdfFiles.length - 4} more files</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Audit Trail: Workflow timeline history */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color="#2563EB" />
                <span>Workflow Audit Trail</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                {(Array.isArray(item.workflowHistory) && item.workflowHistory.length > 0 ? item.workflowHistory : [
                  { time: '10:00', user: item.engineerName || 'Ahmad Ibrahim (Field Engineer)', status: item.workflowStatus || 'Pending IC Verification', note: 'Operational report created and submitted to workflow pipeline' }
                ]).map((h, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#475569', display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 6, borderBottom: '1px dashed #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, color: '#2563EB' }}>{h.time}</span>
                      <span>&bull;</span>
                      <span style={{ fontWeight: 700, color: '#1E293B' }}>{h.user}</span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginLeft: 'auto',
                          background: (h.status || '').toLowerCase().includes('ditolak') || (h.status || '').toLowerCase().includes('reject') ? '#FEE2E2' : (h.status || '').toLowerCase().includes('disahkan') || (h.status || '').toLowerCase().includes('approved') ? '#DCFCE7' : '#EFF6FF',
                          color: (h.status || '').toLowerCase().includes('ditolak') || (h.status || '').toLowerCase().includes('reject') ? '#DC2626' : (h.status || '').toLowerCase().includes('disahkan') || (h.status || '').toLowerCase().includes('approved') ? '#166534' : '#1D4ED8'
                        }}
                      >
                        {h.status}
                      </span>
                    </div>
                    <div style={{ color: (h.status || '').toLowerCase().includes('ditolak') || (h.status || '').toLowerCase().includes('reject') ? '#B91C1C' : '#64748B', fontSize: 10.5 }}>
                      {h.note || h.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dept Head Comments / Approval */}
            <div
              style={{
                background: '#F0FDF4',
                borderRadius: 16,
                border: '1px solid #86EFAC',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: '#14532D' }}>
                Department Head Comments (Authorization)
              </div>

              <div style={{ fontSize: 11.5, color: item.deptHeadComment ? '#14532D' : '#64748B' }}>
                {item.deptHeadComment || 'No comments recorded from Department Head yet.'}
              </div>
            </div>
          </div>
        </div>

        {/* ===================== FOOTER ACTION TOOLBAR ===================== */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          {/* Quick Sharing: PDF & WhatsApp Preview Modal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* PDF JRR Button - Opens Modal Preview A4 */}
            <button
              type="button"
              onClick={() => setShowPrintablePreview(true)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <FileDown size={14} color="#DC2626" />
              <span>PDF JRR</span>
            </button>

            {/* WA PDF Button - Opens Modal Preview A4 (Subject to RBAC) */}
            {canShareTicketPdfToWA(activeUser, item) ? (
              <button
                type="button"
                onClick={() => setShowPrintablePreview(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Send size={13} />
                <span>WA PDF</span>
              </button>
            ) : (
              <span
                title="Only the ticket creator or authorized personnel can share PDF to WhatsApp"
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#F1F5F9',
                  color: '#94A3B8',
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Lock size={12} />
                <span>WA Locked</span>
              </span>
            )}

            {/* EDIT TICKET BUTTON (Subject to Creator Ownership & Lock status) */}
            {canEditRecord(activeUser, item) && permissions.canEditTicket(item) && (
              <button
                type="button"
                onClick={() => onEditTicket?.(item)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            )}

            {/* DELETE TICKET BUTTON (Subject to RBAC) */}
            {permissions.canDeleteTicket(item) && (
              <button
                type="button"
                onClick={() => onDeleteTicket?.(item)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Workflow Action Buttons (Role-based via central permissions) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* FIELD ENGINEER SUBMIT REVISION (Only visible if rejected / revision requested) */}
            {permissions.canSubmitTicket(item) &&
              ((item.workflowStatus || '').toLowerCase().includes('revisi') ||
                (item.workflowStatus || '').toLowerCase().includes('revision') ||
                (item.workflowStatus || '').toLowerCase().includes('ditolak') ||
                (item.workflowStatus || '').toLowerCase().includes('reject')) && (
                <button
                  type="button"
                  onClick={() => {
                    const hasPhoto = Array.isArray(item.workPhotos) && item.workPhotos.length > 0
                    if (!hasPhoto) {
                      warning('Work documentation photos must be attached before submitting.')
                      return
                    }
                    submitByTechnician(item.id)
                    success(`Ticket ${item.ticketNo} submitted to IC Team!`)
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Send size={13} />
                  <span>Submit Revision</span>
                </button>
              )}

            {/* IC VERIFY & REJECT */}
            {permissions.canVerifyTicket(item) &&
              ((item.workflowStatus || '').toLowerCase().includes('verifikasi ic') ||
                (item.workflowStatus || '').toLowerCase().includes('ic') ||
                item.workflowStatus === 'SUBMITTED_TEKNISI' ||
                item.workflowStatus === 'Draft Teknisi') && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRevisionModal(true)
                      setRevisionReasonInput('')
                    }}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Reject for Revision</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      verifyByIC(item.id)
                      success(`Ticket ${item.ticketNo} verified & forwarded to Admin Hub!`)
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Verify &amp; Forward to Admin
                  </button>
                </>
              )}

            {/* ADMIN HUB AUTHORIZE REPORT / TOGGLE INTEGRITY LOCK */}
            {permissions.canLockTicket() && (
              <>
                {!isLocked && ((item.workflowStatus || '').toLowerCase().includes('pengesahan admin') || (item.workflowStatus || '').toLowerCase().includes('admin approval')) && (
                  <button
                    type="button"
                    onClick={() => {
                      lockByAdmin(item.id)
                      success(`Report ${item.ticketNo} authorized and locked by Admin Hub!`)
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Authorize Report
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (isLocked) {
                      unlockByAdmin(item.id)
                      info(`Integrity lock on ${item.ticketNo} unlocked.`)
                    } else {
                      lockByAdmin(item.id)
                      success(`Data integrity for ${item.ticketNo} authorized and locked!`)
                    }
                  }}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: isLocked ? '#D97706' : '#0F4C81',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {isLocked ? 'Unlock Integrity' : 'Authorize & Lock Report'}
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                padding: '7px 16px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* IC Revision Modal Popup */}
      {showRevisionModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowRevisionModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 10000,
            padding: 16
          }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(480px, 94vw)',
              background: '#FFFFFF',
              borderRadius: 16,
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
                Return for Revision ({item.ticketNo})
              </div>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#475569' }}>
              Specify the revision reason so the field engineer can make corrections and resubmit. Existing documentation photos and material data will remain preserved.
            </div>

            <textarea
              rows={3}
              required
              value={revisionReasonInput}
              onChange={(e) => setRevisionReasonInput(e.target.value)}
              placeholder="e.g. Documentation photo does not clearly show the core tray identification label..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
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
                disabled={!revisionReasonInput.trim()}
                onClick={() => {
                  if (!revisionReasonInput.trim()) {
                    warning('Revision reason is required.')
                    return
                  }
                  returnForRevisionByIC(item.id, revisionReasonInput.trim())
                  setShowRevisionModal(false)
                  success(`Ticket ${item.ticketNo} returned to field engineer for revision!`)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: revisionReasonInput.trim() ? '#DC2626' : '#E2E8F0',
                  color: revisionReasonInput.trim() ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: revisionReasonInput.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Real Printable Document rendered for Modal Preview & window.print() */}
      {showPrintablePreview && (
        <PrintableTicket
          ticket={item}
          onClose={() => setShowPrintablePreview(false)}
          currentUser={activeUser}
        />
      )}
    </div>
  )
}


function SpecRow({ label, value, isHighlight = false }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 0'
      }}
    >
      <span style={{ fontSize: 11.5, color: '#64748B' }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: isHighlight ? '#DC2626' : '#0F172A'
        }}
      >
        {value}
      </span>
    </div>
  )
}
