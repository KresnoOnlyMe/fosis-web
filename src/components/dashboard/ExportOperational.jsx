import React, { useState, useMemo } from 'react'
import { Download, FileSpreadsheet, FileText, Presentation, Filter, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { useFosis } from '../../context/FosisContext'
import { canExportFormat, isSuperAdmin } from '../../utils/permissions'

export default function ExportOperational({ tickets = [] }) {
  const { success, info, warning } = useToast()
  const { activeUser } = useFosis()

  const [period, setPeriod] = useState('ALL') // 'ALL', 'WEEKLY', 'MONTHLY'
  const [typeFilter, setTypeFilter] = useState('ALL') // 'ALL', 'TROUBLESHOOT', 'MAINTENANCE', 'ADMINISTRASI'
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)

  // Determine allowed export formats based on user role
  const allowExcel = canExportFormat(activeUser, 'EXCEL')
  const allowPdf = canExportFormat(activeUser, 'PDF')
  const allowPpt = canExportFormat(activeUser, 'PPT')
  const isSuper = isSuperAdmin(activeUser)
  const isDeptHead = activeUser?.role === 'Dept Head'

  // Pre-filter tickets based on period and type
  const filteredTickets = useMemo(() => {
    let result = tickets || []

    // 1. Filter by Module Type
    if (typeFilter !== 'ALL') {
      result = result.filter(
        (t) => (t.type || '').toUpperCase() === typeFilter.toUpperCase()
      )
    }

    // 2. Filter by Period
    if (period !== 'ALL') {
      const now = new Date()
      result = result.filter((t) => {
        if (!t.createdAt && !t.bulan) return true
        if (period === 'MONTHLY') {
          const nowMonth = now.getMonth() // 0-11
          const indoMonths = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']
          const enMonths = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
          
          const targetIndo = indoMonths[nowMonth]
          const targetEn = enMonths[nowMonth]
          const itemBulan = String(t.bulan || '').toUpperCase().trim()

          if (itemBulan) {
            return itemBulan === targetIndo || itemBulan === targetEn
          }

          if (t.createdAt) {
            const ticketDate = new Date(t.createdAt)
            return ticketDate.getMonth() === nowMonth && ticketDate.getFullYear() === now.getFullYear()
          }
          return true
        }
        if (period === 'WEEKLY') {
          if (!t.createdAt) return true
          const diffDays = (now - new Date(t.createdAt)) / (1000 * 60 * 60 * 24)
          return diffDays <= 7
        }
        return true
      })
    }

    return result
  }, [tickets, period, typeFilter])

  // SLA Summary Metrics for report
  const metrics = useMemo(() => {
    const total = filteredTickets.length
    const met = filteredTickets.filter(
      (t) => (t.slaStatus || '').toLowerCase().includes('meet') || (t.slaStatus || '').toLowerCase().includes('aman')
    ).length
    const breached = filteredTickets.filter(
      (t) => (t.slaStatus || '').toLowerCase().includes('breach') || (t.slaStatus || '').toLowerCase().includes('over')
    ).length
    const rate = total > 0 ? Math.round((met / total) * 100) : 100

    return { total, met, breached, rate }
  }, [filteredTickets])

  // --- 1. EXCEL EXPORT (Structured XML/HTML Table format with UTF-8 BOM) ---
  const handleExportExcel = () => {
    if (!allowExcel) {
      warning('Role Anda tidak memiliki otorisasi untuk ekspor format Excel.')
      return
    }

    if (filteredTickets.length === 0) {
      warning('No ticket records found for the selected filter to export.')
      return
    }

    const userName = activeUser?.name || 'FOSIS Staff'
    const userRole = activeUser?.role || 'Operations'
    const exportTime = new Date().toLocaleString('en-US')
    const periodLabel =
      period === 'WEEKLY' ? 'Weekly (Last 7 Days)' : period === 'MONTHLY' ? 'Monthly (Current Month)' : 'All Periods'

    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Operational Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #0F172A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px; text-align: left; }
          td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 11pt; }
          .title { font-size: 16pt; font-weight: bold; color: #0F172A; }
          .meta { font-size: 10pt; color: #475569; }
          .highlight { background-color: #F1F5F9; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="title">FOSIS OPERATIONAL RECAPITULATION REPORT</td></tr>
          <tr><td colspan="10" class="meta">Exported By: <b>${userName}</b> (${userRole}) | Generated At: ${exportTime} | Period: ${periodLabel}</td></tr>
          <tr><td colspan="10" class="meta">Total Records: ${filteredTickets.length} Tickets | SLA Compliance: ${metrics.rate}%</td></tr>
          <tr><td colspan="10"></td></tr>
          <thead>
            <tr>
              <th>No.</th>
              <th>Ticket No</th>
              <th>Module Type</th>
              <th>Task Title / Description</th>
              <th>Site / Location</th>
              <th>Field Engineer / PIC</th>
              <th>SLA Status</th>
              <th>Workflow Status</th>
              <th>Month</th>
              <th>Year</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredTickets.forEach((t, idx) => {
      const isEven = idx % 2 === 0
      tableHtml += `
        <tr style="background-color: ${isEven ? '#FFFFFF' : '#F8FAFC'};">
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${t.ticketNo || t.id || '-'}</b></td>
          <td>${t.type || '-'}</td>
          <td>${t.title || t.deskripsi || '-'}</td>
          <td>${t.siteLocationName || t.site || t.location || '-'}</td>
          <td>${t.engineerName || t.pic || '-'}</td>
          <td>${t.slaStatus || 'Dalam Target'}</td>
          <td>${t.workflowStatus || t.status || '-'}</td>
          <td>${t.bulan || '-'}</td>
          <td>${t.tahun || '-'}</td>
        </tr>
      `
    })

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const cleanRole = userRole.replace(/[^a-zA-Z0-9]/g, '_')
    link.href = url
    link.setAttribute('download', `FOSIS_Operasional_${cleanRole}_${period}_${new Date().toISOString().slice(0, 10)}.xls`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    success(`Excel report (${filteredTickets.length} tickets) exported successfully!`)
  }

  // --- 2. PDF EXPORT (Corporate Printable Document with Print Stylesheet) ---
  const handleExportPDF = () => {
    if (!allowPdf) {
      warning('Your role is not authorized to export in PDF format.')
      return
    }

    if (filteredTickets.length === 0) {
      warning('No ticket records available to print in PDF format.')
      return
    }

    setIsPreparingPrint(true)
    info('Preparing Operational PDF document preview...')

    setTimeout(() => {
      window.print()
      setIsPreparingPrint(false)
    }, 350)
  }

  // --- 3. PPT / PRESENTATION EXPORT (Executive Slide Deck HTML for Dept Head & Super Admin) ---
  const handleExportPPT = () => {
    if (!allowPpt) {
      warning('Executive presentation format is only accessible to Department Head and Super Admin roles.')
      return
    }

    if (filteredTickets.length === 0) {
      warning('No operational records to convert into presentation slides.')
      return
    }

    const userName = activeUser?.name || 'FOSIS Staff'
    const userRole = activeUser?.role || 'Executive'
    const periodLabel =
      period === 'WEEKLY' ? 'Weekly (Last 7 Days)' : period === 'MONTHLY' ? 'Monthly (This Month)' : 'All Periods'

    // Generate standalone, responsive, print/display executive slide presentation
    const pptHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>FOSIS Executive Briefing — ${periodLabel}</title>
        <style>
          * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #0F172A; color: #F8FAFC; margin: 0; padding: 24px; }
          .slide-container { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
          .slide { background: #1E293B; border-radius: 16px; padding: 40px; border: 1px solid #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.5); page-break-after: always; }
          .slide-tag { display: inline-block; background: #3B82F6; color: #FFF; font-size: 11px; font-weight: 800; letter-spacing: 1px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 16px; }
          .slide-title { font-size: 26px; font-weight: 800; color: #FFFFFF; margin: 0 0 8px 0; }
          .slide-sub { font-size: 14px; color: #94A3B8; margin-bottom: 24px; }
          .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
          .metric-card { background: #0F172A; padding: 20px; border-radius: 12px; border: 1px solid #334155; text-align: center; }
          .metric-val { font-size: 32px; font-weight: 900; color: #38BDF8; }
          .metric-lbl { font-size: 12px; color: #94A3B8; margin-top: 6px; text-transform: uppercase; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th { background: #0F172A; color: #94A3B8; padding: 10px; text-align: left; border-bottom: 2px solid #334155; }
          td { padding: 10px; border-bottom: 1px solid #334155; color: #E2E8F0; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748B; display: flex; justify-content: space-between; border-top: 1px solid #334155; padding-top: 12px; }
          @media print {
            body { background: #FFF; color: #000; padding: 0; }
            .slide { background: #FFF; border: 1px solid #DDD; box-shadow: none; color: #000; page-break-after: always; }
            .slide-title { color: #000; }
            .metric-card { background: #F8FAFC; border: 1px solid #DDD; }
            .metric-val { color: #0F172A; }
          }
        </style>
      </head>
      <body>
        <div class="slide-container">
          <!-- SLIDE 1: Executive Overview -->
          <div class="slide">
            <span class="slide-tag">Slide 1 / 2 — Executive Summary</span>
            <h1 class="slide-title">FOSIS Operational Performance &amp; Executive Summary</h1>
            <div class="slide-sub">Prepared for Operations Management Board | Period: ${periodLabel}</div>
            
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-val">${filteredTickets.length}</div>
                <div class="metric-lbl">Total Tickets</div>
              </div>
              <div class="metric-card">
                <div class="metric-val" style="color: #4ADE80;">${metrics.rate}%</div>
                <div class="metric-lbl">SLA Compliance</div>
              </div>
              <div class="metric-card">
                <div class="metric-val" style="color: #A78BFA;">${metrics.met}</div>
                <div class="metric-lbl">Target Achieved</div>
              </div>
              <div class="metric-card">
                <div class="metric-val" style="color: #F87171;">${metrics.breached}</div>
                <div class="metric-lbl">SLA Breached</div>
              </div>
            </div>

            <div class="footer">
              <span>FOSIS Field Operational Integrated System</span>
              <span>Presenter: ${userName} (${userRole}) | Date: ${new Date().toLocaleDateString('en-US')}</span>
            </div>
          </div>

          <!-- SLIDE 2: Operational Ticket Breakdown -->
          <div class="slide">
            <span class="slide-tag">Slide 2 / 2 — Operational Breakdown</span>
            <h2 class="slide-title">Recent Operational Tickets</h2>
            <div class="slide-sub">Summary of active field resolution activities</div>

            <table>
              <thead>
                <tr>
                  <th>Ticket No</th>
                  <th>Module</th>
                  <th>Task / Description</th>
                  <th>Field Engineer / PIC</th>
                  <th>Location</th>
                  <th>SLA Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTickets.slice(0, 8).map(t => `
                  <tr>
                    <td><b>${t.ticketNo || t.id || '-'}</b></td>
                    <td>${t.type || '-'}</td>
                    <td>${(t.title || t.deskripsi || '-').substring(0, 35)}</td>
                    <td>${t.engineerName || t.pic || '-'}</td>
                    <td>${t.siteLocationName || t.site || '-'}</td>
                    <td><span style="font-weight: 700; color: ${(t.slaStatus || '').includes('Breach') || (t.slaStatus || '').includes('OVER') ? '#F87171' : '#4ADE80'};">${t.slaStatus || 'In SLA'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <span>Showing ${Math.min(filteredTickets.length, 8)} of ${filteredTickets.length} operational tickets</span>
              <span>Official FOSIS Web Ops Briefing</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const blob = new Blob([pptHtml], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `FOSIS_Executive_Deck_${period}_${new Date().toISOString().slice(0, 10)}.html`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    success('Executive Presentation Slide Deck downloaded (open in browser to present)!')
  }

  return (
    <>
      <div
        className="card pad"
        style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>
                Operational Data Export
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: isSuper ? '#FEF3F2' : '#EEF2FF',
                  color: isSuper ? '#B42318' : '#4338CA',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <ShieldCheck size={11} />
                {activeUser?.role || 'Guest'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
              Available formats:{' '}
              {[allowExcel && 'Excel', allowPdf && 'PDF', allowPpt && 'PPT'].filter(Boolean).join(', ') || 'None'}
            </div>
          </div>

          {allowExcel && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="icon-btn"
              style={{ width: 34, height: 34, color: '#16A34A', borderRadius: '50%', background: '#F0FDF4' }}
              title="Download Excel"
            >
              <Download size={16} />
            </button>
          )}
        </div>

        {/* Filters Grid: Period & Module Type */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Period Select Dropdown */}
          <div style={{ flex: '1 1 120px' }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
              PERIOD
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                width: '100%',
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 11.5,
                fontWeight: 600,
                color: '#1E293B',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Periods</option>
              <option value="WEEKLY">Weekly (Last 7 Days)</option>
              <option value="MONTHLY">Monthly (This Month)</option>
            </select>
          </div>

          {/* Module Type Selector (for Super Admin, Dept Head, and Admin) */}
          {(isSuper || isDeptHead || activeUser?.role === 'Staff Administrasi') && (
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748B', display: 'block', marginBottom: 4 }}>
                MODULE TYPE
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '0 10px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#1E293B',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Modules</option>
                <option value="TROUBLESHOOT">Troubleshoot</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ADMINISTRASI">Administration</option>
              </select>
            </div>
          )}
        </div>

        {/* Live Filter Counter Badge */}
        <div
          style={{
            fontSize: 11,
            color: '#475569',
            background: '#F8FAFC',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>Selected Data: <b>{filteredTickets.length} Tickets</b></span>
          <span style={{ fontSize: 10.5, color: metrics.rate >= 80 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>
            SLA: {metrics.rate}%
          </span>
        </div>

        {/* Quick Action Grid (Excel, PDF, PPT) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: allowPpt ? 'repeat(3, 1fr)' : allowExcel ? 'repeat(2, 1fr)' : '1fr',
            gap: 8,
            marginTop: 2
          }}
        >
          {/* Excel Button */}
          {allowExcel && (
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                height: 38,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#16A34A')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              <FileSpreadsheet size={15} color="#16A34A" />
              <span>Excel</span>
            </button>
          )}

          {/* PDF Button */}
          {allowPdf && (
            <button
              type="button"
              onClick={handleExportPDF}
              style={{
                height: 38,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#DC2626')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              <FileText size={15} color="#DC2626" />
              <span>PDF</span>
            </button>
          )}

          {/* PPT Button for Dept Head & Super Admin */}
          {allowPpt && (
            <button
              type="button"
              onClick={handleExportPPT}
              title="Ekspor Slide Presentasi Eksekutif"
              style={{
                height: 38,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E11D48')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
            >
              <Presentation size={15} color="#E11D48" />
              <span>PPT</span>
            </button>
          )}
        </div>
      </div>

      {/* ISOLATED PRINTABLE REPORT CONTAINER (rendered when printing) */}
      <style>{`
        @media screen {
          #fosis-printable-report {
            display: none;
          }
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #fosis-printable-report, #fosis-printable-report * {
            visibility: visible !important;
          }
          #fosis-printable-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 24px !important;
            background: #FFFFFF !important;
            color: #0F172A !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .fosis-print-table th {
            background-color: #0F172A !important;
            color: #FFFFFF !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div id="fosis-printable-report">
        <div style={{ borderBottom: '2px solid #0F172A', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
                FOSIS — FIELD OPERATIONAL INTEGRATED SYSTEM
              </h2>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                Operational Field Data Recapitulation Report
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#475569' }}>
              <div>Print Date: <b>{new Date().toLocaleDateString('en-US')}</b></div>
              <div>Period: <b>{period}</b></div>
            </div>
          </div>
        </div>

        {/* Meta summary boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <div style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Printed By</div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{activeUser?.name || '-'}</div>
            <div style={{ fontSize: 10, color: '#475569' }}>{activeUser?.role || '-'}</div>
          </div>
          <div style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Total Tickets</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{filteredTickets.length}</div>
          </div>
          <div style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>SLA Compliance</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: metrics.rate >= 80 ? '#16A34A' : '#DC2626' }}>
              {metrics.rate}%
            </div>
          </div>
          <div style={{ border: '1px solid #CBD5E1', borderRadius: 8, padding: 8 }}>
            <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Resolution Metric</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>
              {metrics.met} Within Target / {metrics.breached} Breached
            </div>
          </div>
        </div>

        {/* Printable Data Table */}
        <table className="fosis-print-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'center', width: 30 }}>No</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Ticket No</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Type</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Description</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Location</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Field Engineer/PIC</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>SLA Status</th>
              <th style={{ border: '1px solid #CBD5E1', padding: '6px 8px', textAlign: 'left' }}>Workflow Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, idx) => (
              <tr key={t.id || idx}>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px', fontWeight: 'bold' }}>{t.ticketNo || t.id || '-'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.type || '-'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.title || t.deskripsi || '-'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.siteLocationName || t.site || '-'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.engineerName || t.pic || '-'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.slaStatus || 'In SLA'}</td>
                <td style={{ border: '1px solid #E2E8F0', padding: '5px 8px' }}>{t.workflowStatus || t.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B' }}>
          <div>Official document generated via FOSIS Field Operations System.</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </>
  )
}
