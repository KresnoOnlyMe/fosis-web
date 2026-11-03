import React, { useState, useMemo } from 'react'
import {
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Presentation,
  MapPin,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Lock,
  ChevronDown,
  Navigation,
  Trash2,
  Check,
  Send,
  Eye,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  HardHat,
  Users,
  Calendar,
  Layers,
  Edit2
} from 'lucide-react'
import PrintablePermit from '../components/dialogs/PrintablePermit'
import ConfirmDialog from '../components/dialogs/ConfirmDialog'
import {
  normalizeRole,
  ROLES,
  canManagePermit,
  canApproveRejectPermit,
  canShareTicketPdfToWA,
  canEditRecord,
  isRecordCreator
} from '../utils/permissions'

// Helper format nomor WA
function formatToIndonesianWhatsApp(rawPhone = '') {
  if (!rawPhone) return '+6281200000000'
  let clean = rawPhone.toString().replace(/\D/g, '')
  if (clean.startsWith('62')) return `+${clean}`
  if (clean.startsWith('0')) return `+62${clean.substring(1)}`
  return `+62${clean}`
}

// Helper kirim WA
function sendWhatsAppMessage(rawPhone, subject, bodyMessage) {
  const formattedPhone = formatToIndonesianWhatsApp(rawPhone).replace('+', '')
  const fullText = subject ? `*${subject}*\n\n${bodyMessage}` : bodyMessage
  const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(fullText)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// SIK Lifecycle display status helper (calculates EXPIRED dynamically without corrupting historical APPROVED)
export function getPermitDisplayStatus(permit) {
  if (!permit) return 'DRAFT'
  const rawStatus = (permit.status || 'DRAFT').toUpperCase()
  if (rawStatus === 'APPROVED' && permit.endDate) {
    const todayStr = new Date().toISOString().slice(0, 10)
    if (permit.endDate < todayStr) {
      return 'EXPIRED'
    }
  }
  return rawStatus
}

// Status style mapping
function getStatusBadge(permitOrStatus) {
  const raw = typeof permitOrStatus === 'object' ? getPermitDisplayStatus(permitOrStatus) : (permitOrStatus || '').toUpperCase()
  if (raw === 'APPROVED' || raw === 'DISETUJUI_ADMIN' || raw === 'DISETUJUI') {
    return {
      label: 'APPROVED',
      color: '#16A34A',
      bg: '#DCFCE7',
      border: '#86EFAC'
    }
  }
  if (raw === 'WAITING_APPROVAL' || raw === 'PENDING' || raw === 'DIAJUKAN' || raw === 'MENUNGGU') {
    return {
      label: 'WAITING APPROVAL',
      color: '#EA580C',
      bg: '#FFEDD5',
      border: '#FDBA74'
    }
  }
  if (raw === 'REJECTED' || raw === 'DITOLAK') {
    return {
      label: 'REJECTED',
      color: '#DC2626',
      bg: '#FEE2E2',
      border: '#FCA5A5'
    }
  }
  if (raw === 'EXPIRED') {
    return {
      label: 'EXPIRED',
      color: '#64748B',
      bg: '#F1F5F9',
      border: '#CBD5E1'
    }
  }
  if (raw === 'SELESAI' || raw === 'DONE' || raw === 'COMPLETED') {
    return {
      label: 'COMPLETED',
      color: '#2563EB',
      bg: '#DBEAFE',
      border: '#93C5FD'
    }
  }
  return {
    label: 'DRAFT',
    color: '#4B5563',
    bg: '#F3F4F6',
    border: '#D1D5DB'
  }
}


export default function PermitPage({
  permits = [],
  activeUser,
  onApprovePermit,
  onCreatePermit,
  onDeletePermit,
  onImportPermits,
  userLatitude = -7.2575,
  userLongitude = 112.7521
}) {
  const userRoleStr = (activeUser?.role || '').toLowerCase()
  const isAdmin =
    userRoleStr.includes('admin') ||
    userRoleStr === 'administrasi' ||
    activeUser?.canDelete === true
  const isDeptHead = userRoleStr.includes('dept') || userRoleStr.includes('head')

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [selectedPermitForDetail, setSelectedPermitForDetail] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterMonth, setFilterMonth] = useState('ALL')
  const [filterYear, setFilterYear] = useState('ALL')
  const [filterSite, setFilterSite] = useState('ALL')

  // Reject Dialog state
  const [rejectDialogPermit, setRejectDialogPermit] = useState(null)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  // Delete Confirm Dialog state
  const [deleteConfirmPermit, setDeleteConfirmPermit] = useState(null)

  // Printable Permit state for window.print()
  const [printablePermitTarget, setPrintablePermitTarget] = useState(null)

  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Count summaries
  const approvedCount = permits.filter((p) => {
    const s = getPermitDisplayStatus(p)
    return s === 'APPROVED'
  }).length

  const pendingCount = permits.filter((p) => {
    const s = getPermitDisplayStatus(p)
    return s === 'WAITING_APPROVAL' || s === 'PENDING'
  }).length

  const draftCount = permits.filter((p) => {
    const s = getPermitDisplayStatus(p)
    return s === 'DRAFT'
  }).length

  const rejectedCount = permits.filter((p) => {
    const s = getPermitDisplayStatus(p)
    return s === 'REJECTED'
  }).length

  // Site options derived dynamically from permits
  const siteOptions = useMemo(() => {
    const set = new Set()
    permits.forEach((p) => {
      const s = p.siteLocation || p.site
      if (s) set.add(s)
    })
    return Array.from(set)
  }, [permits])

  // Filtered permits
  const filteredPermits = useMemo(() => {
    return permits.filter((p) => {
      const displayStatus = getPermitDisplayStatus(p)
      if (filterStatus === 'APPROVED' && displayStatus !== 'APPROVED') return false
      if (filterStatus === 'WAITING_APPROVAL' && displayStatus !== 'WAITING_APPROVAL' && displayStatus !== 'PENDING') return false
      if (filterStatus === 'DRAFT' && displayStatus !== 'DRAFT') return false
      if (filterStatus === 'REJECTED' && displayStatus !== 'REJECTED') return false
      if (filterStatus === 'EXPIRED' && displayStatus !== 'EXPIRED') return false

      if (filterSite !== 'ALL') {
        const site = p.siteLocation || p.site || ''
        if (site !== filterSite) return false
      }

      if (filterYear !== 'ALL') {
        const year = p.startDate ? p.startDate.slice(0, 4) : ''
        if (year !== filterYear) return false
      }

      if (filterMonth !== 'ALL') {
        const monthNum = p.startDate ? p.startDate.slice(5, 7) : ''
        if (monthNum !== filterMonth) return false
      }

      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        (p.permitNo && p.permitNo.toLowerCase().includes(q)) ||
        (p.site && p.site.toLowerCase().includes(q)) ||
        (p.siteLocation && p.siteLocation.toLowerCase().includes(q)) ||
        (p.workType && p.workType.toLowerCase().includes(q)) ||
        (p.applicantName && p.applicantName.toLowerCase().includes(q))
      )
    })
  }, [permits, filterStatus, filterSite, filterYear, filterMonth, searchQuery])


  // Export handlers
  const handleExport = (type) => {
    setShowExportMenu(false)
    if (type === 'EXCEL') {
      const csvHeader = 'Permit No,Site Location,Work Type,Applicant,Company,Start Date,End Date,Work Hours,Status,HSE PPE\n'
      const csvRows = permits
        .map(
          (p) =>
            `"${p.permitNo || p.pfNo || ''}","${p.site || p.siteLocation || p.address || ''}","${p.workType || p.typeOfService || ''}","${p.applicantName || p.engineerSignName || ''}","${p.company || p.companyName || ''}","${p.startDate || p.rfsDate || ''}","${p.endDate || ''}","${p.hours || p.workHours || ''}","${p.status || ''}","${p.safety || p.equipment || ''}"`
        )
        .join('\n')
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `FOSIS_Permit_SIK_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast('Excel report (.csv) downloaded successfully!')
    } else if (type === 'PDF') {
      const target = filteredPermits[0] || permits[0]
      if (target) {
        setPrintablePermitTarget(target)
      } else {
        showToast('No permit records available to export.')
      }
    } else if (type === 'PPT') {
      showToast('Export Slide Presentation (.pptx) downloaded (Simulated)')
    }
  }

  const openGoogleMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

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

      {/* Banner Header */}
      <div
        style={{
          borderRadius: 20,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #BFDBFE',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          {/* Title & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#2563EB',
                color: '#FFFFFF',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                flexShrink: 0
              }}
            >
              <ClipboardCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1E3A8A' }}>
                Site Working Permit Authorization (SIK)
              </div>
              <div style={{ fontSize: 12, color: '#1D4ED8', marginTop: 2, fontWeight: 500 }}>
                Permit to Work &amp; HSE Occupational Safety Guidelines
              </div>
            </div>
          </div>

          {/* Export Dropdown Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '8px 16px',
                fontSize: 12.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={15} />
              <span>Export SIK</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  onClick={() => setShowExportMenu(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: 220,
                    background: '#FFFFFF',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px'
                  }}
                >
                  <button
                    onClick={() => handleExport('EXCEL')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <FileSpreadsheet size={15} color="#16A34A" />
                    <span>Export Excel (.csv)</span>
                  </button>

                  <button
                    onClick={() => handleExport('PDF')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <FileText size={15} color="#DC2626" />
                    <span>Export Dokumen Resmi PDF</span>
                  </button>

                  <button
                    onClick={() => handleExport('PPT')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#0F172A',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Presentation size={15} color="#EA580C" />
                    <span>Export Slide Presentasi (PPT)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stat summary pills */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 10,
            marginTop: 16
          }}
        >
          <div
            onClick={() => setFilterStatus('ALL')}
            style={{
              borderRadius: 14,
              background: filterStatus === 'ALL' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${filterStatus === 'ALL' ? '#2563EB' : 'rgba(255, 255, 255, 0.9)'}`,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF' }}>Total Ijin Kerja</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1E3A8A', marginTop: 2 }}>
              {permits.length}
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('DRAFT')}
            style={{
              borderRadius: 14,
              background: filterStatus === 'DRAFT' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${filterStatus === 'DRAFT' ? '#64748B' : 'rgba(255, 255, 255, 0.9)'}`,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#475569' }}>Draft Pemohon</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#334155', marginTop: 2 }}>
              {draftCount}
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('WAITING_APPROVAL')}
            style={{
              borderRadius: 14,
              background: filterStatus === 'WAITING_APPROVAL' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${filterStatus === 'WAITING_APPROVAL' ? '#EA580C' : 'rgba(255, 255, 255, 0.9)'}`,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9A3412' }}>Waiting Approval</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#9A3412', marginTop: 2 }}>
              {pendingCount}
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('APPROVED')}
            style={{
              borderRadius: 14,
              background: filterStatus === 'APPROVED' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${filterStatus === 'APPROVED' ? '#16A34A' : 'rgba(255, 255, 255, 0.9)'}`,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#166534' }}>Disetujui (Approved)</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#166534', marginTop: 2 }}>
              {approvedCount}
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('REJECTED')}
            style={{
              borderRadius: 14,
              background: filterStatus === 'REJECTED' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${filterStatus === 'REJECTED' ? '#DC2626' : 'rgba(255, 255, 255, 0.9)'}`,
              padding: '10px 14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#991B1B' }}>Rejected</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#991B1B', marginTop: 2 }}>
              {rejectedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar: Status, Bulan, Tahun, Site, Search */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        {/* Bulan */}
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            height: 38,
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: 12,
            fontWeight: 600,
            color: '#334155'
          }}
        >
          <option value="ALL">All Months</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        {/* Year */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          style={{
            height: 38,
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: 12,
            fontWeight: 600,
            color: '#334155'
          }}
        >
          <option value="ALL">All Years</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
          <option value="2027">2027</option>
        </select>

        {/* Site Location */}
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          style={{
            height: 38,
            padding: '0 10px',
            borderRadius: 10,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            fontSize: 12,
            fontWeight: 600,
            color: '#334155',
            maxWidth: 220
          }}
        >
          <option value="ALL">All Site Locations</option>
          {siteOptions.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>

        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Permit No, site location, work type..."
            style={{
              width: '100%',
              height: 38,
              padding: '0 10px 0 32px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              fontSize: 12,
              outline: 'none'
            }}
          />
        </div>

        {/* Action Button: Apply Permit */}
        {!isDeptHead && (
          <button
            onClick={() => setShowAddDialog(true)}
            style={{
              height: 38,
              borderRadius: 10,
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>Apply Permit</span>
          </button>
        )}

        {/* Action Button: Import Permit */}
        <button
          onClick={() => setShowImportDialog(true)}
          style={{
            height: 38,
            borderRadius: 10,
            background: '#EFF6FF',
            color: '#1D4ED8',
            border: '1px solid #93C5FD',
            padding: '0 14px',
            fontSize: 12,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer'
          }}
        >
          <Upload size={16} />
          <span>Import Permits</span>
        </button>
      </div>


      {/* Permit Cards List (Empty or Grid) */}
      {filteredPermits.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 20,
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#F1F5F9',
              color: '#94A3B8',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <ClipboardCheck size={28} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
            No Working Permits Found
          </div>
          <div style={{ fontSize: 12, color: '#64748B', maxWidth: 480, lineHeight: 1.5 }}>
            No working permit authorizations match the current filter criteria.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredPermits.map((permit) => (
            <PermitCardItem
              key={permit.id}
              permit={permit}
              activeUser={activeUser}
              onSubmitPermit={() => {
                const res = onApprovePermit ? onApprovePermit(permit, 'SUBMIT') : null
                showToast(`Work Permit ${permit.permitNo} submitted for verification!`)
              }}
              onApprove={() => {
                if (onApprovePermit) onApprovePermit(permit, true)
                showToast(`Work Permit ${permit.permitNo} approved!`)
              }}
              onReject={() => {
                setRejectDialogPermit(permit)
                setRejectReasonInput('')
              }}
              onDelete={() => {
                setDeleteConfirmPermit(permit)
              }}
              onExportPdf={() => {
                setPrintablePermitTarget(permit)
              }}
              onOpenMaps={openGoogleMaps}
              showToast={showToast}
            />
          ))}
        </div>
      )}

      {/* Modal: New Permit Form */}
      {showAddDialog && (
        <AddPermitDialog
          activeUser={activeUser}
          userLatitude={userLatitude}
          userLongitude={userLongitude}
          onDismiss={() => setShowAddDialog(false)}
          onSubmit={(newPermitData) => {
            const autoNo = newPermitData.pfNo || `SIK-${new Date().getFullYear()}-${String(permits.length + 1).padStart(4, '0')}`
            const newPermit = {
              id: Date.now(),
              permitNo: autoNo,
              pfNo: autoNo,
              ...newPermitData,
              status: 'DRAFT',
              latitude: userLatitude,
              longitude: userLongitude,
              createdBy: activeUser?.id || null,
              creatorName: activeUser?.name || null,
              importedByAdmin: false
            }
            if (onCreatePermit) onCreatePermit(newPermit)
            setShowAddDialog(false)
            showToast(`Draft Work Permit ${newPermit.permitNo} created successfully!`)
          }}
        />
      )}

      {/* Modal Dialog: Input Rejection Reason for Permit */}
      {rejectDialogPermit && (
        <div
          className="modal-backdrop"
          onClick={() => setRejectDialogPermit(null)}
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
              width: 'min(480px, 94vw)',
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #CBD5E1',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 14
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#DC2626' }}>
                Reject Work Permit ({rejectDialogPermit.permitNo})
              </div>
              <button
                type="button"
                onClick={() => setRejectDialogPermit(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#475569' }}>
              Provide the rejection reason so the applicant can correct HSE documentation or work schedule.
            </div>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Incomplete HSE documentation, certification expired, or scheduled work conflicts..."
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
                onClick={() => setRejectDialogPermit(null)}
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
                onClick={() => {
                  if (onApprovePermit) onApprovePermit(rejectDialogPermit, false, rejectReasonInput)
                  setRejectDialogPermit(null)
                  showToast(`Work Permit ${rejectDialogPermit.permitNo} rejected.`)
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog: Delete Permit */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmPermit)}
        title={`Delete Work Permit ${deleteConfirmPermit?.permitNo || ''}?`}
        message="Deleted working permit authorizations cannot be recovered. Do you wish to proceed?"
        confirmText="Delete Permit"
        confirmTone="danger"
        onConfirm={() => {
          if (deleteConfirmPermit && onDeletePermit) {
            onDeletePermit(deleteConfirmPermit)
            showToast(`Work Permit ${deleteConfirmPermit.permitNo} deleted.`)
          }
          setDeleteConfirmPermit(null)
        }}
        onCancel={() => setDeleteConfirmPermit(null)}
      />

      {/* Real Printable SIK rendered into DOM for window.print() / A4 preview */}
      {printablePermitTarget && (
        <PrintablePermit
          permit={printablePermitTarget}
          onClose={() => setPrintablePermitTarget(null)}
          currentUser={activeUser}
        />
      )}

      {/* Modal: Import Permits Admin */}
      {showImportDialog && (
        <ImportPermitsAdminDialog
          activeUser={activeUser}
          onDismiss={() => setShowImportDialog(false)}
          onImport={(importedList) => {
            if (onImportPermits) onImportPermits(importedList)
            setShowImportDialog(false)
            showToast('Batch work permit authorizations imported successfully!')
            if (importedList && importedList.length > 0) {
              setPrintablePermitTarget(importedList[0])
            }
          }}
        />
      )}
    </div>
  )
}

function PermitCardItem({
  permit,
  activeUser,
  onSubmitPermit,
  onApprove,
  onReject,
  onDelete,
  onExportPdf,
  onOpenMaps,
  showToast
}) {
  const displayStatus = getPermitDisplayStatus(permit)
  const statusInfo = getStatusBadge(permit)

  const canManage = canManagePermit(activeUser)
  const canAuthorize = canApproveRejectPermit(activeUser)
  const canShareWA = canShareTicketPdfToWA(activeUser, permit)
  const canEdit = canEditRecord(activeUser, permit)

  const isApproved = displayStatus === 'APPROVED'
  const isDraft = displayStatus === 'DRAFT'
  const isWaiting = displayStatus === 'WAITING_APPROVAL' || displayStatus === 'PENDING'
  const isRejected = displayStatus === 'REJECTED'

  const siteName = permit.siteLocation || permit.site || permit.address || 'Site FOSIS'
  const workType = permit.workType || permit.typeOfService || 'Optical Fiber & Splicing'
  const applicant = permit.applicantName || permit.engineerSignName || 'Tim Lapangan'
  const company = permit.company || permit.companyName || permit.companyOrVendor || 'Internal'
  const period = `${permit.startDate || permit.rfsDate || '-'} s/d ${permit.endDate || '-'} • ${permit.hours || permit.workHours || '08:00 - 17:00 WIB'}`
  const lat = permit.latitude || -7.2575
  const lng = permit.longitude || 112.7521
  const jsa = permit.safety || permit.equipment || permit.jsaChecklist || 'Helm K3, Rompi Reflektor, Sepatu Safety'

  const handleOpenPreview = () => {
    onExportPdf?.()
  }

  return (
    <div
      style={{
        borderRadius: 18,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        padding: '18px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      {/* Top Row: Permit No & Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: '#EADDFF',
              color: '#21005D',
              fontWeight: 800,
              fontSize: 12
            }}
          >
            {permit.permitNo || permit.pfNo}
          </span>
          {permit.importedByAdmin && (
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                background: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 700,
                fontSize: 10.5
              }}
            >
              Admin Import
            </span>
          )}
        </div>

        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            color: statusInfo.color,
            fontSize: 11,
            fontWeight: 800
          }}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Site Location Name */}
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
        {siteName}
      </div>

      {/* Details list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
          <HardHat size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>
            <strong>Work Type:</strong> {workType}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
          <Users size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>
            Applicant: <strong>{applicant}</strong> ({company})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569' }}>
          <Calendar size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>Period: {period}</span>
        </div>

        {permit.rejectionReason && (
          <div style={{ padding: '6px 10px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 11 }}>
            <strong>Rejection Remarks:</strong> {permit.rejectionReason}
          </div>
        )}
      </div>

      {/* Device GPS Tag Bar (Clickable to Google Maps) */}
      <div
        onClick={() => onOpenMaps(lat, lng)}
        style={{
          borderRadius: 10,
          background: '#F3EDF7',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#E8DEF8')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#F3EDF7')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Navigation size={14} color="#6750A4" />
          <span style={{ fontSize: 11, color: '#49454F', fontWeight: 600 }}>
            Device GPS: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </span>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#6750A4', display: 'flex', alignItems: 'center', gap: 3 }}>
          <span>Buka Maps</span>
          <ExternalLink size={11} />
        </div>
      </div>

      {/* K3 / APD Checklist */}
      <div style={{ fontSize: 11, color: '#64748B' }}>
        <strong>K3 / APD / Perangkat:</strong> {jsa}
      </div>

      {/* Footer Divider & Action Buttons */}
      <div
        style={{
          borderTop: '1px solid #F1F5F9',
          paddingTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8
        }}
      >
        {/* Left actions: PDF & WA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleOpenPreview}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 11.5,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer'
            }}
          >
            <FileText size={13} color="#DC2626" />
            <span>PDF SIK</span>
          </button>

          {canShareWA ? (
            <button
              type="button"
              onClick={handleOpenPreview}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#16A34A',
                color: '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer'
              }}
            >
              <Send size={12} />
              <span>Kirim WA (+62)</span>
            </button>
          ) : (
            <span
              title="Hanya penginput yang dapat mengirim PDF ke WhatsApp"
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#F1F5F9',
                color: '#94A3B8',
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Lock size={12} />
              <span>WA Terkunci</span>
            </span>
          )}
        </div>

        {/* Right actions: Submit, Approve, Reject, Delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Submit Action for Draft / Rejected */}
          {(isDraft || isRejected) && (
            <button
              type="button"
              onClick={onSubmitPermit}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
            >
              <Send size={12} />
              <span>Ajukan SIK</span>
            </button>
          )}

          {/* Authorized Role: Approve & Reject */}
          {canAuthorize && isWaiting && (
            <>
              <button
                type="button"
                onClick={onApprove}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <Check size={13} />
                <span>Setujui</span>
              </button>

              <button
                type="button"
                onClick={onReject}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <X size={13} />
                <span>Reject</span>
              </button>
            </>
          )}

          {/* Delete Action (Controlled by canManagePermit) */}
          {canManage && (
            <button
              type="button"
              onClick={onDelete}
              title="Delete Permit"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #FECACA',
                background: '#FEF2F2',
                color: '#DC2626',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


function AddPermitDialog({ activeUser, userLatitude, userLongitude, onDismiss, onSubmit }) {
  // Header Order
  const [pfNo, setPfNo] = useState(`PF-${new Date().getFullYear()}${String(Date.now()).slice(-4)}`)
  const [typeOfOrder, setTypeOfOrder] = useState('New')
  const [otherOrderText, setOtherOrderText] = useState('')

  // Bagian 1: CUSTOMER INFORMATION
  const [companyName, setCompanyName] = useState('PT NAP Info Lintas Nusa')
  const [customerCode, setCustomerCode] = useState('CUST-NAP-001')
  const [customerType, setCustomerType] = useState('Enterprise')
  const [address, setAddress] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [telp, setTelp] = useState('')
  const [picOnsite, setPicOnsite] = useState('')
  const [email, setEmail] = useState('')
  const [am, setAm] = useState('')
  const [rfsDate, setRfsDate] = useState(new Date().toISOString().slice(0, 10))

  // Bagian 2: SERVICE DETAIL
  const [typeOfService, setTypeOfService] = useState('Metro Ethernet / IP Transit')
  const [bandwidth, setBandwidth] = useState('100 Mbps')
  const [circuitId, setCircuitId] = useState('')
  const [interfaceType, setInterfaceType] = useState('1000Base-LX / SFP')
  const [equipment, setEquipment] = useState('Patchcord SC-LC, SFP 1G, Helm K3, Rompi Reflektor, Sepatu Safety')
  const [terminationLocation1, setTerminationLocation1] = useState('')
  const [terminationLocation2, setTerminationLocation2] = useState('')

  // Bagian 3: TEST RESULT (3 Dynamic Rows)
  const [testResults, setTestResults] = useState([
    { pingTime: '2 ms', upload: '100 Mbps', download: '100 Mbps', destination: 'Gateway POP' },
    { pingTime: '', upload: '', download: '', destination: '' },
    { pingTime: '', upload: '', download: '', destination: '' }
  ])

  // Bagian 4: NETWORK DATA
  const [ipBlock, setIpBlock] = useState('')
  const [ipPtP1, setIpPtP1] = useState('')
  const [ipPtP2, setIpPtP2] = useState('')

  // Bagian 5: ACCEPTANCE
  const [customerSignName, setCustomerSignName] = useState('')
  const [customerSignDate, setCustomerSignDate] = useState(new Date().toISOString().slice(0, 10))
  const [engineerSignName, setEngineerSignName] = useState(activeUser?.name || 'Field Engineer')
  const [engineerSignDate, setEngineerSignDate] = useState(new Date().toISOString().slice(0, 10))

  const handleTestResultChange = (index, field, value) => {
    const updated = [...testResults]
    updated[index] = { ...updated[index], [field]: value }
    setTestResults(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!address.trim() && !terminationLocation1.trim()) {
      alert('Please fill in the Destination Address or Termination Location!')
      return
    }

    onSubmit({
      pfNo: pfNo.trim() || `PF-${Date.now().toString().slice(-6)}`,
      typeOfOrder,
      otherOrderText: typeOfOrder === 'Others' ? otherOrderText : '',
      companyName: companyName.trim() || 'PT NAP Info Lintas Nusa',
      customerCode: customerCode.trim() || '-',
      customerType,
      address: address.trim() || terminationLocation1.trim() || '-',
      customerName: customerName.trim() || '-',
      telp: telp.trim() || '-',
      picOnsite: picOnsite.trim() || '-',
      email: email.trim() || '-',
      am: am.trim() || '-',
      rfsDate: rfsDate || '-',
      typeOfService: typeOfService.trim() || 'Network Support',
      bandwidth: bandwidth.trim() || '-',
      circuitId: circuitId.trim() || '-',
      interfaceType: interfaceType.trim() || '-',
      equipment: equipment.trim() || 'K3 APD Lengkap',
      terminationLocation1: terminationLocation1.trim() || address.trim() || '-',
      terminationLocation2: terminationLocation2.trim() || '-',
      testResults,
      ipBlock: ipBlock.trim() || '-',
      ipPtP1: ipPtP1.trim() || '-',
      ipPtP2: ipPtP2.trim() || '-',
      customerSignName: customerSignName.trim() || customerName.trim() || '-',
      customerSignDate: customerSignDate || rfsDate || '-',
      engineerSignName: engineerSignName.trim() || activeUser?.name || 'Field Engineer',
      engineerSignDate: engineerSignDate || rfsDate || '-',
      // Legacy compatibility properties
      siteLocation: address.trim() || terminationLocation1.trim(),
      site: address.trim() || terminationLocation1.trim(),
      workType: typeOfService.trim(),
      applicantName: engineerSignName.trim() || activeUser?.name || 'Tim Lapangan',
      company: companyName.trim(),
      startDate: rfsDate,
      endDate: customerSignDate || rfsDate,
      hours: '08:00 - 17:00 WIB',
      workHours: '08:00 - 17:00 WIB',
      safety: equipment.trim(),
      jsaChecklist: equipment.trim(),
      notes: `${typeOfOrder} - ${typeOfService} (${bandwidth})`
    })
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: 16,
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="modal fosis-responsive-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(860px, 96vw)',
          maxHeight: '92vh',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header Dialog */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 16, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>FOSIS•</span>
              <span style={{ color: '#0F172A' }}>Pengajuan Form Ijin Kerja (SIK) / SPK</span>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Format Standar Surat Perintah Kerja (SPK) Network Support PT NAP Info Lintas Nusa
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            style={{ border: 'none', background: '#F1F5F9', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Panel GPS LOCK (Wajib Dipertahankan di Paling Atas) */}
          <div
            style={{
              borderRadius: 12,
              backgroundColor: '#DCFCE7',
              border: '1px solid #86EFAC',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={16} color="#14532D" />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#14532D' }}>
                  GPS LOCK: PERMIT LOCATION LOCKED AUTOMATICALLY
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#166534', background: '#BBF7D0', padding: '2px 8px', borderRadius: 6 }}>
                GPS SENSOR ACTIVE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#166534' }}>
              Detected device coordinates: <strong>{Number(userLatitude).toFixed(5)}, {Number(userLongitude).toFixed(5)}</strong>
            </div>
            <div style={{ marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${userLatitude},${userLongitude}`, '_blank')
                }}
                style={{
                  border: 'none',
                  background: '#1E88E5',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer'
                }}
              >
                <MapPin size={12} />
                <span>Buka di Google Maps</span>
              </button>
            </div>
          </div>

          {/* Bagian Header Order: PF No. & Type of Order */}
          <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: 'min(280px, 100%)' }}>
                <label style={labelStyle}>PF No. *</label>
                <input
                  type="text"
                  required
                  value={pfNo}
                  onChange={(e) => setPfNo(e.target.value)}
                  placeholder="Contoh: PF-2026-0089"
                  style={inputStyle}
                />
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <label style={labelStyle}>Type of Order: *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                  {['New', 'Upgrade/Downgrade', 'Relocation', 'Trial', 'Terminate', 'Others'].map((type) => (
                    <label key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="radio"
                        name="typeOfOrder"
                        checked={typeOfOrder === type}
                        onChange={() => setTypeOfOrder(type)}
                        style={{ accentColor: '#1E3A8A' }}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {typeOfOrder === 'Others' && (
              <div>
                <label style={labelStyle}>Other Order Type Details *</label>
                <input
                  type="text"
                  required
                  value={otherOrderText}
                  onChange={(e) => setOtherOrderText(e.target.value)}
                  placeholder="Specify custom order requirements..."
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Section 1: CUSTOMER INFORMATION */}
          <SectionHeader title="1.   CUSTOMER INFORMATION" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Customer Code</label>
              <input
                type="text"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                placeholder="e.g.: CUST-012"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Customer Type: *</label>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              {['Enterprise', 'Wholesale', 'Broadband', 'Other'].map((ct) => (
                <label key={ct} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="customerType"
                    checked={customerType === ct}
                    onChange={() => setCustomerType(ct)}
                    style={{ accentColor: '#2563EB' }}
                  />
                  <span>{ct}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Destination Site / Address *</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address of destination site installation or fiber pull..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Customer Name</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Client PIC Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone / Mobile</label>
              <input type="text" value={telp} onChange={(e) => setTelp(e.target.value)} placeholder="+62 8xx-xxxx-xxxx" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>On-Site PIC</label>
              <input type="text" value={picOnsite} onChange={(e) => setPicOnsite(e.target.value)} placeholder="On-site contact person" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pic@company.com" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Account Manager (AM)</label>
              <input type="text" value={am} onChange={(e) => setAm(e.target.value)} placeholder="Sales / AM Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>RFS Date (Ready For Service)</label>
              <input type="date" value={rfsDate} onChange={(e) => setRfsDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Section 2: SERVICE DETAIL */}
          <SectionHeader title="2.   SERVICE DETAIL" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Type of Service *</label>
              <input type="text" required value={typeOfService} onChange={(e) => setTypeOfService(e.target.value)} placeholder="e.g.: DIA, MPLS, Metro-E" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Bandwidth *</label>
              <input type="text" required value={bandwidth} onChange={(e) => setBandwidth(e.target.value)} placeholder="e.g.: 100 Mbps, 1 Gbps" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Circuit ID</label>
              <input type="text" value={circuitId} onChange={(e) => setCircuitId(e.target.value)} placeholder="e.g.: CID-SBY-045" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Interface</label>
              <input type="text" value={interfaceType} onChange={(e) => setInterfaceType(e.target.value)} placeholder="e.g.: SFP LX 1G, RJ45" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Equipment &amp; Safety Gear (PPE / APD)</label>
            <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g.: Cisco Switch, Patchcord, Safety Helmet, Reflector Vest" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>Termination Location I</label>
              <input type="text" value={terminationLocation1} onChange={(e) => setTerminationLocation1(e.target.value)} placeholder="Origin POP / Data Center" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Termination Location II</label>
              <input type="text" value={terminationLocation2} onChange={(e) => setTerminationLocation2(e.target.value)} placeholder="Destination Client Site" style={inputStyle} />
            </div>
          </div>

          {/* Bagian 3: TEST RESULT & Bagian 4: NETWORK DATA (Berdampingan) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {/* Bagian 3 */}
            <div>
              <SectionHeader title="3.   TEST RESULT" />
              <div style={{ overflowX: 'auto', marginTop: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#E2E8F0', color: '#1E293B', fontWeight: 800 }}>
                      <th style={thStyle}>Ping Time</th>
                      <th style={thStyle}>Upload</th>
                      <th style={thStyle}>Download</th>
                      <th style={thStyle}>Destination</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((row, idx) => (
                      <tr key={idx}>
                        <td style={tdInputStyle}>
                          <input type="text" value={row.pingTime} onChange={(e) => handleTestResultChange(idx, 'pingTime', e.target.value)} placeholder="2 ms" style={tableInput} />
                        </td>
                        <td style={tdInputStyle}>
                          <input type="text" value={row.upload} onChange={(e) => handleTestResultChange(idx, 'upload', e.target.value)} placeholder="100 Mbps" style={tableInput} />
                        </td>
                        <td style={tdInputStyle}>
                          <input type="text" value={row.download} onChange={(e) => handleTestResultChange(idx, 'download', e.target.value)} placeholder="100 Mbps" style={tableInput} />
                        </td>
                        <td style={tdInputStyle}>
                          <input type="text" value={row.destination} onChange={(e) => handleTestResultChange(idx, 'destination', e.target.value)} placeholder="POP Gubeng" style={tableInput} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 4 */}
            <div>
              <SectionHeader title="4.   NETWORK DATA" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                <div>
                  <label style={labelStyle}>IP Block</label>
                  <input type="text" value={ipBlock} onChange={(e) => setIpBlock(e.target.value)} placeholder="misal: 103.xxx.xxx.xxx/29" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>IP Point to Point I</label>
                  <input type="text" value={ipPtP1} onChange={(e) => setIpPtP1(e.target.value)} placeholder="misal: 10.200.1.1/30" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>IP Point to Point II</label>
                  <input type="text" value={ipPtP2} onChange={(e) => setIpPtP2(e.target.value)} placeholder="misal: 10.200.1.2/30" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 5: ACCEPTANCE */}
          <SectionHeader title="5.   ACCEPTANCE" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            <div style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: 12, background: '#F8FAFC' }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#1E293B', marginBottom: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
                Pihak Customer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Nama Lengkap Customer</label>
                  <input type="text" value={customerSignName} onChange={(e) => setCustomerSignName(e.target.value)} placeholder="Nama Pejabat / PIC" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Tanda Tangan</label>
                  <input type="date" value={customerSignDate} onChange={(e) => setCustomerSignDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={{ border: '1px solid #CBD5E1', borderRadius: 10, padding: 12, background: '#F8FAFC' }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: '#1E293B', marginBottom: 8, borderBottom: '1px solid #E2E8F0', paddingBottom: 4 }}>
                Pihak Field Engineer
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={labelStyle}>Nama Field Engineer (Otomatis)</label>
                  <input type="text" value={engineerSignName} onChange={(e) => setEngineerSignName(e.target.value)} style={{ ...inputStyle, background: '#F1F5F9' }} />
                </div>
                <div>
                  <label style={labelStyle}>Tanggal Tanda Tangan</label>
                  <input type="date" value={engineerSignDate} onChange={(e) => setEngineerSignDate(e.target.value)} style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}
          >
            <button
              type="button"
              onClick={onDismiss}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 24px',
                borderRadius: 8,
                border: 'none',
                background: '#1E3A8A',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)'
              }}
            >
              Save &amp; Submit Work Permit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportPermitsAdminDialog({ activeUser, onDismiss, onImport }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState([])

  const defaultMockSpk = {
    pfNo: `PF-2026-IMP-${Math.floor(1000 + Math.random() * 9000)}`,
    typeOfOrder: 'New',
    otherOrderText: '',
    companyName: 'PT Bank Central Asia Tbk',
    customerCode: 'CUST-BCA-009',
    customerType: 'Enterprise',
    address: 'Menara BCA Lt. 32, Jl. M.H. Thamrin No. 1, Jakarta Pusat',
    customerName: 'Budi Santoso',
    telp: '081288990011',
    picOnsite: 'Andi Wijaya',
    email: 'andi.wijaya@bca.co.id',
    am: 'Sanderlina Imelda',
    rfsDate: new Date().toISOString().slice(0, 10),
    typeOfService: 'Metro Ethernet / IP Transit',
    bandwidth: '500 Mbps',
    circuitId: 'CID-BCA-JKT-0982',
    interfaceType: '1000Base-LX / SFP Optical',
    equipment: 'Switch Cisco Catalyst 3850, Patchcord SingleMode SC-LC, APD K3 Lengkap',
    terminationLocation1: 'POP Cyber 1 Building Lt. 2',
    terminationLocation2: 'Server Room Menara BCA Lt. 32',
    testResults: [
      { pingTime: '1 ms', upload: '500 Mbps', download: '500 Mbps', destination: 'Gateway POP Cyber' },
      { pingTime: '2 ms', upload: '498 Mbps', download: '499 Mbps', destination: 'DNS 1.1.1.1' },
      { pingTime: '', upload: '', download: '', destination: '' }
    ],
    ipBlock: '103.145.22.0/29',
    ipPtP1: '10.100.24.1/30',
    ipPtP2: '10.100.24.2/30',
    customerSignName: 'Budi Santoso',
    customerSignDate: new Date().toISOString().slice(0, 10),
    engineerSignName: activeUser?.name || 'Sanderlina Imelda',
    engineerSignDate: new Date().toISOString().slice(0, 10),
    siteLocation: 'Menara BCA Lt. 32, Jakarta Pusat',
    site: 'Menara BCA Lt. 32, Jakarta Pusat',
    workType: 'Metro Ethernet / IP Transit',
    applicantName: activeUser?.name || 'Field Operations',
    company: 'PT Bank Central Asia Tbk',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    hours: '08:00 - 17:00 WIB',
    safety: 'Helm K3, Rompi Reflektor, Sepatu Safety',
    createdBy: activeUser?.id,
    creatorName: activeUser?.name,
    importedByAdmin: true
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setIsParsing(true)

    const fileName = file.name.toLowerCase()
    const reader = new FileReader()

    if (fileName.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result)
          const items = Array.isArray(json) ? json : [json]
          const mapped = items.map((item, idx) => mapToSpkRecord(item, activeUser, idx))
          setParsedItems(mapped)
        } catch (err) {
          alert('Format JSON tidak valid!')
        } finally {
          setIsParsing(false)
        }
      }
      reader.readAsText(file)
    } else if (fileName.endsWith('.csv')) {
      reader.onload = (event) => {
        try {
          const text = event.target.result
          const lines = text.split('\n').filter((l) => l.trim())
          const mapped = []
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim())
            if (cols.length >= 2) {
              mapped.push(
                mapToSpkRecord(
                  {
                    pfNo: cols[0] || `PF-CSV-${Date.now().toString().slice(-4)}`,
                    companyName: cols[1] || 'PT NAP Info Lintas Nusa',
                    address: cols[2] || cols[1] || 'Site Project',
                    typeOfService: cols[3] || 'Network Support',
                    bandwidth: cols[4] || '100 Mbps'
                  },
                  activeUser,
                  i
                )
              )
            }
          }
          setParsedItems(mapped.length > 0 ? mapped : [defaultMockSpk])
        } catch (err) {
          alert('Failed to read CSV file!')
        } finally {
          setIsParsing(false)
        }
      }
      reader.readAsText(file)
    } else {
      // PDF or general file fallback extraction
      reader.onload = (event) => {
        try {
          const textContent = String(event.target.result || '')
          // Simple regex text extraction from PDF stream or text
          const pfMatch = textContent.match(/PF[\s.:_-]*([A-Za-z0-9-]+)/i)
          const compMatch = textContent.match(/Company[\s.:_-]*([A-Za-z0-9\s.]+)/i)
          const cidMatch = textContent.match(/Circuit[\s.:_-]*ID[\s.:_-]*([A-Za-z0-9-]+)/i)

          const extracted = {
            ...defaultMockSpk,
            pfNo: pfMatch ? pfMatch[0].trim() : `PF-PDF-${Date.now().toString().slice(-4)}`,
            companyName: compMatch ? compMatch[1].trim() : file.name.replace(/\.[^/.]+$/, ''),
            circuitId: cidMatch ? cidMatch[1].trim() : 'CID-EXTRACTED'
          }
          setParsedItems([extracted])
        } catch (err) {
          setParsedItems([defaultMockSpk])
        } finally {
          setIsParsing(false)
        }
      }
      reader.readAsText(file.slice(0, 100000))
    }
  }

  const handleSimulateLoadMock = () => {
    setParsedItems([defaultMockSpk])
  }

  const handleExecuteImport = () => {
    const listToImport = parsedItems.length > 0 ? parsedItems : [defaultMockSpk]
    onImport(listToImport)
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
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
          width: 'min(580px, 94vw)',
          background: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 15, color: '#1E3A8A' }}>
            <Upload size={18} color="#2563EB" />
            <span>Import Berkas SPK / SIK (PDF, JSON, CSV)</span>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
            Upload Work Order (SPK) document in <strong>.pdf</strong>, <strong>.json</strong>, or <strong>.csv</strong> format. The FOSIS system will automatically parse and map the data into the official 5-part visual SPK template.
          </div>

          {/* Upload Area */}
          <label
            style={{
              border: '2px dashed #93C5FD',
              borderRadius: 14,
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: '#EFF6FF',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s ease'
            }}
          >
            <Upload size={28} color="#2563EB" />
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1E3A8A' }}>
              {selectedFile ? selectedFile.name : 'Choose PDF / JSON / CSV File'}
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              Click here to select a work order permit document file from your workstation
            </div>
            <input
              type="file"
              accept=".pdf,.json,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>

          {/* Quick Mock Simulation Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSimulateLoadMock}
              style={{
                background: 'transparent',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#2563EB',
                cursor: 'pointer'
              }}
            >
              Simulasi Muat Contoh SPK PDF (Menara BCA)
            </button>
          </div>

          {/* Preview Parsed Summary */}
          {parsedItems.length > 0 && (
            <div
              style={{
                borderRadius: 12,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="#16A34A" />
                <span>Terdeteksi {parsedItems.length} Dokumen SPK Siap Diimpor:</span>
              </div>
              {parsedItems.map((item, idx) => (
                <div key={idx} style={{ fontSize: 11, color: '#475569', paddingLeft: 20 }}>
                  • <strong>{item.pfNo}</strong> — {item.companyName} ({item.bandwidth})
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
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
            onClick={handleExecuteImport}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#1E3A8A',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)'
            }}
          >
            <CheckCircle2 size={14} />
            <span>Jalankan Import &amp; Buka Preview SPK</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function mapToSpkRecord(raw, activeUser, idx = 0) {
  const autoNo = raw.pfNo || raw.permitNo || `PF-${new Date().getFullYear()}-${String(100 + idx).padStart(4, '0')}`
  return {
    pfNo: autoNo,
    typeOfOrder: raw.typeOfOrder || 'New',
    otherOrderText: raw.otherOrderText || '',
    companyName: raw.companyName || raw.company || raw.vendor || 'PT NAP Info Lintas Nusa',
    customerCode: raw.customerCode || '-',
    customerType: raw.customerType || 'Enterprise',
    address: raw.address || raw.siteLocation || raw.site || '-',
    customerName: raw.customerName || raw.applicantName || '-',
    telp: raw.telp || '-',
    picOnsite: raw.picOnsite || '-',
    email: raw.email || '-',
    am: raw.am || '-',
    rfsDate: raw.rfsDate || raw.startDate || new Date().toISOString().slice(0, 10),
    typeOfService: raw.typeOfService || raw.workType || 'Network Support',
    bandwidth: raw.bandwidth || '100 Mbps',
    circuitId: raw.circuitId || '-',
    interfaceType: raw.interfaceType || '-',
    equipment: raw.equipment || raw.safety || 'K3 APD Lengkap',
    terminationLocation1: raw.terminationLocation1 || raw.site || '-',
    terminationLocation2: raw.terminationLocation2 || '-',
    testResults: raw.testResults || [
      { pingTime: '2 ms', upload: '100 Mbps', download: '100 Mbps', destination: 'Gateway POP' },
      { pingTime: '', upload: '', download: '', destination: '' },
      { pingTime: '', upload: '', download: '', destination: '' }
    ],
    ipBlock: raw.ipBlock || '-',
    ipPtP1: raw.ipPtP1 || '-',
    ipPtP2: raw.ipPtP2 || '-',
    customerSignName: raw.customerSignName || raw.customerName || '',
    customerSignDate: raw.customerSignDate || raw.endDate || '',
    engineerSignName: raw.engineerSignName || (activeUser ? activeUser.name : 'Field Engineer'),
    engineerSignDate: raw.engineerSignDate || raw.startDate || '',
    siteLocation: raw.address || raw.siteLocation || raw.site || '-',
    site: raw.address || raw.siteLocation || raw.site || '-',
    workType: raw.typeOfService || raw.workType || 'Network Support',
    applicantName: raw.engineerSignName || (activeUser ? activeUser.name : 'Field Operations'),
    company: raw.companyName || raw.company || 'PT NAP Info Lintas Nusa',
    startDate: raw.rfsDate || raw.startDate || new Date().toISOString().slice(0, 10),
    endDate: raw.customerSignDate || raw.endDate || new Date().toISOString().slice(0, 10),
    hours: '08:00 - 17:00 WIB',
    safety: raw.equipment || raw.safety || 'K3 APD Lengkap',
    createdBy: activeUser ? activeUser.id : null,
    creatorName: activeUser ? activeUser.name : null,
    importedByAdmin: true
  }
}

function SectionHeader({ title }) {
  return (
    <div
      style={{
        backgroundColor: '#475569',
        color: '#FFFFFF',
        fontWeight: 800,
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 11,
        letterSpacing: '0.4px',
        marginTop: 4
      }}
    >
      {title}
    </div>
  )
}

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#334155',
  display: 'block',
  marginBottom: 3
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  fontSize: 12,
  outline: 'none',
  background: '#FFFFFF',
  color: '#0F172A'
}

const thStyle = {
  border: '1px solid #CBD5E1',
  padding: '6px 8px',
  textAlign: 'center',
  fontSize: 10.5
}

const tdInputStyle = {
  border: '1px solid #CBD5E1',
  padding: '2px'
}

const tableInput = {
  width: '100%',
  border: 'none',
  padding: '5px 6px',
  fontSize: 11,
  outline: 'none',
  textAlign: 'center',
  background: 'transparent'
}

