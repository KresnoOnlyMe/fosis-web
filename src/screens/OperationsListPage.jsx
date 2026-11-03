import React, { useMemo, useState } from 'react'
import { Plus, Search, Filter, RotateCcw, AlertTriangle, Wrench } from 'lucide-react'
import TicketList from '../components/ui/TicketList'
import { Button } from '../components/ui/Primitives'
import { useFosis } from '../context/FosisContext'
import { normalizeRole, ROLES, canCreateTicket } from '../utils/permissions'
import { FOSIS_CONSTANTS } from '../components/dialogs/AddTicketDialog'

export default function OperationsListPage({ type, onSelect, onEdit, onAdd }) {
  const { tickets, activeUser } = useFosis()
  const role = normalizeRole(activeUser?.role)
  const isTeknisi = role === ROLES.TEKNISI

  const isTroubleshoot = type === 'TROUBLESHOOT'
  const currentItems = useMemo(() => {
    return tickets.filter((t) => t.type === type)
  }, [tickets, type])

  const cfg = isTroubleshoot
    ? {
      title: 'Troubleshoot',
      desc: 'Manage incidents and fiber optic network troubleshooting restoration tasks.',
      addText: 'Add Troubleshoot',
      placeholder: 'Search ticket number, site, field engineer, or root cause...'
    }
    : {
      title: 'Maintenance',
      desc: 'Validate schedules, preventive & corrective maintenance closure activities.',
      addText: 'Add Maintenance',
      placeholder: 'Search maintenance task, requestor, site, or field engineer...'
    }

  const [query, setQuery] = useState('')
  const [slaFilter, setSlaFilter] = useState('ALL')
  const [rootCauseFilter, setRootCauseFilter] = useState('ALL')
  const [monthFilter, setMonthFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState('ALL')

  const rootCauses = ['ALL', ...(FOSIS_CONSTANTS.ROOT_CAUSE_TROUBLESHOOT || [])]

  const availableYears = useMemo(() => {
    const baseYears = isTroubleshoot
      ? (FOSIS_CONSTANTS.YEARS_TROUBLESHOOT || ['2023', '2024', '2025', '2026'])
      : (FOSIS_CONSTANTS.YEARS_MAINTENANCE || ['2024', '2025', '2026', '2027'])
    const yrs = new Set(baseYears)
    currentItems.forEach((t) => {
      if (t.tahun) yrs.add(String(t.tahun))
    })
    return Array.from(yrs).sort()
  }, [currentItems, isTroubleshoot])

  const filtered = useMemo(() => {
    return currentItems.filter((item) => {
      // SLA Filter for TroubleShoot
      if (isTroubleshoot && slaFilter !== 'ALL') {
        const itemSla = (item.slaStatus || 'IN SLA').toUpperCase()
        if (itemSla !== slaFilter) return false
      }

      // Maintenance status for Maintenance
      if (!isTroubleshoot && maintenanceStatusFilter !== 'ALL') {
        let itemMnt = (item.maintenanceStatus || 'ON PROGRESS').toUpperCase()
        if (itemMnt === 'ON PROGRES') itemMnt = 'ON PROGRESS'
        let filterMnt = maintenanceStatusFilter.toUpperCase()
        if (filterMnt === 'ON PROGRES') filterMnt = 'ON PROGRESS'
        if (itemMnt !== filterMnt) return false
      }

      // Root Cause for TroubleShoot
      if (isTroubleshoot && rootCauseFilter !== 'ALL' && item.rootCause !== rootCauseFilter) return false

      // Month Filter
      if (monthFilter !== 'ALL' && (item.bulan || '').toUpperCase() !== monthFilter.toUpperCase()) return false

      // Year Filter
      if (yearFilter !== 'ALL' && String(item.tahun || '') !== String(yearFilter)) return false

      // Search Query
      if (!query) return true
      const q = query.toLowerCase()
      return (
        (item.ticketNo && String(item.ticketNo).toLowerCase().includes(q)) ||
        (item.title && String(item.title).toLowerCase().includes(q)) ||
        (item.siteLocationName && String(item.siteLocationName).toLowerCase().includes(q)) ||
        (item.engineerName && String(item.engineerName).toLowerCase().includes(q)) ||
        (item.createdBy && String(item.createdBy).toLowerCase().includes(q)) ||
        (item.rootCause && String(item.rootCause).toLowerCase().includes(q)) ||
        (item.kegiatan && String(item.kegiatan).toLowerCase().includes(q)) ||
        (item.requestor && String(item.requestor).toLowerCase().includes(q))
      )
    })
  }, [
    currentItems,
    query,
    slaFilter,
    maintenanceStatusFilter,
    rootCauseFilter,
    monthFilter,
    yearFilter,
    isTroubleshoot
  ])

  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 20

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1
  const paginatedFiltered = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, currentPage, rowsPerPage])

  const handleReset = () => {
    setQuery('')
    setSlaFilter('ALL')
    setRootCauseFilter('ALL')
    setMaintenanceStatusFilter('ALL')
    setMonthFilter('ALL')
    setYearFilter('ALL')
    setCurrentPage(1)
  }

  return (
    <div className="page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Page Header */}
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
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>{cfg.title}</h1>
          <p style={{ fontSize: 12, color: '#64748B', margin: '3px 0 0 0' }}>{cfg.desc}</p>
        </div>

        {canCreateTicket(activeUser, type) && (
          <button
            type="button"
            onClick={onAdd}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              background: isTroubleshoot ? '#DC2626' : '#0284C7',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            <Plus size={15} />
            <span>{cfg.addText}</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar Card */}
      <div
        style={{
          borderRadius: 16,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          padding: '14px 18px',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}
      >
        {isTroubleshoot ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Search Input */}
              <div style={{ position: 'relative', minWidth: 200, flex: '1 1 200px' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={cfg.placeholder}
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 12px 0 32px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 12,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Troubleshoot SLA Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>SLA:</span>
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 115, height: 34 }}
                >
                  <option value="ALL">All SLA</option>
                  {(FOSIS_CONSTANTS.SLA_TROUBLESHOOT || ['IN SLA', 'OVER SLA', 'ON PROGRESS', 'ON HOLD', 'CANCEL', 'NO SLA', 'SUPPORT']).map((sla) => (
                    <option key={sla} value={sla}>{sla}</option>
                  ))}
                </select>
              </div>

              {/* Root Cause */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Root Cause:</span>
                <select
                  value={rootCauseFilter}
                  onChange={(e) => setRootCauseFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 145, height: 34 }}
                >
                  {rootCauses.map((rc) => (
                    <option key={rc} value={rc}>
                      {rc === 'ALL' ? 'All Root Causes' : rc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Month:</span>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 125, height: 34 }}
                >
                  <option value="ALL">All Months</option>
                  {(FOSIS_CONSTANTS.MONTHS || []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 115, height: 34 }}
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filters"
              style={{
                height: 34,
                padding: '0 12px',
                borderRadius: 7,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#64748B',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        ) : (
          /* Maintenance Module Filters: Month, Year, Status & Reset */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              {/* Search Input for Maintenance */}
              <div style={{ position: 'relative', minWidth: 200, flex: '1 1 200px' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={cfg.placeholder}
                  style={{
                    width: '100%',
                    height: 34,
                    padding: '0 12px 0 32px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 12,
                    outline: 'none'
                  }}
                />
              </div>

              {/* 1. Filter Month */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Month:</span>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 125, height: 34 }}
                >
                  <option value="ALL">All Months</option>
                  {(FOSIS_CONSTANTS.MONTHS || []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Filter Year */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Year:</span>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 115, height: 34 }}
                >
                  <option value="ALL">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#475569' }}>Status:</span>
                <select
                  value={maintenanceStatusFilter}
                  onChange={(e) => setMaintenanceStatusFilter(e.target.value)}
                  style={{ ...selectStyle, minWidth: 140, height: 34 }}
                >
                  <option value="ALL">All Statuses</option>
                  {(FOSIS_CONSTANTS.STATUS_MAINTENANCE || ['DONE', 'ON HOLD', 'ON PROGRESS', 'CONTINUE', 'CANCEL']).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={handleReset}
              title="Reset Filters"
              style={{
                height: 34,
                padding: '0 12px',
                borderRadius: 7,
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#64748B',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Status count indicator */}
        <div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, marginTop: 4 }}>
          Showing {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} -{' '}
          {Math.min(currentPage * rowsPerPage, filtered.length)} of <strong>{filtered.length}</strong> {cfg.title} tickets (20/page)
        </div>
      </div>

      {/* Ticket List Render */}
      <TicketList items={paginatedFiltered} onSelect={onSelect} onEdit={onEdit} />

      {/* Pagination Controls */}
      {filtered.length > rowsPerPage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '8px 0',
            fontSize: 12,
            color: '#475569'
          }}
        >
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: currentPage <= 1 ? '#F1F5F9' : '#FFFFFF',
              color: currentPage <= 1 ? '#94A3B8' : '#334155',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            Previous
          </button>

          <span style={{ fontWeight: 800, padding: '0 6px' }}>
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
              color: currentPage >= totalPages ? '#94A3B8' : '#334155',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 700
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
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
