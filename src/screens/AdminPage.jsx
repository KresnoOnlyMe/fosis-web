import React, { useMemo, useState } from 'react'
import {
  FileSpreadsheet,
  Files,
  Plus,
  Search,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Send,
  Edit2,
  X,
  ChevronDown,
  ShieldCheck,
  Check,
  MapPin,
  Printer
} from 'lucide-react'
import { useFosis } from '../context/FosisContext'
import { useToast } from '../context/ToastContext'
import TicketList from '../components/ui/TicketList'
import { canCreateTicket, canEditRecord, canShareTicketPdfToWA } from '../utils/permissions'
import PrintableTicket from '../components/dialogs/PrintableTicket'

// Master reference structure for FOSIS Administration
export const ADMIN_STRUCTURE = {
  DAYS: Array.from({ length: 31 }, (_, i) => String(i + 1)),
  MONTHS: [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ],
  YEARS: ['2025', '2026', '2027'],
  TASKS: ['REPORT', 'PERMIT', 'REKONSILIASI', 'TICKET', 'PEMBELIAN'],
  SUB_TASKS: [
    'FINANCE', 'VENDOR', 'FAM', 'PROCUREMENT', 'EXTERNAL',
    'CUSTOMER CARE', 'CLS', 'NOC', 'SERDEL', 'NAM',
    'FIELD ENGINEER', 'PROJECT', 'MONTHLY', 'YEARLY', 'MIDDLE YEAR'
  ],
  SUB_TASKS_1: [
    'TRAVEL REQUEST', 'CASH ADVANCE', 'PATTYCASH', 'VE MANAGED SERVICE',
    'VE MATERIAL', 'VE STOCK OPNAME', 'VE BAST', 'VE BAK', 'BAK',
    'MATERIAL', 'SURAT IJIN', 'OPEN TICKET', 'CLOSED TICKET',
    'PERBAIKAN', 'PROPOSAL', 'MEETING'
  ],
  VIA: ['WA', 'TEAMS', 'EMAIL', 'PORTAL', 'VISIT', 'HARDCOPY', 'SOFTCOPY'],
  STATUS: ['DONE', 'CONTINUE', 'ON HOLD', 'CANCEL'],
  KATEGORI: ['REQUEST INTERNAL', 'REQUEST EXTERNAL', 'REFUNDS'],
  ACTIVITY: [
    'SERVICE OPERATION', 'SERVICE MAINTENACE', 'VENDOR',
    'REG. SURABAYA', 'REG. BANDUNG', 'ADMIN'
  ]
}

export default function AdminPage({ onAdd, onSelect, onEdit }) {
  const { tickets, activeUser, addTicket, updateTicket } = useFosis()
  const { success, warning } = useToast()

  const [viewMode, setViewMode] = useState('matrix') // 'matrix' or 'cards'
  const [searchQuery, setSearchQuery] = useState('')

  // Filter states
  const [filterMonth, setFilterMonth] = useState('ALL')
  const [filterYear, setFilterYear] = useState('ALL')
  const [filterTask, setFilterTask] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterKategori, setFilterKategori] = useState('ALL')
  const [filterActivity, setFilterActivity] = useState('ALL')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  // Modal State for Input / Edit Administrasi FOSIS
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Preview Document Modal state
  const [previewTicket, setPreviewTicket] = useState(null)

  // SINGLE SOURCE OF TRUTH: All administration items
  const adminItems = useMemo(() => {
    return tickets.filter((t) => (t.type || '').toUpperCase() === 'ADMINISTRASI')
  }, [tickets])

  // Summary Metrics calculated dynamically
  const metrics = useMemo(() => {
    const total = adminItems.length
    const done = adminItems.filter((i) => (i.adminStatus || i.status || '').toUpperCase() === 'DONE').length
    const continuing = adminItems.filter((i) => (i.adminStatus || i.status || '').toUpperCase() === 'CONTINUE').length
    const onHold = adminItems.filter((i) => (i.adminStatus || i.status || '').toUpperCase() === 'ON HOLD').length
    const cancel = adminItems.filter((i) => (i.adminStatus || i.status || '').toUpperCase() === 'CANCEL').length

    return { total, done, continuing, onHold, cancel }
  }, [adminItems])

  // Filtered rows
  const filteredItems = useMemo(() => {
    return adminItems.filter((item) => {
      // Month
      if (filterMonth !== 'ALL' && (item.bulan || '').toUpperCase() !== filterMonth) return false
      // Year
      if (filterYear !== 'ALL' && String(item.tahun || '') !== filterYear) return false

      // Task
      const itemTask = (item.adminTask || item.task || '').toUpperCase()
      if (filterTask !== 'ALL' && itemTask !== filterTask) return false

      // Status
      const itemStatus = (item.adminStatus || item.status || '').toUpperCase()
      if (filterStatus !== 'ALL' && itemStatus !== filterStatus) return false

      // Kategori
      const itemKategori = (item.adminKategori || item.kategori || '').toUpperCase()
      if (filterKategori !== 'ALL' && itemKategori !== filterKategori) return false

      // Activity
      const itemActivity = (item.adminActivity || item.activity || '').toUpperCase()
      if (filterActivity !== 'ALL' && itemActivity !== filterActivity) return false

      // Search Query
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase().trim()
      const searchFields = [
        item.ticketNo,
        item.title,
        itemTask,
        item.subTask,
        item.subTask1,
        item.viaChannel || item.via,
        itemStatus,
        itemKategori,
        itemActivity,
        item.siteLocationName || item.site,
        item.engineerName || item.pic || item.creatorName,
        item.materialUsed || item.material,
        item.secretNotes || item.notes
      ]
      return searchFields.some((f) => f && String(f).toLowerCase().includes(q))
    })
  }, [
    adminItems,
    searchQuery,
    filterMonth,
    filterYear,
    filterTask,
    filterStatus,
    filterKategori,
    filterActivity
  ])

  // Paginated items
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  if (safeCurrentPage !== currentPage && totalPages > 0) {
    setCurrentPage(safeCurrentPage)
  }

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage
    return filteredItems.slice(start, start + rowsPerPage)
  }, [filteredItems, safeCurrentPage, rowsPerPage])

  const handleResetFilter = () => {
    setSearchQuery('')
    setFilterMonth('ALL')
    setFilterYear('ALL')
    setFilterTask('ALL')
    setFilterStatus('ALL')
    setFilterKategori('ALL')
    setFilterActivity('ALL')
    setCurrentPage(1)
  }

  // Open modal handlers
  const handleOpenAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  // Export CSV handler
  const handleExportCSV = () => {
    const csvHeader = 'Date,Month,Year,TASK,SUB TASK,SUB TASK 1,Via,Status,Category,Activity,Ticket No,Location,Notes\n'
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""'
      const str = String(val).replace(/"/g, '""')
      return `"${str}"`
    }

    const csvRows = filteredItems
      .map((i) => {
        const tgl = i.tanggal ?? '-'
        const bln = i.bulan ?? '-'
        const thn = i.tahun ?? '-'
        const tsk = i.adminTask || i.task || '-'
        const sub = i.subTask ?? '-'
        const sub1 = i.subTask1 ?? '-'
        const via = i.viaChannel || i.via || '-'
        const st = i.adminStatus || i.status || '-'
        const kat = i.adminKategori || i.kategori || '-'
        const act = i.adminActivity || i.activity || '-'
        const no = i.ticketNo ?? '-'
        const lok = i.siteLocationName || i.site || '-'
        const notes = i.secretNotes || i.notes || '-'
        return [tgl, bln, thn, tsk, sub, sub1, via, st, kat, act, no, lok, notes].map(escapeCsv).join(',')
      })
      .join('\n')

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FOSIS_Administration_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    success('Administration data exported to CSV!')
  }

  return (
    <div className="page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>
            Administration
          </h1>
          <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>
            Manage administrative tasks, documents, regional coordination, and operational logistics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {canCreateTicket(activeUser, 'ADMINISTRASI') && (
            <button
              type="button"
              onClick={handleOpenAdd}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: 'none',
                background: '#4654F5',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(70, 84, 245, 0.3)'
              }}
            >
              <Plus size={15} />
              <span>Add Administration</span>
            </button>
          )}
        </div>
      </div>

      {/* COMPACT SUMMARY METRICS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 10
        }}
      >
        <div style={metricCardStyle('#2563EB', '#EFF6FF')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF' }}>TOTAL DATA</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#1E3A8A', marginTop: 2 }}>{metrics.total}</div>
        </div>

        <div style={metricCardStyle('#16A34A', '#DCFCE7')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>DONE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#15803D', marginTop: 2 }}>{metrics.done}</div>
        </div>

        <div style={metricCardStyle('#0284C7', '#E0F2FE')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0369A1' }}>CONTINUE</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0284C7', marginTop: 2 }}>{metrics.continuing}</div>
        </div>

        <div style={metricCardStyle('#38BDF8', '#F0F9FF')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0284C7' }}>ON HOLD</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0369A1', marginTop: 2 }}>{metrics.onHold}</div>
        </div>

        <div style={metricCardStyle('#DC2626', '#FEE2E2')}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B' }}>CANCEL</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#DC2626', marginTop: 2 }}>{metrics.cancel}</div>
        </div>
      </div>

      {/* FILTER TOOLBAR & TAB SWITCHER */}
      <div
        style={{
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '16px 20px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              style={tabBtnStyle(viewMode === 'matrix')}
            >
              <FileSpreadsheet size={14} />
              <span>Tabel Matriks (Master Excel)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              style={tabBtnStyle(viewMode === 'cards')}
            >
              <Files size={14} />
              <span>Daftar Tiket &amp; Berkas ({filteredItems.length})</span>
            </button>
          </div>

          <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
            Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{adminItems.length}</strong> data administrasi
          </div>
        </div>

        {/* 2-ROW HORIZONTAL FILTER TOOLBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Row 1: Search + Bulan + Tahun + Status + Reset */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Cari no tiket, judul, task, sub task, via, kategori, atau activity..."
                style={{ ...inputStyle, paddingLeft: 34, height: 40 }}
              />
            </div>

            {/* Bulan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={filterLabelStyle}>Bulan:</span>
              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 40, minWidth: 125 }}
              >
                <option value="ALL">All Months</option>
                {ADMIN_STRUCTURE.MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={filterLabelStyle}>Year:</span>
              <select
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 40, minWidth: 105 }}
              >
                <option value="ALL">All Years</option>
                {ADMIN_STRUCTURE.YEARS.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={filterLabelStyle}>Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 40, minWidth: 120 }}
              >
                <option value="ALL">All Statuses</option>
                {ADMIN_STRUCTURE.STATUS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleResetFilter}
              title="Reset Filter"
              style={{
                height: 40,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>

          {/* Row 2: Filter Tambahan (Task Utama + Kategori + Activity) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 4,
              borderTop: '1px dashed #F1F5F9'
            }}
          >
            {/* Primary Task */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px' }}>
              <span style={filterLabelStyle}>TASK:</span>
              <select
                value={filterTask}
                onChange={(e) => {
                  setFilterTask(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 38, width: '100%' }}
              >
                <option value="ALL">All Tasks</option>
                {ADMIN_STRUCTURE.TASKS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 180px' }}>
              <span style={filterLabelStyle}>Category:</span>
              <select
                value={filterKategori}
                onChange={(e) => {
                  setFilterKategori(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 38, width: '100%' }}
              >
                <option value="ALL">All Categories</option>
                {ADMIN_STRUCTURE.KATEGORI.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>
            </div>

            {/* Activity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px' }}>
              <span style={filterLabelStyle}>Activity:</span>
              <select
                value={filterActivity}
                onChange={(e) => {
                  setFilterActivity(e.target.value)
                  setCurrentPage(1)
                }}
                style={{ ...selectStyle, height: 38, width: '100%' }}
              >
                <option value="ALL">All Activities</option>
                {ADMIN_STRUCTURE.ACTIVITY.map((act) => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status count indicator */}
        <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
          Menampilkan {filteredItems.length === 0 ? '0–0' : `${(safeCurrentPage - 1) * rowsPerPage + 1}–${Math.min(safeCurrentPage * rowsPerPage, filteredItems.length)}`} dari <strong>{filteredItems.length}</strong> data Administrasi (20/halaman)
        </div>
      </div>

      {/* CONTENT: TABEL MATRIKS (EXCEL) OR CARD LIST */}
      {viewMode === 'matrix' ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
          }}
        >
          <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 10, borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={thStyle}>TANGGAL</th>
                  <th style={thStyle}>BULAN</th>
                  <th style={thStyle}>TAHUN</th>
                  <th style={thStyle}>TASK</th>
                  <th style={thStyle}>SUB TASK</th>
                  <th style={thStyle}>SUB TASK 1</th>
                  <th style={thStyle}>VIA</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>KATEGORI</th>
                  <th style={thStyle}>ACTIVITY</th>
                  <th style={thStyle}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                      Tidak ada data administrasi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((row) => {
                    const canEditThis = canEditRecord(activeUser, row)
                    const canShareThisWA = canShareTicketPdfToWA(activeUser, row)

                    return (
                      <tr
                        key={row.id}
                        onClick={() => onSelect?.(row)}
                        style={{
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                      >
                        <td style={tdStyle}>
                          <strong>{row.tanggal || '1'}</strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={badgeStyle('#2563EB', '#EFF6FF')}>{row.bulan || 'JANUARY'}</span>
                        </td>
                        <td style={tdStyle}>{row.tahun || '2026'}</td>
                        <td style={tdStyle}>
                          <span style={taskBadgeStyle(row.adminTask || row.task)}>
                            {row.adminTask || row.task || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>{row.subTask || '-'}</td>
                        <td style={tdStyle}>
                          <strong>{row.subTask1 || '-'}</strong>
                        </td>
                        <td style={tdStyle}>
                          <span style={badgeStyle('#0F766E', '#F0FDFA')}>{row.viaChannel || row.via || 'PORTAL'}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={statusBadgeStyle(row.adminStatus || row.status)}>
                            {row.adminStatus || row.status || 'DONE'}
                          </span>
                        </td>
                        <td style={tdStyle}>{row.adminKategori || row.kategori || '-'}</td>
                        <td style={tdStyle}>
                          <strong>{row.adminActivity || row.activity || '-'}</strong>
                        </td>
                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* Tombol PDF (Preview A4) */}
                            <button
                              type="button"
                              title="Preview PDF LHP"
                              onClick={() => setPreviewTicket(row)}
                              style={{
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                borderRadius: 6,
                                padding: '3px 7px',
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: '#DC2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                            >
                              <FileText size={11} />
                              <span>PDF</span>
                            </button>

                            {/* Tombol WA (Preview A4 & Send WA PDF) */}
                            {canShareThisWA && (
                              <button
                                type="button"
                                title="Kirim WA PDF"
                                onClick={() => setPreviewTicket(row)}
                                style={{
                                  border: 'none',
                                  background: '#16A34A',
                                  borderRadius: 6,
                                  padding: '3px 7px',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                              >
                                <Send size={11} />
                                <span>WA</span>
                              </button>
                            )}

                            {/* Tombol Edit */}
                            {canEditThis && (
                              <button
                                type="button"
                                title="Edit Administrasi"
                                onClick={() => handleOpenEdit(row)}
                                style={{
                                  border: '1px solid #BFDBFE',
                                  background: '#EFF6FF',
                                  borderRadius: 6,
                                  padding: '3px 7px',
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: '#2563EB',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3
                                }}
                              >
                                <Edit2 size={11} />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Tombol Detail */}
                            <button
                              type="button"
                              onClick={() => onSelect?.(row)}
                              style={{
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                borderRadius: 6,
                                padding: '3px 7px',
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: '#475569',
                                cursor: 'pointer'
                              }}
                            >
                              Detail
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 11.5,
              color: '#475569'
            }}
          >
            <div>
              Menampilkan {filteredItems.length === 0 ? '0–0' : `${(safeCurrentPage - 1) * rowsPerPage + 1}–${Math.min(safeCurrentPage * rowsPerPage, filteredItems.length)}`} dari <strong>{filteredItems.length}</strong> data (20/halaman)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: safeCurrentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage <= 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                Sebelumnya
              </button>

              <span style={{ fontWeight: 800, padding: '0 4px' }}>
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: safeCurrentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage >= totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TicketList items={paginatedItems} onSelect={onSelect} onEdit={handleOpenEdit} />

          {/* Pagination Toolbar for Cards Mode */}
          <div
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 11.5,
              color: '#475569'
            }}
          >
            <div>
              Menampilkan {filteredItems.length === 0 ? '0–0' : `${(safeCurrentPage - 1) * rowsPerPage + 1}–${Math.min(safeCurrentPage * rowsPerPage, filteredItems.length)}`} dari <strong>{filteredItems.length}</strong> data (20/halaman)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: safeCurrentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage <= 1 ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                Sebelumnya
              </button>

              <span style={{ fontWeight: 800, padding: '0 4px' }}>
                {safeCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  background: safeCurrentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
                  color: safeCurrentPage >= totalPages ? '#94A3B8' : '#334155',
                  cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 700
                }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: INPUT / EDIT ADMINISTRASI FOSIS (SESUAI STRUKTUR GAMBAR 2) */}
      {/* ============================================================ */}
      {isModalOpen && (
        <AdminFormModal
          isOpen={isModalOpen}
          item={editingItem}
          currentUser={activeUser}
          onClose={() => {
            setIsModalOpen(false)
            setEditingItem(null)
          }}
          onSubmit={(formData) => {
            if (editingItem) {
              const res = updateTicket(editingItem.id, formData)
              if (res && res.success === false) {
                warning(res.message || 'Failed to update administration record.')
              } else {
                success('Administration record updated successfully!')
                setIsModalOpen(false)
                setEditingItem(null)
              }
            } else {
              const res = addTicket(formData)
              if (res && res.success === false) {
                warning(res.message || 'Failed to add administration record.')
              } else {
                success('Administration record added successfully!')
                setIsModalOpen(false)
                setEditingItem(null)
              }
            }
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: PREVIEW DOKUMEN A4 SEBELUM CETAK / WA             */}
      {/* ============================================================ */}
      {previewTicket && (
        <PrintableTicket
          ticket={previewTicket}
          currentUser={activeUser}
          onClose={() => setPreviewTicket(null)}
        />
      )}
    </div>
  )
}

/**
 * FORM MODAL INPUT ADMINISTRASI FOSIS
 * 100% Mengikuti Urutan dan Opsi Struktur Tabel Referensi:
 * 1. Tanggal (Dropdown 1-31)
 * 2. Bulan (Dropdown JANUARY - DECEMBER)
 * 3. Tahun (Dropdown 2025, 2026, 2027)
 * 4. TASK (REPORT, PERMIT, REKONSILIASI, TICKET, PEMBELIAN)
 * 5. SUB TASK (FINANCE, VENDOR, FAM, PROCUREMENT, EXTERNAL, CUSTOMER CARE, CLS, NOC, SERDEL, NAM, FIELD ENGINEER, PROJECT, MONTHLY, YEARLY, MIDDLE YEAR)
 * 6. SUB TASK 1 (TRAVEL REQUEST, CASH ADVANCE, PATTYCASH, VE MANAGED SERVICE, VE MATERIAL, VE STOCK OPNAME, VE BAST, VE BAK, BAK, MATERIAL, SURAT IJIN, OPEN TICKET, CLOSED TICKET, PERBAIKAN, PROPOSAL, MEETING)
 * 7. Via (WA, TEAMS, EMAIL, PORTAL, VISIT, HARDCOPY, SOFTCOPY)
 * 8. Status (DONE, CONTINUE, ON HOLD, CANCEL)
 * 9. Kategori (REQUEST INTERNAL, REQUEST EXTERNAL, REFUNDS)
 * 10. Activity (SERVICE OPERATION, SERVICE MAINTENACE, VENDOR, REG. SURABAYA, REG. BANDUNG, ADMIN)
 * + Input Tambahan: Judul, Lokasi, Prioritas, Catatan
 */
function AdminFormModal({ isOpen, item, currentUser, onClose, onSubmit }) {
  const isEdit = Boolean(item)

  const [tanggal, setTanggal] = useState(item?.tanggal ? String(item.tanggal) : '1')
  const [bulan, setBulan] = useState(item?.bulan || 'JANUARY')
  const [tahun, setTahun] = useState(item?.tahun ? String(item.tahun) : '2026')
  const [task, setTask] = useState(item?.adminTask || item?.task || 'REPORT')
  const [subTask, setSubTask] = useState(item?.subTask || 'FINANCE')
  const [subTask1, setSubTask1] = useState(item?.subTask1 || 'TRAVEL REQUEST')
  const [via, setVia] = useState(item?.viaChannel || item?.via || 'WA')
  const [status, setStatus] = useState(item?.adminStatus || item?.status || 'DONE')
  const [kategori, setKategori] = useState(item?.adminKategori || item?.kategori || 'REQUEST INTERNAL')
  const [activity, setActivity] = useState(item?.adminActivity || item?.activity || 'SERVICE OPERATION')

  // Input Tambahan
  const [title, setTitle] = useState(item?.title || '')
  const [siteLocation, setSiteLocation] = useState(item?.siteLocationName || item?.site || '')
  const [isUrgent, setIsUrgent] = useState(Boolean(item?.isUrgent || item?.urgent))
  const [notes, setNotes] = useState(item?.secretNotes || item?.notes || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please fill in the Job / Task Description.')
      return
    }

    const payload = {
      type: 'ADMINISTRASI',
      title: title.trim(),
      tanggal: parseInt(tanggal, 10) || 1,
      bulan,
      tahun,
      adminTask: task,
      task,
      subTask,
      subTask1,
      viaChannel: via,
      via,
      adminStatus: status,
      status,
      adminKategori: kategori,
      kategori,
      adminActivity: activity,
      activity,
      siteLocation: siteLocation.trim(),
      siteLocationName: siteLocation.trim(),
      site: siteLocation.trim(),
      isUrgent,
      urgent: isUrgent,
      secretNotes: notes.trim(),
      notes: notes.trim(),
      createdBy: currentUser?.id || '1',
      creatorName: currentUser?.name || 'Admin',
      pic: currentUser?.name || 'Admin'
    }

    onSubmit(payload)
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
          width: 'min(780px, 96vw)',
          maxHeight: '92vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.3)',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>
                {isEdit ? 'Edit Administrasi FOSIS' : 'Input Administrasi FOSIS'}
              </h2>
              <span
                style={{
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: 6,
                  textTransform: 'uppercase'
                }}
              >
                ADMINISTRASI
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
              Pencatatan kegiatan administrasi, dokumen, koordinasi, dan logistik operasional FOSIS.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
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
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              flex: 1
            }}
          >
            {/* Additional Input: Job Title (Required) */}
            <div>
              <label style={labelStyle}>
                Job Title / Brief Summary <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: BAK / BAST Vendor GENTRI Regional Surabaya Reconciliation"
                style={modalInputStyle}
              />
            </div>

            {/* Administrative Parameters Row 1: 1. Date, 2. Month, 3. Year */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {/* 1. DATE (Dropdown 1-31) */}
              <div>
                <label style={labelStyle}>
                  1. Date (1–31) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  style={modalSelectStyle}
                >
                  {ADMIN_STRUCTURE.DAYS.map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. MONTH (Dropdown JANUARY - DECEMBER) */}
              <div>
                <label style={labelStyle}>
                  2. Month <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(e.target.value)}
                  style={modalSelectStyle}
                >
                  {ADMIN_STRUCTURE.MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. YEAR (Dropdown 2025, 2026, 2027) */}
              <div>
                <label style={labelStyle}>
                  3. Year <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  style={modalSelectStyle}
                >
                  {ADMIN_STRUCTURE.YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Administrative Parameters Row 2: 4. TASK, 5. SUB TASK */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {/* 4. TASK (Primary Task) */}
              <div>
                <label style={labelStyle}>
                  4. TASK (Primary Task) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 700 }}
                >
                  {ADMIN_STRUCTURE.TASKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. SUB TASK */}
              <div>
                <label style={labelStyle}>
                  5. SUB TASK <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={subTask}
                  onChange={(e) => setSubTask(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 700 }}
                >
                  {ADMIN_STRUCTURE.SUB_TASKS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Administrative Parameters Row 3: 6. SUB TASK 1, 7. Via */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {/* 6. SUB TASK 1 */}
              <div>
                <label style={labelStyle}>
                  6. SUB TASK 1 <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={subTask1}
                  onChange={(e) => setSubTask1(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 700 }}
                >
                  {ADMIN_STRUCTURE.SUB_TASKS_1.map((st1) => (
                    <option key={st1} value={st1}>
                      {st1}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Via (Communication Channel) */}
              <div>
                <label style={labelStyle}>
                  7. Via (Communication Channel) <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={via}
                  onChange={(e) => setVia(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 700 }}
                >
                  {ADMIN_STRUCTURE.VIA.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Administrative Parameters Row 4: 8. Status, 9. Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {/* 8. Status */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={labelStyle}>
                    8. Status <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <span style={statusBadgeStyle(status)}>{status}</span>
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 800 }}
                >
                  {ADMIN_STRUCTURE.STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9. Category */}
              <div>
                <label style={labelStyle}>
                  9. Category <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  style={{ ...modalSelectStyle, fontWeight: 700 }}
                >
                  {ADMIN_STRUCTURE.KATEGORI.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Administrative Parameters Row 5: 10. Activity */}
            <div>
              <label style={labelStyle}>
                10. Activity <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                style={{ ...modalSelectStyle, fontWeight: 700 }}
              >
                {ADMIN_STRUCTURE.ACTIVITY.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Input: Associated Site / Location (Optional) */}
            <div>
              <label style={labelStyle}>
                Associated Site / Location (Optional)
              </label>
              <input
                type="text"
                value={siteLocation}
                onChange={(e) => setSiteLocation(e.target.value)}
                placeholder="Example: POP Surabaya Gubeng, Server Room Matrix Building"
                style={modalInputStyle}
              />
            </div>

            {/* Checkbox: Administrative Priority (Urgent) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <input
                type="checkbox"
                id="urgent-adm-check"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="urgent-adm-check" style={{ fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                Flag as Urgent / Priority Administrative Task
              </label>
            </div>

            {/* Additional Input: Administrative Notes */}
            <div>
              <label style={labelStyle}>
                Administrative Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter document reference, billing account, vendor contact, or workflow remarks..."
                style={{
                  ...modalInputStyle,
                  height: 'auto',
                  padding: '10px 12px',
                  resize: 'vertical',
                  fontSize: 12.5
                }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid #E2E8F0',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10
            }}
          >
            <button
              type="button"
              onClick={onClose}
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
                background: '#4654F5',
                color: '#FFFFFF',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(70, 84, 245, 0.35)'
              }}
            >
              {isEdit ? 'Save Changes' : 'Save Administration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const filterLabelStyle = {
  fontSize: 11.5,
  fontWeight: 800,
  color: '#475569',
  whiteSpace: 'nowrap'
}

function metricCardStyle(color, bg) {
  return {
    borderRadius: 14,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    padding: '12px 14px',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)'
  }
}

function tabBtnStyle(isActive) {
  return {
    padding: '7px 14px',
    borderRadius: 8,
    border: '1px solid',
    borderColor: isActive ? '#4654F5' : '#CBD5E1',
    background: isActive ? '#EEF2FF' : '#FFFFFF',
    color: isActive ? '#4654F5' : '#475569',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s ease'
  }
}

const inputStyle = {
  width: '100%',
  height: 38,
  padding: '0 12px 0 32px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  fontSize: 12,
  outline: 'none'
}

const selectStyle = {
  height: 38,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer'
}

const modalInputStyle = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  fontSize: 12.5,
  outline: 'none',
  boxSizing: 'border-box'
}

const modalSelectStyle = {
  width: '100%',
  height: 38,
  padding: '0 10px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  fontSize: 12.5,
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box'
}

const labelStyle = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 800,
  color: '#334155',
  marginBottom: 4
}

const thStyle = {
  padding: '12px 14px',
  fontWeight: 800,
  fontSize: 11,
  color: '#475569',
  letterSpacing: '0.4px',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '10px 14px',
  whiteSpace: 'nowrap'
}

function badgeStyle(color, bg) {
  return {
    padding: '2px 8px',
    borderRadius: 6,
    background: bg,
    color: color,
    fontSize: 10.5,
    fontWeight: 700,
    display: 'inline-block'
  }
}

function taskBadgeStyle(task = '') {
  const t = (task || '').toUpperCase()
  let bg = '#F1F5F9'
  let color = '#334155'
  if (t === 'REPORT') {
    bg = '#DCFCE7'
    color = '#15803D'
  } else if (t === 'PERMIT') {
    bg = '#FEF08A'
    color = '#854D0E'
  } else if (t === 'REKONSILIASI') {
    bg = '#FED7AA'
    color = '#9A3412'
  } else if (t === 'TICKET') {
    bg = '#FFEDD5'
    color = '#C2410C'
  } else if (t === 'PEMBELIAN') {
    bg = '#FCE7F3'
    color = '#9D174D'
  }
  return {
    padding: '2px 8px',
    borderRadius: 6,
    background: bg,
    color: color,
    fontSize: 10.5,
    fontWeight: 800,
    display: 'inline-block'
  }
}

function statusBadgeStyle(status = '') {
  const s = (status || '').toUpperCase()
  let bg = '#F1F5F9'
  let color = '#475569'

  // DONE (Kuning/Hijau)
  if (s === 'DONE') {
    bg = '#FEF08A' // Kuning soft
    color = '#854D0E'
  }
  // CONTINUE (Abu-abu/Biru)
  else if (s === 'CONTINUE') {
    bg = '#E2E8F0' // Abu-abu soft
    color = '#334155'
  }
  // ON HOLD (Biru Muda)
  else if (s === 'ON HOLD') {
    bg = '#BAE6FD' // Biru muda
    color = '#0369A1'
  }
  // CANCEL (Oranye/Merah)
  else if (s === 'CANCEL') {
    bg = '#FFEDD5' // Oranye soft
    color = '#C2410C'
  }

  return {
    padding: '3px 8px',
    borderRadius: 6,
    background: bg,
    color: color,
    fontSize: 10.5,
    fontWeight: 800,
    display: 'inline-block'
  }
}
