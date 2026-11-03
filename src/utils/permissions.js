/**
* Role Constants & RBAC Permissions for FOSIS WEB OPS 2026
*/
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administration',
  IT_ADMIN: 'IT Admin',
  IC_TROUBLESHOOT: 'IC Service Operation',
  IC_MAINTENANCE: 'IC Service Maintenance',
  TEKNISI: 'Field Engineer',
  DEPT_HEAD: 'Department Head'
}

// Normalize role names from various inputs/databases (handling typos like Departement, Department, etc.)
export function normalizeRole(role = '') {
  if (!role) return ROLES.TEKNISI
  const r = String(role).toLowerCase().trim()
  if (r.includes('super admin') || r.includes('superadmin')) return ROLES.SUPER_ADMIN
  if (r.includes('it admin') || r.includes('it_admin')) return ROLES.IT_ADMIN
  if (r.includes('dept') || r.includes('head')) return ROLES.DEPT_HEAD
  if (r.includes('troubleshoot') || r.includes('operation') || r === 'ic so' || r.includes('ic so') || r.includes('ic_so') || r === 'so') return ROLES.IC_TROUBLESHOOT
  if (r.includes('maintenance') || r === 'ic sm' || r.includes('ic sm') || r.includes('ic_sm') || r === 'sm') return ROLES.IC_MAINTENANCE
  if (r.includes('teknisi') || r.includes('lapangan') || r.includes('engineer')) return ROLES.TEKNISI
  if (r.includes('admin') || r.includes('administrasi')) return ROLES.ADMIN
  return role
}

// Check if user is Super Admin (explicit role / flag / authorized official sanderlina.imelda)
export function isSuperAdmin(user) {
  if (!user) return false
  if (isAuthorizedSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.SUPER_ADMIN || user.isSuperAdmin === true) {
    return true
  }
  return false
}

// Check ticket / record creator ownership
export function isRecordCreator(user, item) {
  if (!user || !item) return false
  const userId = String(user.id || user.userId || user.employeeId || '').toLowerCase().trim()
  const userName = String(user.name || '').toLowerCase().trim()

  const createdBy = String(item.createdBy || '').toLowerCase().trim()
  const creatorName = String(item.creatorName || '').toLowerCase().trim()
  const createdById = item.createdById !== undefined && item.createdById !== null ? String(item.createdById).toLowerCase().trim() : ''
  const pic = String(item.pic || item.engineerName || '').toLowerCase().trim()
  const engineer = String(item.engineer || item.engineerName || '').toLowerCase().trim()
  const personnel = String(item.personnel || item.applicantName || item.engineerSignName || '').toLowerCase().trim()

  if (userId && (createdBy === userId || createdById === userId)) {
    return true
  }

  if (userName && (
    creatorName === userName ||
    createdBy === userName ||
    pic === userName ||
    engineer === userName ||
    personnel === userName
  )) {
    return true
  }

  return false
}

// Check ticket ownership (alias of isRecordCreator)
export function isTicketOwner(user, ticket) {
  return isRecordCreator(user, ticket)
}

// RBAC: Check if user can share ticket / permit PDF to WhatsApp
export function canShareTicketPdfToWA(user, item) {
  if (!user || !item) return false
  const role = normalizeRole(user.role)
  const roleRaw = String(user.role || '').toLowerCase().trim()

  // Admin and Super Admin have full access
  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || roleRaw === 'admin' || isSuperAdmin(user)) {
    return true
  }

  // Dept Head is strictly read-only
  if (role === ROLES.DEPT_HEAD || roleRaw === 'dept_head') {
    return false
  }

  // Team Leader / IC can share their own or tickets pending IC verification
  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || roleRaw === 'ic') {
    if (isRecordCreator(user, item)) return true
    const wf = (item.workflowStatus || '').toLowerCase()
    if (wf.includes('ic') || wf.includes('submitted') || item.submittedToIC === true || item.internalStatus === 'PENDING_IC') {
      return true
    }
    return true
  }

  // Teknisi Field Engineer can ONLY share if they created / own the ticket
  if (role === ROLES.TEKNISI || roleRaw === 'engineer' || roleRaw === 'teknisi') {
    return isRecordCreator(user, item)
  }

  return false
}

// RBAC: Check if user can edit record
export function canEditRecord(user, item) {
  if (!user || !item) return false
  if ((item.isLocked || item.locked) && !isSuperAdmin(user) && normalizeRole(user.role) !== ROLES.ADMIN) {
    return false
  }
  const role = normalizeRole(user.role)
  const roleRaw = String(user.role || '').toLowerCase().trim()

  if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || roleRaw === 'admin' || isSuperAdmin(user)) {
    return true
  }

  // Dept Head is strictly read-only
  if (role === ROLES.DEPT_HEAD || roleRaw === 'dept_head') {
    return false
  }

  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || roleRaw === 'ic') {
    return isRecordCreator(user, item)
  }

  if (role === ROLES.TEKNISI || roleRaw === 'engineer' || roleRaw === 'teknisi') {
    return isRecordCreator(user, item)
  }

  return false
}

// User-level permissions
export function canCreateTicket(user, ticketType = 'TROUBLESHOOT') {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  const type = (ticketType || '').toUpperCase()

  // Sesuai SRS Bab III 3.1:
  // - Dept Head & IT Admin TIDAK diizinkan membuat Lembar Kerja / Tiket
  if (role === ROLES.DEPT_HEAD || role === ROLES.IT_ADMIN) {
    return false
  }

  // Modul Administrasi: Hanya Admin Operasional / Super Admin yang boleh membuat
  if (type === 'ADMINISTRASI') {
    return role === ROLES.ADMIN
  }

  // Sesuai SRS Bab III 3.1 (Matriks Hak Akses Pengguna):
  // Create Lembar Kerja diizinkan untuk:
  // 1. Teknisi Field Engineer
  // 2. Team Leader / IC (IC Service Operation & IC Service Maintenance)
  // 3. FE Admin (Administrasi)
  if (role === ROLES.TEKNISI || role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || role === ROLES.ADMIN) {
    return user.canCreate !== false
  }

  return false
}

export function canEditTicket(user, ticket) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (ticket?.locked || ticket?.isLocked) return false
  const role = normalizeRole(user.role)

  // Khusus Administrasi: Hanya Admin Operasional / Super Admin
  const isAdm = (ticket?.type || '').toUpperCase() === 'ADMINISTRASI'
  if (isAdm) {
    return role === ROLES.ADMIN
  }

  // Tim IC dan Dept Head DILARANG mengedit isi laporan teknisi
  if (role === ROLES.DEPT_HEAD || role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE) return false
  if (!ticket) return user.canEdit !== false
  return isTicketOwner(user, ticket)
}

export function canDeleteTicket(user, ticket) {
  if (!user) return false
  return isSuperAdmin(user)
}

export function canSubmitTicket(user, ticket) {
  if (!user) return false
  const role = normalizeRole(user.role)
  const status = (ticket?.workflowStatus || '').toLowerCase()
  const isUnsubmitted = ticket?.submittedToIC === false || !status || status.includes('draft') || status.includes('revisi') || status.includes('revision')
  return isUnsubmitted && (role === ROLES.TEKNISI || isSuperAdmin(user))
}

export function canVerifyTicket(user, ticket) {
  if (!user) return false
  // Tiket yang belum disubmit tidak boleh diverifikasi oleh IC
  if (ticket?.submittedToIC === false) return false

  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)

  const ticketType = (ticket?.type || '').toUpperCase()
  // IC Troubleshoot can verify Troubleshoot
  if (role === ROLES.IC_TROUBLESHOOT && ticketType === 'TROUBLESHOOT') return true
  // IC Maintenance can verify Maintenance
  if (role === ROLES.IC_MAINTENANCE && ticketType === 'MAINTENANCE') return true

  return false
}

export function canLockTicket(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  return role === ROLES.ADMIN
}

export function canUnlockTicket(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  return role === ROLES.ADMIN
}

export function canApproveTicket(user) {
  if (!user) return false
  const role = normalizeRole(user.role)
  // Dept Head is strictly VIEW-ONLY / READ-ONLY according to SRS (pengesahan final di SRS adalah saat FE Admin melakukan Lock Data)
  if (role === ROLES.DEPT_HEAD) return false
  if (isSuperAdmin(user)) return true
  return false
}

export function canRejectTicket(user) {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  if (isSuperAdmin(user)) return true
  return false
}

export function canCommentTicket(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  return false
}

export function canManagePermit(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  return role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || user.canImportPermit === true
}

export function canApproveRejectPermit(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  return role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE
}

export function canApprovePermit(user) {
  return canApproveRejectPermit(user)
}

export function canRejectPermit(user) {
  return canApproveRejectPermit(user)
}

export function canManageUsers(user) {
  if (!user) return false
  return isSuperAdmin(user)
}

export function isAuthorizedSuperAdmin(user) {
  if (!user) return false
  const username = String(user.username || '').toLowerCase().trim()
  const name = String(user.name || '').toLowerCase().trim()
  const empId = String(user.employeeId || '').toUpperCase().trim()
  const idStr = user.id !== undefined && user.id !== null ? String(user.id).trim() : ''
  const role = normalizeRole(user.role)

  // 1. Check if user is the authorized official Super Admin account (Sanderlina Imelda)
  const isSanderlinaAccount =
    username === 'sanderlina.imelda' ||
    username === 'sanderlina' ||
    name === 'sanderlina imelda' ||
    empId === 'EMP-001' ||
    idStr === '1'

  if (isSanderlinaAccount) {
    return true
  }

  // 2. Strict Super Admin role verification (explicitly excludes generic Staff Administrasi)
  if (role === ROLES.SUPER_ADMIN && user.isSuperAdmin === true) {
    return true
  }

  return false
}

// -------------------------------------------------------------
// VEHICLE MANAGEMENT RBAC HELPERS
// -------------------------------------------------------------
export function canViewVehicle(user) {
  return Boolean(user)
}

export function canViewVehicleMap(user) {
  return Boolean(user)
}

export function canBorrowVehicle(user) {
  if (!user) return false
  const role = normalizeRole(user.role)
  // Department Head CANNOT create or borrow vehicles (strict read-only)
  if (role === ROLES.DEPT_HEAD) return false
  if (role === ROLES.IT_ADMIN) return false
  // Super Admin, IC SO, IC SM, and Field Technicians (and operational admin) can borrow
  return true
}

export function canEditVehicle(user) {
  if (!user) return false
  // Exclusive to authorized Super Admin
  return isAuthorizedSuperAdmin(user)
}

export function canDeleteVehicle(user) {
  if (!user) return false
  // Exclusive to authorized Super Admin
  return isAuthorizedSuperAdmin(user)
}

export function isVehicleBorrower(user, log) {
  if (!user || !log) return false

  const userId = String(user.id || user.userId || user.employeeId || '').toLowerCase().trim()
  const username = String(user.username || '').toLowerCase().trim()

  // 1. Priority 1: Strictly validate by authenticated account ID
  if (log.borrowerUserId !== undefined && log.borrowerUserId !== null && String(log.borrowerUserId).trim() !== '') {
    const logUserId = String(log.borrowerUserId).toLowerCase().trim()
    if (userId && logUserId && userId === logUserId) {
      return true
    }
    // Explicit ID mismatch: reject
    return false
  }

  // 2. Priority 2: Strictly validate by authenticated username
  if (log.borrowerUsername && String(log.borrowerUsername).trim() !== '') {
    const logUsername = String(log.borrowerUsername).toLowerCase().trim()
    if (username && logUsername && username === logUsername) {
      return true
    }
    // Explicit username mismatch: reject
    return false
  }

  // 3. Legacy records without verifiable borrowerUserId / borrowerUsername:
  // Do NOT guess from loose display names or multiple PIC names (e.g., 'Hadi & Qori').
  // Technicians cannot directly return unverified records. IC SO / IC SM or Super Admin
  // must record the return on behalf of the technician.
  return false
}

export function canReturnOwnVehicle(user, log) {
  if (!user || !log) return false
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD) return false
  // Super Admin can also return
  if (isAuthorizedSuperAdmin(user)) return true
  // Check status is DIPINJAM or PERLU_PERBAIKAN_KEMBALI
  const status = normalizeVehicleStatus(log.statusArmada)
  if (status !== 'DIPINJAM' && status !== 'PERLU_PERBAIKAN_KEMBALI') {
    return false
  }
  return isVehicleBorrower(user, log)
}

export function canRecordVehicleReturnForTechnician(user, log) {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD || role === ROLES.TEKNISI) return false
  // IC SO, IC SM, and Super Admin can record on behalf of technician
  return role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || isAuthorizedSuperAdmin(user)
}

export function canVerifyVehicleReturn(user, log = null) {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === ROLES.DEPT_HEAD || role === ROLES.TEKNISI) return false
  // Only IC SO, IC SM, and authorized Super Admin
  return role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || isAuthorizedSuperAdmin(user)
}

// Normalize internal vehicle status
export function normalizeVehicleStatus(status = '') {
  const s = String(status || '').toUpperCase().trim()
  if (!s || s === 'DIPINJAM' || s === 'ON MISSION') return 'DIPINJAM'
  if (s === 'MENUNGGU_ACC_KEMBALI' || s === 'MENUNGGU VERIFIKASI' || s === 'MENUNGGU ACC' || s === 'WAITING_VERIFICATION') {
    return 'MENUNGGU_ACC_KEMBALI'
  }
  if (s === 'SELESAI' || s === 'COMPLETED' || s === 'DI-ACC SELESAI') return 'SELESAI'
  if (s === 'PERLU_PERBAIKAN_KEMBALI' || s === 'PERLU PERBAIKAN' || s === 'REVISION' || s === 'DITOLAK') {
    return 'PERLU_PERBAIKAN_KEMBALI'
  }
  if (s === 'DIABAIKAN' || s === 'IGNORED') return 'DIABAIKAN'
  return s
}

export function getVehicleStatusBadge(status = '') {
  const normalized = normalizeVehicleStatus(status)
  switch (normalized) {
    case 'DIPINJAM':
      return { label: 'Borrowed', bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' }
    case 'MENUNGGU_ACC_KEMBALI':
      return { label: 'Pending IC Approval', bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' }
    case 'SELESAI':
      return { label: 'Completed', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' }
    case 'PERLU_PERBAIKAN_KEMBALI':
      return { label: 'Needs Rectification', bg: '#FEE2E2', color: '#B91C1C', border: '#FCA5A5' }
    case 'DIABAIKAN':
      return { label: 'Dismissed', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' }
    default:
      return { label: status, bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' }
  }
}

export function canManageVehicle(user) {
  return canBorrowVehicle(user)
}

export function canApproveVehicleReturn(user) {
  return canVerifyVehicleReturn(user)
}

export function canExportData(user) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  // IT Admin TIDAK memiliki akses ekspor operasional secara default
  if (role === ROLES.IT_ADMIN) return false
  // Seluruh role operasional (Teknisi, IC SO, IC SM, FE Admin, Dept Head, Super Admin) memiliki hak ekspor sesuai scope & formatnya
  return true
}

/**
 * Check if user can export in specific format ('EXCEL', 'PDF', 'PPT')
 * Sesuai Matriks RBAC SRS:
 * - Teknisi: PDF only
 * - IC SO / IC SM: Excel, PDF
 * - FE Admin: Excel, PDF
 * - Dept Head: Excel, PDF, PPT
 * - Super Admin: Excel, PDF, PPT
 * - IT Admin: None
 */
export function canExportFormat(user, format = 'PDF') {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.IT_ADMIN) return false
  const fmt = format.toUpperCase()

  if (role === ROLES.TEKNISI) {
    return fmt === 'PDF'
  }

  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE || role === ROLES.ADMIN) {
    return fmt === 'EXCEL' || fmt === 'PDF'
  }

  if (role === ROLES.DEPT_HEAD) {
    return fmt === 'EXCEL' || fmt === 'PDF' || fmt === 'PPT'
  }

  return false
}

export function canViewModule(user, moduleId) {
  if (moduleId === 'chat') return Boolean(user)
  if (!user) return false
  const role = normalizeRole(user.role)
  const rLower = String(user.role || '').toLowerCase()

  // IT Admin
  if (rLower.includes('it admin') || rLower.includes('it_admin')) {
    return true
  }

  // Super Admin: Full access
  if (isSuperAdmin(user)) {
    return true
  }

  // Kepala Departemen: View only on accessible modules, no user mgmt
  if (role === ROLES.DEPT_HEAD) {
    if (moduleId === 'users') return false
    return true
  }

  // Team Leader (IC Operation & IC Maintenance): no users, no administrasi
  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE) {
    if (moduleId === 'users') return false
    if (moduleId === 'administrasi') return false
    return true
  }

  // Teknisi Field Engineer: no users, no administrasi
  if (role === ROLES.TEKNISI) {
    if (moduleId === 'users') return false
    if (moduleId === 'administrasi') return false
    return true
  }

  return true
}

export function canCreateInModule(user, moduleId) {
  if (moduleId === 'chat') return Boolean(user)
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  const rLower = String(user.role || '').toLowerCase()

  if (rLower.includes('it admin') || role === ROLES.IT_ADMIN) {
    return moduleId === 'users'
  }
  if (role === ROLES.ADMIN) return true
  if (role === ROLES.DEPT_HEAD) {
    return false
  }
  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE) {
    return ['troubleshoot', 'maintenance', 'kendaraan', 'perijinan'].includes(moduleId)
  }
  if (role === ROLES.TEKNISI) {
    return ['troubleshoot', 'maintenance', 'kendaraan', 'chat'].includes(moduleId)
  }
  return false
}

export function canDeleteInModule(user, moduleId) {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const role = normalizeRole(user.role)
  if (role === ROLES.ADMIN) return true
  if (role === ROLES.IC_TROUBLESHOOT || role === ROLES.IC_MAINTENANCE) {
    return false
  }
  return false
}

/**
 * Filter tickets scoped to activeUser
 */
export function getPersonalTickets(user, tickets = []) {
  if (!user) return []
  const userIdentifier = (user.name || '').toLowerCase().trim()
  const userEmail = (user.email || '').toLowerCase().trim()
  const userEmpId = (user.employeeId || '').toLowerCase().trim()

  return tickets.filter((t) => {
    const pic = String(t.engineerName || t.pic || '').toLowerCase().trim()
    const email = String(t.engineerEmail || '').toLowerCase().trim()
    const empId = String(t.engineerId || '').toLowerCase().trim()
    const createdBy = String(t.createdBy || '').toLowerCase().trim()
    const createdById = String(t.createdById !== undefined && t.createdById !== null ? t.createdById : '').toLowerCase().trim()
    const userId = String(user.id || '').toLowerCase().trim()

    return (
      (userIdentifier && (pic.includes(userIdentifier) || userIdentifier.includes(pic))) ||
      (userEmail && email === userEmail) ||
      (userEmpId && empId === userEmpId) ||
      (userIdentifier && createdBy.includes(userIdentifier)) ||
      (userId && (createdBy === userId || createdById === userId)) ||
      (userEmpId && (createdBy === userEmpId || createdById === userEmpId))
    )
  })
}

/**
 * Filter tickets visible based on active user's role:
 * - Teknisi: only personal tickets
 * - IC Troubleshoot: Troubleshoot tickets (or personal)
 * - IC Maintenance: Maintenance tickets (or personal)
 * - FE Admin: all tickets
 * - Dept Head: all tickets (for executive/managerial overview)
 */
export function getVisibleTickets(user, tickets = []) {
  if (!user) return []
  if (isSuperAdmin(user)) return tickets
  const role = normalizeRole(user.role)

  if (role === ROLES.ADMIN || role === ROLES.DEPT_HEAD) {
    return tickets
  }

  if (role === ROLES.TEKNISI) {
    return getPersonalTickets(user, tickets)
  }

  if (role === ROLES.IC_TROUBLESHOOT) {
    return tickets.filter((t) => (t.type || '').toUpperCase() === 'TROUBLESHOOT')
  }

  if (role === ROLES.IC_MAINTENANCE) {
    return tickets.filter((t) => (t.type || '').toUpperCase() === 'MAINTENANCE')
  }

  return tickets
}

/**
 * Recent Operational Activity visibility rule:
 * Admin + Ringkasan Operasional = SHOW
 * Admin + KPI = HIDE
 * Teknisi = HIDE
 * IC = HIDE
 * Dept Head = HIDE
 */
export function canViewRecentActivity(user, currentTab, dashboardMode) {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role !== ROLES.ADMIN) return false
  if (currentTab === 'dashboard' && dashboardMode === 'EXECUTIVE') return true
  return false
}

/**
 * Export Operational Data visibility rule:
 * Tampilkan Export Data Operasional pada Dashboard untuk seluruh role yang memiliki hak ekspor (Teknisi, IC SO, IC SM, FE Admin, Dept Head, Super Admin)
 * saat berada pada tab 'dashboard' dan mode 'EXECUTIVE' (Ringkasan Operasional).
 * IT Admin tidak memiliki akses ekspor operasional secara default.
 */
export function canViewExportOperational(user, currentTab, dashboardMode) {
  if (!user) return false
  if (currentTab !== 'dashboard' || dashboardMode !== 'EXECUTIVE') return false
  return canExportData(user)
}
