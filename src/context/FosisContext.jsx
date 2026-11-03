import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react'
import { storageService, STORAGE_KEYS } from '../services/storageService'
import { authService } from '../services/authService'
import {
  users as defaultUsers,
  tickets as defaultTickets,
  permits as defaultPermits,
  vehicleLogs as defaultVehicleLogs,
  chatMessages as defaultChatMessages
} from '../data/mockData'
import {
  canCreateTicket,
  canEditTicket,
  canDeleteTicket,
  canSubmitTicket,
  canVerifyTicket,
  canLockTicket,
  canUnlockTicket,
  canApproveTicket,
  canRejectTicket,
  canCommentTicket,
  canManagePermit,
  canApproveRejectPermit,
  canManageUsers,
  canManageVehicle,
  canApproveVehicleReturn,
  canBorrowVehicle,
  canEditVehicle,
  canDeleteVehicle,
  canReturnOwnVehicle,
  canRecordVehicleReturnForTechnician,
  canVerifyVehicleReturn,
  isAuthorizedSuperAdmin,
  normalizeVehicleStatus,
  canExportData,
  normalizeRole,
  isRecordCreator,
  canShareTicketPdfToWA,
  canEditRecord,
  ROLES
} from '../utils/permissions'

const FosisContext = createContext(null)

// Action Types
const ACTION_TYPES = {
  SET_ACTIVE_USER: 'SET_ACTIVE_USER',
  LOGOUT: 'LOGOUT',
  SET_ONLINE: 'SET_ONLINE',

  // TICKETS / OPERATIONS
  ADD_TICKET: 'ADD_TICKET',
  UPDATE_TICKET: 'UPDATE_TICKET',
  DELETE_TICKET: 'DELETE_TICKET',

  // SIK PERMITS
  ADD_PERMIT: 'ADD_PERMIT',
  UPDATE_PERMIT: 'UPDATE_PERMIT',
  DELETE_PERMIT: 'DELETE_PERMIT',
  SUBMIT_PERMIT: 'SUBMIT_PERMIT',
  APPROVE_PERMIT: 'APPROVE_PERMIT',
  REJECT_PERMIT: 'REJECT_PERMIT',
  IMPORT_PERMITS: 'IMPORT_PERMITS',

  // VEHICLE LOGS
  ADD_VEHICLE_LOG: 'ADD_VEHICLE_LOG',
  UPDATE_VEHICLE_LOG: 'UPDATE_VEHICLE_LOG',
  DELETE_VEHICLE_LOG: 'DELETE_VEHICLE_LOG',

  // CHAT
  SEND_CHAT_MESSAGE: 'SEND_CHAT_MESSAGE',

  // USERS
  ADD_USER: 'ADD_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',

  // ACTIVITY LOGS
  ADD_ACTIVITY_LOG: 'ADD_ACTIVITY_LOG',

  // STORAGE SYNC (Cross-tab)
  SYNC_TICKETS: 'SYNC_TICKETS',
  SYNC_ACTIVITY_LOGS: 'SYNC_ACTIVITY_LOGS',
  SYNC_PERMITS: 'SYNC_PERMITS',
  SYNC_VEHICLES: 'SYNC_VEHICLES',

  // RESET
  RESET_DEMO_DATA: 'RESET_DEMO_DATA'
}

// Initial default activities
const defaultActivityLogs = [
  {
    id: 'act-1',
    action: 'VERIFY',
    entityType: 'TICKET',
    entityId: '[E/260901/0001]',
    actorId: 3,
    actorName: 'Alqori Dewantara',
    role: 'IC Service Operation',
    timestamp: Date.now() - 3600000,
    description: 'Alqori verified troubleshoot ticket [E/260901/0001]'
  },
  {
    id: 'act-2',
    action: 'CREATE',
    entityType: 'MAINTENANCE',
    entityId: 'MNT-260905-001',
    actorId: 4,
    actorName: 'Nemi BR Ginting',
    role: 'IC Service Maintenance',
    timestamp: Date.now() - 7200000,
    description: 'Nemi created preventive maintenance closure ticket MNT-260905-001'
  },
  {
    id: 'act-3',
    action: 'LOCK',
    entityType: 'TICKET',
    entityId: 'MNT-260906-002',
    actorId: 1,
    actorName: 'Sanderlina Imelda',
    role: 'Administration',
    timestamp: Date.now() - 10800000,
    description: 'Sanderlina (Admin) locked data integrity for ticket MNT-260906-002'
  }
]

function getInitialState() {
  let sessionUser = authService.restoreSession()

  // Ensure Sanderlina Imelda is consistently recognized as Super Admin across existing sessions
  if (sessionUser) {
    const isSanderlina =
      String(sessionUser.username || '').toLowerCase() === 'sanderlina.imelda' ||
      String(sessionUser.username || '').toLowerCase() === 'sanderlina' ||
      String(sessionUser.name || '').toLowerCase() === 'sanderlina imelda' ||
      sessionUser.employeeId === 'EMP-001' ||
      String(sessionUser.id) === '1'

    if (isSanderlina) {
      sessionUser = {
        ...sessionUser,
        username: 'sanderlina.imelda',
        role: 'Super Admin',
        isSuperAdmin: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      }
      storageService.setSession({
        ...storageService.getSession(),
        user: sessionUser
      }, sessionUser.rememberMe !== false)
    }
  }

  // Check one-time English localization migration flag
  const MIGRATION_KEY = 'fosis_v3_english_migrated'
  if (!localStorage.getItem(MIGRATION_KEY)) {
    storageService.set(STORAGE_KEYS.USERS, defaultUsers)
    storageService.set(STORAGE_KEYS.TICKETS, defaultTickets)
    storageService.set(STORAGE_KEYS.PERMITS, defaultPermits)
    storageService.set(STORAGE_KEYS.VEHICLE_LOGS, defaultVehicleLogs)
    storageService.set(STORAGE_KEYS.CHAT_MESSAGES, defaultChatMessages)
    storageService.set(STORAGE_KEYS.ACTIVITY_LOGS, defaultActivityLogs)
    localStorage.setItem(MIGRATION_KEY, 'true')
  }
  const rawUsers = storageService.get(STORAGE_KEYS.USERS, defaultUsers) || defaultUsers
  const migratedUsers = rawUsers.map((u) => {
    const isSanderlina =
      String(u.username || '').toLowerCase() === 'sanderlina.imelda' ||
      String(u.username || '').toLowerCase() === 'sanderlina' ||
      String(u.name || '').toLowerCase() === 'sanderlina imelda' ||
      u.employeeId === 'EMP-001' ||
      String(u.id) === '1'

    if (isSanderlina) {
      return {
        ...u,
        username: 'sanderlina.imelda',
        role: 'Super Admin',
        isSuperAdmin: true,
        canCreate: true,
        canEdit: true,
        canDelete: true
      }
    }
    return u
  })
  storageService.set(STORAGE_KEYS.USERS, migratedUsers)

  const rawStoredTickets = storageService.get(STORAGE_KEYS.TICKETS, defaultTickets) || defaultTickets
  const migratedTickets = rawStoredTickets.map((t) => {
    let ws = t.workflowStatus
    if (ws === 'Draft Teknisi') ws = 'Pending IC Verification'
    if (ws === 'Menunggu Verifikasi IC') ws = 'Pending IC Verification'
    if (ws === 'Diverifikasi Team Leader') ws = 'Verified by Team Leader'
    if (ws === 'Menunggu Pengesahan Admin') ws = 'Pending Admin Approval'
    if (ws === 'Terkunci Admin') ws = 'Locked by Admin'
    if (ws === 'Disahkan Admin Hub') ws = 'Approved by Admin Hub'
    if (ws === 'Disahkan Dept. Head') ws = 'Approved by Dept. Head'
    if (ws === 'Ditolak IC (Perlu Revisi)') ws = 'Rejected by IC (Revision Required)'
    return {
      ...t,
      workflowStatus: ws,
      submittedToIC: t.submittedToIC ?? false
    }
  })

  return {
    activeUser: sessionUser,
    isAuthenticated: Boolean(sessionUser),
    online: true,
    users: migratedUsers,
    tickets: migratedTickets,
    permits: storageService.get(STORAGE_KEYS.PERMITS, defaultPermits),
    vehicleLogs: (storageService.get(STORAGE_KEYS.VEHICLE_LOGS, defaultVehicleLogs) || defaultVehicleLogs).map((v) => ({
      ...v,
      statusArmada: normalizeVehicleStatus(v.statusArmada)
    })),
    chatMessages: storageService.get(STORAGE_KEYS.CHAT_MESSAGES, defaultChatMessages),
    activityLogs: storageService.get(STORAGE_KEYS.ACTIVITY_LOGS, defaultActivityLogs)
  }
}

function fosisReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_ACTIVE_USER: {
      return {
        ...state,
        activeUser: action.payload,
        isAuthenticated: Boolean(action.payload)
      }
    }

    case ACTION_TYPES.LOGOUT: {
      authService.logout()
      return {
        ...state,
        activeUser: null,
        isAuthenticated: false
      }
    }

    case ACTION_TYPES.SET_ONLINE: {
      return { ...state, online: action.payload }
    }

    // TICKETS
    case ACTION_TYPES.ADD_TICKET: {
      const updatedTickets = [action.payload, ...state.tickets]
      storageService.set(STORAGE_KEYS.TICKETS, updatedTickets)
      return { ...state, tickets: updatedTickets }
    }

    case ACTION_TYPES.UPDATE_TICKET: {
      const updatedTickets = state.tickets.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload } : t
      )
      storageService.set(STORAGE_KEYS.TICKETS, updatedTickets)
      return { ...state, tickets: updatedTickets }
    }

    case ACTION_TYPES.DELETE_TICKET: {
      const updatedTickets = state.tickets.filter((t) => t.id !== action.payload.id)
      storageService.set(STORAGE_KEYS.TICKETS, updatedTickets)
      return { ...state, tickets: updatedTickets }
    }

    // SIK PERMITS
    case ACTION_TYPES.ADD_PERMIT: {
      const updated = [action.payload, ...state.permits]
      storageService.set(STORAGE_KEYS.PERMITS, updated)
      return { ...state, permits: updated }
    }

    case ACTION_TYPES.UPDATE_PERMIT: {
      const updated = state.permits.map((p) =>
        p.id === action.payload.id ? { ...p, ...action.payload } : p
      )
      storageService.set(STORAGE_KEYS.PERMITS, updated)
      return { ...state, permits: updated }
    }

    case ACTION_TYPES.DELETE_PERMIT: {
      const updated = state.permits.filter((p) => p.id !== action.payload.id)
      storageService.set(STORAGE_KEYS.PERMITS, updated)
      return { ...state, permits: updated }
    }

    case ACTION_TYPES.IMPORT_PERMITS: {
      const updated = [...action.payload, ...state.permits]
      storageService.set(STORAGE_KEYS.PERMITS, updated)
      return { ...state, permits: updated }
    }

    // VEHICLE LOGS
    case ACTION_TYPES.ADD_VEHICLE_LOG: {
      const updated = [action.payload, ...state.vehicleLogs]
      storageService.set(STORAGE_KEYS.VEHICLE_LOGS, updated)
      return { ...state, vehicleLogs: updated }
    }

    case ACTION_TYPES.UPDATE_VEHICLE_LOG: {
      const updated = state.vehicleLogs.map((v) =>
        v.id === action.payload.id ? { ...v, ...action.payload } : v
      )
      storageService.set(STORAGE_KEYS.VEHICLE_LOGS, updated)
      return { ...state, vehicleLogs: updated }
    }

    case ACTION_TYPES.DELETE_VEHICLE_LOG: {
      const updated = state.vehicleLogs.filter((v) => v.id !== action.payload.id)
      storageService.set(STORAGE_KEYS.VEHICLE_LOGS, updated)
      return { ...state, vehicleLogs: updated }
    }

    // CHAT
    case ACTION_TYPES.SEND_CHAT_MESSAGE: {
      const updated = [...state.chatMessages, action.payload]
      storageService.set(STORAGE_KEYS.CHAT_MESSAGES, updated)
      return { ...state, chatMessages: updated }
    }

    // USERS
    case ACTION_TYPES.ADD_USER: {
      const updated = [...state.users, action.payload]
      storageService.set(STORAGE_KEYS.USERS, updated)
      return { ...state, users: updated }
    }

    case ACTION_TYPES.UPDATE_USER: {
      const updated = state.users.map((u) => (u.id === action.payload.id ? { ...u, ...action.payload } : u))
      storageService.set(STORAGE_KEYS.USERS, updated)
      let activeUser = state.activeUser
      if (activeUser?.id === action.payload.id) {
        activeUser = { ...activeUser, ...action.payload }
      }
      return { ...state, users: updated, activeUser }
    }

    case ACTION_TYPES.DELETE_USER: {
      const updated = state.users.filter((u) => u.id !== action.payload.id)
      storageService.set(STORAGE_KEYS.USERS, updated)
      return { ...state, users: updated }
    }

    // ACTIVITY LOGS
    case ACTION_TYPES.ADD_ACTIVITY_LOG: {
      const updated = [action.payload, ...state.activityLogs].slice(0, 80)
      storageService.set(STORAGE_KEYS.ACTIVITY_LOGS, updated)
      return { ...state, activityLogs: updated }
    }

    // RESET ALL DEMO DATA
    case ACTION_TYPES.RESET_DEMO_DATA: {
      storageService.clearAllFosisData()
      storageService.set(STORAGE_KEYS.USERS, defaultUsers)
      storageService.set(STORAGE_KEYS.TICKETS, defaultTickets)
      storageService.set(STORAGE_KEYS.PERMITS, defaultPermits)
      storageService.set(STORAGE_KEYS.VEHICLE_LOGS, defaultVehicleLogs)
      storageService.set(STORAGE_KEYS.CHAT_MESSAGES, defaultChatMessages)
      storageService.set(STORAGE_KEYS.ACTIVITY_LOGS, defaultActivityLogs)
      return {
        ...state,
        users: defaultUsers,
        tickets: defaultTickets,
        permits: defaultPermits,
        vehicleLogs: defaultVehicleLogs,
        chatMessages: defaultChatMessages,
        activityLogs: defaultActivityLogs
      }
    }

    case ACTION_TYPES.SYNC_TICKETS:
      return { ...state, tickets: action.payload }
    case ACTION_TYPES.SYNC_ACTIVITY_LOGS:
      return { ...state, activityLogs: action.payload }
    case ACTION_TYPES.SYNC_PERMITS:
      return { ...state, permits: action.payload }
    case ACTION_TYPES.SYNC_VEHICLES:
      return { ...state, vehicleLogs: action.payload }

    default:
      return state
  }
}

export function FosisProvider({ children }) {
  const [state, dispatch] = useReducer(fosisReducer, null, getInitialState)

  // Sync state to local storage if initialized
  useEffect(() => {
    if (!storageService.get(STORAGE_KEYS.USERS)) {
      storageService.set(STORAGE_KEYS.USERS, defaultUsers)
    }
    if (!storageService.get(STORAGE_KEYS.TICKETS)) {
      storageService.set(STORAGE_KEYS.TICKETS, defaultTickets)
    }
    if (!storageService.get(STORAGE_KEYS.PERMITS)) {
      storageService.set(STORAGE_KEYS.PERMITS, defaultPermits)
    }
    if (!storageService.get(STORAGE_KEYS.VEHICLE_LOGS)) {
      storageService.set(STORAGE_KEYS.VEHICLE_LOGS, defaultVehicleLogs)
    }
    if (!storageService.get(STORAGE_KEYS.CHAT_MESSAGES)) {
      storageService.set(STORAGE_KEYS.CHAT_MESSAGES, defaultChatMessages)
    }
    if (state.activeUser && !storageService.get('fosis_active_sessions')) {
      storageService.set('fosis_active_sessions', {
        id: state.activeUser.id,
        name: state.activeUser.name,
        role: state.activeUser.role,
        status: 'Sedang Online',
        loginTime: Date.now()
      })
    }
  }, [state.activeUser])

  // Real-time synchronization across browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key) return
      try {
        if (e.key === STORAGE_KEYS.TICKETS && e.newValue) {
          const tickets = JSON.parse(e.newValue)
          if (Array.isArray(tickets)) dispatch({ type: ACTION_TYPES.SYNC_TICKETS, payload: tickets })
        } else if (e.key === STORAGE_KEYS.ACTIVITY_LOGS && e.newValue) {
          const logs = JSON.parse(e.newValue)
          if (Array.isArray(logs)) dispatch({ type: ACTION_TYPES.SYNC_ACTIVITY_LOGS, payload: logs })
        } else if (e.key === STORAGE_KEYS.PERMITS && e.newValue) {
          const permits = JSON.parse(e.newValue)
          if (Array.isArray(permits)) dispatch({ type: ACTION_TYPES.SYNC_PERMITS, payload: permits })
        } else if (e.key === STORAGE_KEYS.VEHICLE_LOGS && e.newValue) {
          const vlogs = JSON.parse(e.newValue)
          if (Array.isArray(vlogs)) dispatch({ type: ACTION_TYPES.SYNC_VEHICLES, payload: vlogs })
        }
      } catch (err) {
        console.warn('Storage sync error:', err)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Helper action: Log an activity
  const logActivity = (action, entityType, entityId, description, customActor = null) => {
    const actor = customActor || state.activeUser || { id: 0, name: 'Sistem FOSIS', role: 'System' }
    const logItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entityType,
      entityId,
      actorId: actor.id || 0,
      actorName: actor.name || 'Petugas FOSIS',
      role: actor.role || 'Staff',
      timestamp: Date.now(),
      description
    }
    dispatch({ type: ACTION_TYPES.ADD_ACTIVITY_LOG, payload: logItem })
  }

  // Context value methods with strict RBAC enforcement
  const actions = useMemo(
    () => ({
      setActiveUser: (user) => {
        if (user) {
          logActivity('LOGIN', 'AUTH', user?.email || user?.id, `${user?.name} logged in to the system.`, user)
          const sessionInfo = {
            id: user.id,
            name: user.name,
            role: user.role,
            status: 'Online',
            loginTime: Date.now()
          }
          storageService.set('fosis_active_sessions', sessionInfo)
        }
        dispatch({ type: ACTION_TYPES.SET_ACTIVE_USER, payload: user })
      },

      logout: () => {
        const actor = state.activeUser
        if (actor) {
          logActivity('LOGOUT', 'AUTH', actor?.id, `${actor?.name} logged out from the system.`, actor)
        }
        storageService.remove('fosis_active_sessions')
        dispatch({ type: ACTION_TYPES.LOGOUT })
      },

      setOnline: (val) => dispatch({ type: ACTION_TYPES.SET_ONLINE, payload: val }),

      // ==========================================
      // TICKETS / OPERATIONS CRUD & RBAC
      // ==========================================
      addTicket: (ticketData) => {
        const ticketType = ticketData.type || 'TROUBLESHOOT'
        if (!canCreateTicket(state.activeUser, ticketType)) {
          return { success: false, message: 'You do not have permission to create this type of ticket.' }
        }

        const actor = state.activeUser || { name: 'FOSIS Officer' }
        const isAdministrasi = ticketType === 'ADMINISTRASI'
        const isTroubleshoot = ticketType === 'TROUBLESHOOT'
        const isMaintenance = ticketType === 'MAINTENANCE'
        const isOperationalTicket = isTroubleshoot || isMaintenance

        // Troubleshooting & Maintenance immediately enter verification queue (Pending IC Verification / PENDING_IC)
        // Administrasi is completed upon recording or retains provided status
        const initialWorkflowStatus = isOperationalTicket
          ? 'Pending IC Verification'
          : (ticketData.workflowStatus || 'Approved by Admin Hub')

        // Normalize maintenance status
        let rawMntStatus = ticketData.maintenanceStatus || 'ON PROGRESS'
        if (rawMntStatus === 'ON PROGRES') rawMntStatus = 'ON PROGRESS'

        let newTicket
        if (isAdministrasi) {
          // Clean payload specifically for Administrasi (no technical fictions)
          const adminActivityVal = (ticketData.adminActivity || ticketData.activity || 'ADMIN').toUpperCase() === 'LOGISTIC'
            ? 'LOGISTIK'
            : (ticketData.adminActivity || ticketData.activity || 'ADMIN')

          newTicket = {
            id: Date.now(),
            ticketNo:
              ticketData.ticketNo ||
              `ADM-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}07-${String(state.tickets.length + 1).padStart(3, '0')}`,
            type: 'ADMINISTRASI',
            title: ticketData.title,
            tanggal: ticketData.tanggal || new Date().getDate(),
            bulan: ticketData.bulan || 'MARCH',
            tahun: ticketData.tahun || '2026',
            adminTask: ticketData.adminTask || ticketData.task || 'REPORT',
            subTask: ticketData.subTask || 'VENDOR',
            subTask1: ticketData.subTask1 || 'SURAT IJIN',
            viaChannel: ticketData.viaChannel || ticketData.via || 'PORTAL',
            adminStatus: ticketData.adminStatus || ticketData.status || 'DONE',
            adminKategori: ticketData.adminKategori || ticketData.kategori || 'REQUEST INTERNAL',
            adminActivity: adminActivityVal,
            siteLocationName: ticketData.siteLocation || ticketData.site || ticketData.siteLocationName || '',
            site: ticketData.siteLocation || ticketData.site || ticketData.siteLocationName || '',
            engineerName: actor.name || ticketData.engineerName || ticketData.pic || 'Operations Admin',
            pic: actor.name || ticketData.pic || ticketData.engineerName || 'Operations Admin',
            materialUsed: ticketData.materialUsed || ticketData.material || '',
            material: ticketData.materialUsed || ticketData.material || '',
            secretNotes: ticketData.secretNotes || ticketData.notes || '',
            notes: ticketData.secretNotes || ticketData.notes || '',
            urgent: Boolean(ticketData.isUrgent || ticketData.urgent),
            isUrgent: Boolean(ticketData.isUrgent || ticketData.urgent),
            workflowStatus: initialWorkflowStatus,
            locked: false,
            isLocked: false,
            // Do not inject fake GPS coordinates if not explicitly provided
            latitude: ticketData.latitude !== undefined && ticketData.latitude !== null && ticketData.latitude !== '' ? Number(ticketData.latitude) : null,
            longitude: ticketData.longitude !== undefined && ticketData.longitude !== null && ticketData.longitude !== '' ? Number(ticketData.longitude) : null,
            createdAt: new Date().toISOString(),
            createdById: actor.id || actor.employeeId || '1',
            createdBy: actor.id || actor.employeeId || '1',
            creatorName: actor.name || 'User',
            engineer: actor.name || ticketData.engineerName || 'Field Engineer',
            personnel: actor.name || ticketData.personnel || 'Field Engineer',
            workflowHistory: [
              {
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: actor.name,
                status: initialWorkflowStatus,
                note: 'Operational administration record created successfully.'
              }
            ]
          }
        } else {
          // Troubleshoot & Maintenance
          newTicket = {
            id: Date.now(),
            ticketNo:
              ticketData.ticketNo ||
              (isTroubleshoot
                ? `[E/${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}01/${String(state.tickets.length + 1).padStart(4, '0')}]`
                : `MNT-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}05-${String(state.tickets.length + 1).padStart(3, '0')}`),
            type: ticketType,
            title: ticketData.title,
            bulan: ticketData.bulan || 'MARCH',
            tahun: ticketData.tahun || '2026',
            infra: ticketData.infra || ticketData.infraCategory || 'Closure',
            detailAktivitas: ticketData.detailAktivitas || ticketData.infraActivity || '',
            infraCategory: ticketData.infraCategory || ticketData.infra || 'Closure',
            infraActivity: ticketData.infraActivity || ticketData.detailAktivitas || '',
            workflowStatus: initialWorkflowStatus,
            submittedToIC: isOperationalTicket ? true : Boolean(ticketData.submittedToIC),
            internalStatus: isOperationalTicket ? 'PENDING_IC' : (ticketData.internalStatus || 'DRAFT'),
            // SLA status only for Troubleshoot
            ...(isTroubleshoot ? { slaStatus: ticketData.slaStatus || 'IN SLA' } : {}),
            // Maintenance status only for Maintenance
            ...(isMaintenance ? { maintenanceStatus: rawMntStatus } : {}),
            changeRequest: ticketData.changeRequest || ticketData.crStatus || 'DONE',
            crStatus: ticketData.crStatus || ticketData.changeRequest || 'DONE',
            rootCause: ticketData.rootCause || 'CABLE',
            impact: ticketData.impact || 'FO CUT',
            serviceImpact: ticketData.serviceImpact || 'BACKBONE',
            mitra: ticketData.mitra || 'INTERNAL',
            category: ticketData.category || 'DOWN',
            kegiatan: ticketData.kegiatan || 'Maintenance',
            requestor: ticketData.requestor || 'SO',
            taskType: ticketData.taskType || 'PLAN',
            tanggal: ticketData.tanggal || new Date().getDate(),
            adminTask: ticketData.adminTask || 'REPORT',
            subTask: ticketData.subTask || 'MONTHLY',
            subTask1: ticketData.subTask1 || 'MATERIAL',
            viaChannel: ticketData.viaChannel || 'PORTAL',
            adminStatus: ticketData.adminStatus || 'CONTINUE',
            adminKategori: ticketData.adminKategori || 'REQUEST INTERNAL',
            adminActivity: ticketData.adminActivity || 'ADMIN',
            siteLocationName: ticketData.siteLocation || ticketData.site || 'POP Surabaya Gubeng',
            site: ticketData.siteLocation || ticketData.site || 'POP Surabaya Gubeng',
            engineerName: actor.name || ticketData.engineerName || 'Field Engineer',
            pic: actor.name || ticketData.pic || 'Field Engineer',
            materialUsed: ticketData.materialUsed || ticketData.material || '',
            otdrPdfAttachments: ticketData.otdrAttachments || ticketData.otdrPdfAttachments || '',
            workPhotos: Array.isArray(ticketData.workPhotos) ? ticketData.workPhotos : [],
            secretNotes: ticketData.secretNotes || ticketData.notes || '',
            notes: ticketData.secretNotes || ticketData.notes || '',
            urgent: Boolean(ticketData.isUrgent || ticketData.urgent),
            locked: false,
            isLocked: false,
            latitude: ticketData.latitude || -7.2575,
            longitude: ticketData.longitude || 112.7521,
            createdAt: new Date().toISOString(),
            createdById: actor.id || actor.employeeId || '1',
            createdBy: actor.id || actor.employeeId || '1',
            creatorName: actor.name || 'User',
            engineer: actor.name || ticketData.engineerName || 'Field Engineer',
            personnel: actor.name || ticketData.personnel || 'Field Engineer',
            workflowHistory: [
              {
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                user: actor.name,
                status: initialWorkflowStatus,
                note: `Ticket ${ticketData.type || 'TROUBLESHOOT'} created and queued for IC verification.`
              }
            ]
          }
        }

        dispatch({ type: ACTION_TYPES.ADD_TICKET, payload: newTicket })
        logActivity('CREATE', newTicket.type, newTicket.ticketNo, `${actor.name} created new ticket ${newTicket.ticketNo}`)
        return { success: true, ticket: newTicket, message: 'Ticket created successfully.' }
      },

      updateTicket: (ticketIdOrObj, changes = null) => {
        const ticketId = typeof ticketIdOrObj === 'object' ? ticketIdOrObj.id : ticketIdOrObj
        const targetChanges = typeof ticketIdOrObj === 'object' && !changes ? ticketIdOrObj : (changes || {})

        const existing = state.tickets.find((t) => t.id === ticketId)
        if (!existing) {
          return { success: false, message: 'Ticket not found.' }
        }

        // Verify edit permission for existing and target type
        const targetType = targetChanges.type || existing.type || 'TROUBLESHOOT'
        if (!canEditTicket(state.activeUser, existing) || !canEditTicket(state.activeUser, { ...existing, type: targetType })) {
          return { success: false, message: 'You do not have permission to edit this ticket (ticket is locked or restricted for your role).' }
        }

        const actor = state.activeUser || { name: 'Operations Staff' }

        // Normalize maintenance status if present
        let cleanedChanges = { ...targetChanges }
        if (cleanedChanges.maintenanceStatus === 'ON PROGRES') {
          cleanedChanges.maintenanceStatus = 'ON PROGRESS'
        }

        // Preserve data integrity: id, ticketNo, createdById, createdBy cannot be overwritten
        let workflowHistory = [...(existing.workflowHistory || [])]
        const isRevisionResubmit =
          cleanedChanges.workflowStatus === 'Pending IC Verification' &&
          ((existing.workflowStatus || '').toLowerCase().includes('ditolak') ||
            (existing.workflowStatus || '').toLowerCase().includes('reject') ||
            (existing.workflowStatus || '').toLowerCase().includes('revisi') ||
            (existing.workflowStatus || '').toLowerCase().includes('revision') ||
            existing.submittedToIC === false)

        if (isRevisionResubmit) {
          cleanedChanges.submittedToIC = true
          cleanedChanges.internalStatus = 'PENDING_IC'
          cleanedChanges.resubmittedAt = new Date().toISOString()
          cleanedChanges.resubmittedBy = actor.name
          workflowHistory.push({
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            user: actor.name,
            status: 'Pending IC Verification',
            note: `Revised report resubmitted by ${actor.name} to IC Team.`
          })
        }

        const updated = {
          ...existing,
          ...cleanedChanges,
          id: existing.id,
          ticketNo: existing.ticketNo,
          createdById: existing.createdById,
          createdBy: existing.createdBy,
          workflowHistory,
          updatedAt: new Date().toISOString(),
          updatedBy: actor.name
        }

        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('UPDATE', updated.type, updated.ticketNo, `${actor.name} updated ticket data ${updated.ticketNo}`)
        return { success: true, ticket: updated, message: 'Ticket updated successfully.' }
      },

      deleteTicket: (ticketIdOrObj) => {
        const ticketId = typeof ticketIdOrObj === 'object' ? ticketIdOrObj.id : ticketIdOrObj
        const existing = state.tickets.find((t) => t.id === ticketId)
        if (!existing) {
          return { success: false, message: 'Ticket not found.' }
        }

        if (!canDeleteTicket(state.activeUser, existing)) {
          return { success: false, message: 'You do not have authorization to delete tickets. This action requires Super Admin privileges.' }
        }

        dispatch({ type: ACTION_TYPES.DELETE_TICKET, payload: existing })
        logActivity('DELETE', existing.type, existing.ticketNo, `${state.activeUser?.name || 'Admin'} deleted ticket ${existing.ticketNo}`)
        return { success: true, message: `Ticket ${existing.ticketNo} deleted successfully.` }
      },

      // ==========================================
      // 4-TIER WORKFLOW ACTIONS & RBAC
      // ==========================================
      submitByTechnician: (ticketId) => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canSubmitTicket(state.activeUser, ticket)) {
          return { success: false, message: 'Only the assigned Field Engineer or Super Admin can submit ticket drafts.' }
        }

        const actor = state.activeUser || { name: 'Ahmad Ibrahim' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Pending IC Verification',
          note: `Work report submitted by ${actor.name} to IC Team.`
        }
        const updated = {
          ...ticket,
          workflowStatus: 'Pending IC Verification',
          submittedToIC: true,
          submittedAt: new Date().toISOString(),
          submittedBy: actor.name,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('SUBMIT', ticket.type, ticket.ticketNo, `${actor.name} submitted ticket ${ticket.ticketNo} to IC`)
        return { success: true, message: `Ticket ${ticket.ticketNo} submitted to IC successfully.` }
      },

      verifyByIC: (ticketId) => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canVerifyTicket(state.activeUser, ticket)) {
          return {
            success: false,
            message: 'You do not have verification authority. IC Troubleshoot may only verify Troubleshoot tickets, and IC Maintenance may only verify Maintenance tickets.'
          }
        }

        const actor = state.activeUser || { name: 'IC Team' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Pending Admin Approval',
          note: `Technical verification & validation approved by ${actor.name}. Forwarded to Admin Hub.`
        }
        const updated = {
          ...ticket,
          workflowStatus: 'Pending Admin Approval',
          verifiedAt: new Date().toISOString(),
          verifiedBy: actor.name,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('VERIFY', ticket.type, ticket.ticketNo, `${actor.name} verified ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} verified and forwarded to Admin Hub.` }
      },

      returnForRevisionByIC: (ticketId, reason = '') => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canVerifyTicket(state.activeUser, ticket)) {
          return {
            success: false,
            message: 'You do not have authority to reject verification for this ticket.'
          }
        }

        const actor = state.activeUser || { name: 'IC Team' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Rejected by IC (Revision Required)',
          note: `Verification rejected by ${actor.name}: ${reason || 'Report documentation requires improvement.'}`
        }
        const updated = {
          ...ticket,
          workflowStatus: 'Rejected by IC (Revision Required)',
          submittedToIC: false,
          revisionReason: reason || 'Technical documentation requires rectification.',
          revisionRequestedAt: new Date().toISOString(),
          revisionRequestedBy: actor.name,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('REVISION', ticket.type, ticket.ticketNo, `${actor.name} rejected verification for ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} rejected by IC and sent for engineer revision.` }
      },

      approveByAdminHub: (ticketId) => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canLockTicket(state.activeUser)) {
          return { success: false, message: 'Only Admin Hub or Super Admin can authorize this report.' }
        }

        // Operational tickets (Troubleshoot & Maintenance) must be verified by IC first
        const isOp = (ticket.type || '').toUpperCase() === 'TROUBLESHOOT' || (ticket.type || '').toUpperCase() === 'MAINTENANCE'
        const isVerifiedByIC = ticket.verifiedBy || (ticket.workflowStatus || '').toLowerCase().includes('admin') || (ticket.workflowStatus || '').toLowerCase().includes('approved') || (ticket.workflowStatus || '').toLowerCase().includes('disahkan')
        if (isOp && !isVerifiedByIC) {
          return { success: false, message: 'Ticket has not been verified by IC. Admin approval can only occur after IC verification.' }
        }

        const actor = state.activeUser || { name: 'Admin Hub' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Approved by Admin Hub',
          note: `Work report officially approved by ${actor.name}. Status: Completed.`
        }
        const updated = {
          ...ticket,
          locked: true,
          isLocked: true,
          workflowStatus: 'Approved by Admin Hub',
          lockedAt: new Date().toISOString(),
          lockedBy: actor.name,
          maintenanceStatus: ticket.type === 'MAINTENANCE' ? 'DONE' : ticket.maintenanceStatus,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('APPROVE_ADMIN', ticket.type, ticket.ticketNo, `${actor.name} approved ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} approved by Admin Hub successfully!` }
      },

      lockByAdmin: (ticketId) => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canLockTicket(state.activeUser)) {
          return { success: false, message: 'Only Administrators have authorization to lock ticket data integrity.' }
        }

        const isOp = (ticket.type || '').toUpperCase() === 'TROUBLESHOOT' || (ticket.type || '').toUpperCase() === 'MAINTENANCE'
        const isVerifiedByIC = ticket.verifiedBy || (ticket.workflowStatus || '').toLowerCase().includes('admin') || (ticket.workflowStatus || '').toLowerCase().includes('approved') || (ticket.workflowStatus || '').toLowerCase().includes('disahkan')
        if (isOp && !isVerifiedByIC) {
          return { success: false, message: 'Ticket has not been verified by IC. Data integrity can only be locked after IC verification.' }
        }

        const actor = state.activeUser || { name: 'Admin' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Approved by Admin Hub',
          note: 'Data integrity officially approved and locked by Operational Admin Hub.'
        }
        const updated = {
          ...ticket,
          locked: true,
          isLocked: true,
          workflowStatus: 'Approved by Admin Hub',
          lockedAt: new Date().toISOString(),
          lockedBy: actor.name,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('LOCK', ticket.type, ticket.ticketNo, `${actor.name} locked ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} data integrity locked and inventory deducted.` }
      },

      unlockByAdmin: (ticketId) => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canUnlockTicket(state.activeUser)) {
          return { success: false, message: 'Only Administrators have authority to unlock tickets.' }
        }

        const actor = state.activeUser || { name: 'Admin' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Pending Admin Approval',
          note: 'Ticket lock reopened by Admin.'
        }
        const updated = {
          ...ticket,
          locked: false,
          isLocked: false,
          workflowStatus: 'Pending Admin Approval',
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('UNLOCK', ticket.type, ticket.ticketNo, `${actor.name} unlocked ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} lock opened.` }
      },

      approveByDeptHead: (ticketId, comment = '') => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canApproveTicket(state.activeUser)) {
          return { success: false, message: 'Only Department Head or Administrator can approve final workflow.' }
        }

        const actor = state.activeUser || { name: 'Dept Head' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Approved by Dept. Head',
          note: comment || 'Officially approved during workflow review.'
        }
        const updated = {
          ...ticket,
          workflowStatus: 'Approved by Dept. Head',
          deptHeadComment: comment,
          approvedAt: new Date().toISOString(),
          approvedBy: actor.name,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('APPROVE', ticket.type, ticket.ticketNo, `${actor.name} approved ticket ${ticket.ticketNo}`)
        return { success: true, message: `Ticket ${ticket.ticketNo} officially approved by Dept. Head.` }
      },

      rejectByDeptHead: (ticketId, reason = '') => {
        const ticket = state.tickets.find((t) => t.id === ticketId)
        if (!ticket) return { success: false, message: 'Ticket not found.' }

        if (!canRejectTicket(state.activeUser)) {
          return { success: false, message: 'Only Department Head or Administrator can reject ticket authorization.' }
        }

        const actor = state.activeUser || { name: 'Dept Head' }
        const historyItem = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: actor.name,
          status: 'Pending IC Verification',
          note: `Rejection by ${actor.name}: ${reason || 'Field technical data requires revision.'}`
        }
        const updated = {
          ...ticket,
          workflowStatus: 'Pending IC Verification',
          locked: false,
          isLocked: false,
          rejectionReason: reason,
          workflowHistory: [...(ticket.workflowHistory || []), historyItem]
        }
        dispatch({ type: ACTION_TYPES.UPDATE_TICKET, payload: updated })
        logActivity('REJECT', ticket.type, ticket.ticketNo, `${actor.name} returned ticket ${ticket.ticketNo} for revision.`)
        return { success: true, message: `Ticket ${ticket.ticketNo} returned for engineer revision.` }
      },

      // ==========================================
      // PERMITS (SIK) LIFECYCLE & RBAC
      // ==========================================
      addPermit: (permitData) => {
        const actor = state.activeUser || { id: '1', name: 'Field Team' }
        const newPermit = {
          id: permitData.id || Date.now(),
          permitNo: permitData.permitNo || permitData.pfNo || `SIK-${new Date().getFullYear()}-${String(state.permits.length + 1).padStart(4, '0')}`,
          pfNo: permitData.pfNo || permitData.permitNo || `PF-${new Date().getFullYear()}-${String(state.permits.length + 1).padStart(4, '0')}`,
          typeOfOrder: permitData.typeOfOrder || 'New',
          otherOrderText: permitData.otherOrderText || '',
          companyName: permitData.companyName || permitData.company || permitData.vendor || '-',
          company: permitData.companyName || permitData.company || permitData.vendor || actor.region || 'Internal FOSIS',
          customerCode: permitData.customerCode || '-',
          customerType: permitData.customerType || 'Enterprise',
          address: permitData.address || permitData.siteLocation || permitData.site || 'POP Surabaya Gubeng',
          site: permitData.address || permitData.site || permitData.siteLocation || 'POP Surabaya Gubeng',
          siteLocation: permitData.address || permitData.siteLocation || permitData.site || 'POP Surabaya Gubeng',
          customerName: permitData.customerName || permitData.applicantName || '-',
          applicantName: permitData.applicantName || permitData.customerName || actor.name,
          telp: permitData.telp || '-',
          picOnsite: permitData.picOnsite || '-',
          email: permitData.email || '-',
          am: permitData.am || '-',
          rfsDate: permitData.rfsDate || permitData.startDate || new Date().toISOString().slice(0, 10),
          startDate: permitData.startDate || permitData.rfsDate || new Date().toISOString().slice(0, 10),
          endDate: permitData.endDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          typeOfService: permitData.typeOfService || permitData.workType || 'Optical Fiber & Splicing',
          workType: permitData.typeOfService || permitData.workType || 'Optical Fiber & Splicing',
          bandwidth: permitData.bandwidth || '-',
          circuitId: permitData.circuitId || '-',
          interfaceType: permitData.interfaceType || '-',
          equipment: permitData.equipment || permitData.safety || permitData.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Shoes',
          safety: permitData.equipment || permitData.safety || permitData.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Shoes',
          jsaChecklist: permitData.equipment || permitData.safety || permitData.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Shoes',
          terminationLocation1: permitData.terminationLocation1 || permitData.site || 'POP Surabaya Gubeng',
          terminationLocation2: permitData.terminationLocation2 || '-',
          testResults: permitData.testResults || [
            { pingTime: '2 ms', upload: '100 Mbps', download: '100 Mbps', destination: 'Gateway POP' },
            { pingTime: '', upload: '', download: '', destination: '' },
            { pingTime: '', upload: '', download: '', destination: '' }
          ],
          ipBlock: permitData.ipBlock || '-',
          ipPtP1: permitData.ipPtP1 || '-',
          ipPtP2: permitData.ipPtP2 || '-',
          customerSignName: permitData.customerSignName || permitData.customerName || '',
          customerSignDate: permitData.customerSignDate || permitData.endDate || '',
          engineerSignName: permitData.engineerSignName || actor.name || '',
          engineerSignDate: permitData.engineerSignDate || permitData.startDate || '',
          hours: permitData.hours || permitData.workHours || '08:00 - 17:00 UTC+7',
          workHours: permitData.hours || permitData.workHours || '08:00 - 17:00 UTC+7',
          // SIK LIFECYCLE: Default is DRAFT upon creation
          status: permitData.status || 'DRAFT',
          latitude: permitData.latitude || -7.2575,
          longitude: permitData.longitude || 112.7521,
          notes: permitData.notes || '',
          importedByAdmin: Boolean(permitData.importedByAdmin),
          createdAt: new Date().toISOString(),
          createdBy: actor.id || actor.employeeId || '1',
          creatorName: actor.name || 'User',
          createdById: actor.id || actor.employeeId || '1',
          engineer: actor.name,
          personnel: actor.name,
          pic: actor.name
        }
        dispatch({ type: ACTION_TYPES.ADD_PERMIT, payload: newPermit })
        logActivity('CREATE_PERMIT', 'PERMIT', newPermit.permitNo, `${actor.name} created work permit draft ${newPermit.permitNo}`)
        return { success: true, permit: newPermit, message: 'Work permit draft created successfully.' }
      },

      submitPermit: (permitId) => {
        const permit = state.permits.find((p) => p.id === permitId)
        if (!permit) return { success: false, message: 'Work permit not found.' }

        const updated = {
          ...permit,
          status: 'WAITING_APPROVAL',
          submittedAt: new Date().toISOString(),
          submittedBy: state.activeUser?.name || 'Applicant'
        }
        dispatch({ type: ACTION_TYPES.UPDATE_PERMIT, payload: updated })
        logActivity('SUBMIT', 'PERMIT', permit.permitNo, `${state.activeUser?.name} submitted work permit ${permit.permitNo}`)
        return { success: true, message: `Work permit ${permit.permitNo} submitted for approval.` }
      },

      approvePermit: (permitId) => {
        const permit = state.permits.find((p) => p.id === permitId)
        if (!permit) return { success: false, message: 'Work permit not found.' }

        if (!canApproveRejectPermit(state.activeUser)) {
          return { success: false, message: 'You do not have authorization to approve work permits.' }
        }

        const actor = state.activeUser || { name: 'Operations Admin' }
        const updated = {
          ...permit,
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          approvedBy: actor.name
        }
        dispatch({ type: ACTION_TYPES.UPDATE_PERMIT, payload: updated })
        logActivity('APPROVE_PERMIT', 'PERMIT', permit.permitNo, `${actor.name} approved work permit ${permit.permitNo}`)
        return { success: true, message: `Work permit ${permit.permitNo} officially approved.` }
      },

      rejectPermit: (permitId, reason = '') => {
        const permit = state.permits.find((p) => p.id === permitId)
        if (!permit) return { success: false, message: 'Work permit not found.' }

        if (!canApproveRejectPermit(state.activeUser)) {
          return { success: false, message: 'You do not have authorization to reject work permits.' }
        }

        const actor = state.activeUser || { name: 'Operations Admin' }
        const updated = {
          ...permit,
          status: 'REJECTED',
          rejectedAt: new Date().toISOString(),
          rejectedBy: actor.name,
          rejectionReason: reason || 'HSE or technical requirements incomplete.'
        }
        dispatch({ type: ACTION_TYPES.UPDATE_PERMIT, payload: updated })
        logActivity('REJECT_PERMIT', 'PERMIT', permit.permitNo, `${actor.name} rejected work permit ${permit.permitNo}`)
        return { success: true, message: `Work permit ${permit.permitNo} rejected.` }
      },

      updatePermit: (permitIdOrObj, changes = null) => {
        const permitId = typeof permitIdOrObj === 'object' ? permitIdOrObj.id : permitIdOrObj
        const targetChanges = typeof permitIdOrObj === 'object' && !changes ? permitIdOrObj : changes

        const existing = state.permits.find((p) => p.id === permitId)
        if (!existing) return { success: false, message: 'Work permit not found.' }

        if (existing.status === 'APPROVED' && !canManagePermit(state.activeUser)) {
          return { success: false, message: 'Approved work permits cannot be modified arbitrarily.' }
        }

        const updated = {
          ...existing,
          ...targetChanges,
          id: existing.id,
          permitNo: existing.permitNo,
          updatedAt: new Date().toISOString()
        }
        dispatch({ type: ACTION_TYPES.UPDATE_PERMIT, payload: updated })
        return { success: true, message: 'Work permit updated successfully.' }
      },

      deletePermit: (permitIdOrObj) => {
        const permitId = typeof permitIdOrObj === 'object' ? permitIdOrObj.id : permitIdOrObj
        const existing = state.permits.find((p) => p.id === permitId)
        if (!existing) return { success: false, message: 'Work permit not found.' }

        if (!canManagePermit(state.activeUser)) {
          return { success: false, message: 'Only Administrators have authority to delete work permits.' }
        }

        dispatch({ type: ACTION_TYPES.DELETE_PERMIT, payload: existing })
        logActivity('DELETE', 'PERMIT', existing.permitNo, `${state.activeUser?.name || 'Admin'} deleted work permit ${existing.permitNo}`)
        return { success: true, message: `Work permit ${existing.permitNo} deleted successfully.` }
      },

      importPermits: (batch) => {
        if (!canManagePermit(state.activeUser)) {
          return { success: false, message: 'You do not have permission to import permit documents.' }
        }

        const actor = state.activeUser || { id: '1', name: 'Operations Admin' }
        const rawBatch = Array.isArray(batch) && batch.length > 0 ? batch : [
          {
            pfNo: `PF/${new Date().getFullYear()}/03/IMP-01`,
            companyName: 'Vendor GENTRI',
            customerCode: 'CUST-GT-001',
            customerType: 'Enterprise',
            address: 'POP Gubeng Sby - Manhole 04',
            customerName: 'Bpk. Hendra Gunawan',
            telp: '081234567890',
            picOnsite: 'Alqori Dewantara',
            email: 'pic@gentri.co.id',
            am: 'Dian Permana',
            rfsDate: '2026-03-08',
            typeOfService: 'Dark Fiber Splicing',
            bandwidth: '10 Gbps',
            circuitId: 'CIR-SBY-GBG-001',
            interfaceType: '10G LC SFP+',
            equipment: 'Helm K3, Rompi Reflektor, Gas Detector, Tripod Rescue',
            terminationLocation1: 'POP Gubeng Sby - ODF 02',
            terminationLocation2: 'Manhole 04',
            ipBlock: '103.28.12.0/24',
            ipPtP1: '10.200.1.1/30',
            ipPtP2: '10.200.1.2/30',
            customerSignName: 'Bpk. Hendra Gunawan',
            customerSignDate: '2026-03-09',
            engineerSignName: actor.name,
            engineerSignDate: '2026-03-08',
            status: 'APPROVED'
          }
        ]

        const importList = rawBatch.map((p, idx) => ({
          id: p.id || (Date.now() + idx),
          permitNo: p.permitNo || p.pfNo || `SIK/${new Date().getFullYear()}/03/IMP-${String(idx + 1).padStart(2, '0')}`,
          pfNo: p.pfNo || p.permitNo || `PF-${new Date().getFullYear()}-${String(state.permits.length + idx + 1).padStart(4, '0')}`,
          typeOfOrder: p.typeOfOrder || 'New',
          otherOrderText: p.otherOrderText || '',
          companyName: p.companyName || p.company || p.vendor || '-',
          company: p.companyName || p.company || p.vendor || '-',
          customerCode: p.customerCode || '-',
          customerType: p.customerType || 'Enterprise',
          address: p.address || p.siteLocation || p.site || '-',
          site: p.address || p.site || p.siteLocation || '-',
          siteLocation: p.address || p.siteLocation || p.site || '-',
          customerName: p.customerName || p.applicantName || '-',
          applicantName: p.applicantName || p.customerName || actor.name,
          telp: p.telp || '-',
          picOnsite: p.picOnsite || '-',
          email: p.email || '-',
          am: p.am || '-',
          rfsDate: p.rfsDate || p.startDate || new Date().toISOString().slice(0, 10),
          startDate: p.startDate || p.rfsDate || new Date().toISOString().slice(0, 10),
          endDate: p.endDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          typeOfService: p.typeOfService || p.workType || 'Optical Fiber & Splicing',
          workType: p.typeOfService || p.workType || 'Optical Fiber & Splicing',
          bandwidth: p.bandwidth || '-',
          circuitId: p.circuitId || '-',
          interfaceType: p.interfaceType || '-',
          equipment: p.equipment || p.safety || p.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Boots',
          safety: p.equipment || p.safety || p.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Boots',
          jsaChecklist: p.equipment || p.safety || p.jsaChecklist || 'Safety Helmet, Reflective Vest, Safety Boots',
          terminationLocation1: p.terminationLocation1 || p.site || '-',
          terminationLocation2: p.terminationLocation2 || '-',
          testResults: p.testResults || [
            { pingTime: '2 ms', upload: '100 Mbps', download: '100 Mbps', destination: 'Gateway POP' },
            { pingTime: '', upload: '', download: '', destination: '' },
            { pingTime: '', upload: '', download: '', destination: '' }
          ],
          ipBlock: p.ipBlock || '-',
          ipPtP1: p.ipPtP1 || '-',
          ipPtP2: p.ipPtP2 || '-',
          customerSignName: p.customerSignName || p.customerName || '',
          customerSignDate: p.customerSignDate || p.endDate || '',
          engineerSignName: p.engineerSignName || actor.name || '',
          engineerSignDate: p.engineerSignDate || p.startDate || '',
          status: p.status || 'APPROVED',
          importedByAdmin: true,
          latitude: p.latitude || -7.2655,
          longitude: p.longitude || 112.7512,
          createdAt: new Date().toISOString(),
          createdBy: actor.id || actor.employeeId || '1',
          creatorName: actor.name || 'User',
          createdById: actor.id || actor.employeeId || '1',
          engineer: actor.name,
          personnel: actor.name,
          pic: actor.name
        }))

        dispatch({ type: ACTION_TYPES.IMPORT_PERMITS, payload: importList })
        logActivity('IMPORT', 'PERMIT', 'BATCH', `${actor.name} imported ${importList.length} permit files`)
        return { success: true, permits: importList, message: `${importList.length} permit files imported successfully.` }
      },

      // ==========================================
      // VEHICLE LOGS
      // ==========================================
      addVehicleLog: (logData) => {
        if (!canBorrowVehicle(state.activeUser)) {
          return { success: false, message: 'Your role does not have authorization to create vehicle dispatch records.' }
        }
        const actor = state.activeUser || { name: 'FOSIS Staff', role: 'Field Engineer' }
        const newLog = {
          id: `veh-${Date.now()}`,
          ...logData,
          borrowerUserId: logData.borrowerUserId || actor.id || actor.employeeId || null,
          borrowerUsername: logData.borrowerUsername || actor.username || '',
          borrowerName: logData.borrowerName || actor.name || logData.pic || '',
          statusArmada: normalizeVehicleStatus(logData.statusArmada || 'DIPINJAM')
        }
        dispatch({ type: ACTION_TYPES.ADD_VEHICLE_LOG, payload: newLog })
        logActivity('CREATE', 'VEHICLE', newLog.platKendaraan, `${actor.name} logged vehicle dispatch for ${newLog.platKendaraan}.`)
        return { success: true, log: newLog, message: 'Vehicle dispatch recorded successfully.' }
      },

      updateVehicleLog: (log) => {
        const existing = state.vehicleLogs.find((v) => v.id === log.id)
        if (!existing) return { success: false, message: 'Fleet vehicle log not found.' }

        // If editing general details (Edit action), check canEditVehicle
        if (log._actionType === 'EDIT') {
          if (!canEditVehicle(state.activeUser)) {
            return { success: false, message: 'Only Super Admin (Sanderlina Imelda) is authorized to edit vehicle records.' }
          }
        }

        const normalized = {
          ...log,
          statusArmada: normalizeVehicleStatus(log.statusArmada)
        }
        delete normalized._actionType
        dispatch({ type: ACTION_TYPES.UPDATE_VEHICLE_LOG, payload: normalized })
        logActivity('UPDATE', 'VEHICLE', normalized.platKendaraan, `Vehicle log ${normalized.platKendaraan} updated.`)
        return { success: true, message: 'Vehicle log updated successfully.' }
      },

      deleteVehicleLog: (log) => {
        if (!canDeleteVehicle(state.activeUser)) {
          return { success: false, message: 'Only Super Admin (Sanderlina Imelda) is authorized to delete vehicle records.' }
        }
        dispatch({ type: ACTION_TYPES.DELETE_VEHICLE_LOG, payload: log })
        logActivity('DELETE', 'VEHICLE', log.platKendaraan, `Vehicle log ${log.platKendaraan} deleted by ${state.activeUser?.name}.`)
        return { success: true, message: 'Vehicle record deleted successfully.' }
      },

      submitVehicleReturn: (logId, returnData) => {
        const item = state.vehicleLogs.find((v) => v.id === logId)
        if (!item) return { success: false, message: 'Fleet vehicle log not found.' }

        const actor = state.activeUser || { name: 'Staff' }
        const isOwn = isVehicleBorrower(actor, item)
        const isIC = canRecordVehicleReturnForTechnician(actor, item)

        if (!isOwn && !isIC) {
          return { success: false, message: 'You do not have authorization to submit return for this vehicle.' }
        }

        const updated = {
          ...item,
          ...returnData,
          recordedByIC: isIC && !isOwn ? actor.name : item.recordedByIC || null,
          recordedByICRole: isIC && !isOwn ? actor.role : item.recordedByICRole || null,
          statusArmada: 'MENUNGGU_ACC_KEMBALI',
          timeIn: returnData.timeIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          tanggalKembali: returnData.tanggalKembali || new Date().toLocaleDateString('en-US')
        }
        dispatch({ type: ACTION_TYPES.UPDATE_VEHICLE_LOG, payload: updated })
        logActivity('SUBMIT', 'VEHICLE', item.platKendaraan, `Vehicle return for ${item.platKendaraan} submitted by ${actor.name}.`)
        return { success: true, message: 'Vehicle return submitted, pending IC verification.' }
      },

      approveVehicleReturn: (logId, verificationNotes = '') => {
        const item = state.vehicleLogs.find((v) => v.id === logId)
        if (!item) return { success: false, message: 'Fleet vehicle log not found.' }

        if (!canVerifyVehicleReturn(state.activeUser, item)) {
          return { success: false, message: 'Only IC Service Operation, IC Service Maintenance, or Super Admin can verify vehicle returns.' }
        }

        const actor = state.activeUser || { name: 'IC Officer', role: 'IC' }
        const updated = {
          ...item,
          statusArmada: 'SELESAI',
          accBy: actor.name,
          accRole: actor.role,
          accTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          accNotes: verificationNotes || item.accNotes || 'Vehicle return verified and approved.'
        }
        dispatch({ type: ACTION_TYPES.UPDATE_VEHICLE_LOG, payload: updated })
        logActivity('APPROVE', 'VEHICLE', item.platKendaraan, `Vehicle return for ${item.platKendaraan} approved by ${actor.name}.`)
        return { success: true, message: `Vehicle return for ${item.platKendaraan} approved (Completed).` }
      },

      rejectVehicleReturn: (logId, reason = '') => {
        const item = state.vehicleLogs.find((v) => v.id === logId)
        if (!item) return { success: false, message: 'Fleet vehicle log not found.' }

        if (!canVerifyVehicleReturn(state.activeUser, item)) {
          return { success: false, message: 'Only IC or Super Admin can reject vehicle returns.' }
        }

        const actor = state.activeUser || { name: 'IC Officer', role: 'IC' }
        const updated = {
          ...item,
          statusArmada: 'PERLU_PERBAIKAN_KEMBALI',
          rejectionReason: reason || 'Data or physical return condition requires rectification.',
          rejectedBy: actor.name,
          rejectedRole: actor.role,
          rejectedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
        dispatch({ type: ACTION_TYPES.UPDATE_VEHICLE_LOG, payload: updated })
        logActivity('REJECT', 'VEHICLE', item.platKendaraan, `Vehicle return for ${item.platKendaraan} rejected by ${actor.name}: ${reason}`)
        return { success: true, message: `Vehicle return for ${item.platKendaraan} rejected; engineer requested to revise data.` }
      },

      ignoreVehicleReturn: (logId, reason = '') => {
        const item = state.vehicleLogs.find((v) => v.id === logId)
        if (!item) return { success: false, message: 'Fleet vehicle log not found.' }

        if (!canVerifyVehicleReturn(state.activeUser, item)) {
          return { success: false, message: 'Only IC or Super Admin can dismiss vehicle return verification.' }
        }

        const actor = state.activeUser || { name: 'IC Officer', role: 'IC' }
        const updated = {
          ...item,
          statusArmada: 'DIABAIKAN',
          ignoredBy: actor.name,
          ignoredRole: actor.role,
          ignoredTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          ignoredReason: reason || 'Verification dismissed pending further physical inspection.'
        }
        dispatch({ type: ACTION_TYPES.UPDATE_VEHICLE_LOG, payload: updated })
        logActivity('IGNORE', 'VEHICLE', item.platKendaraan, `Vehicle verification for ${item.platKendaraan} dismissed by ${actor.name}.`)
        return { success: true, message: `Vehicle return verification for ${item.platKendaraan} dismissed.` }
      },

      // ==========================================
      // CHAT WITH STORAGE PERSISTENCE
      // ==========================================
      sendChatMessage: (payload) => {
        const actor = state.activeUser || { id: 0, name: 'Field Staff', role: 'Field Engineer' }
        const newMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId: actor.id || 0,
          senderName: actor.name,
          senderRole: actor.role,
          senderEmail: actor.email || '',
          text: payload.text || payload.messageText || '',
          timestamp: Date.now(),
          type: (payload.type || payload.messageType || 'text').toLowerCase(),
          attachmentName: payload.attachmentName || '',
          attachmentSize: payload.attachmentSize || null,
          attachmentType: payload.attachmentType || '',
          latitude: payload.latitude || payload.locationLatitude,
          longitude: payload.longitude || payload.locationLongitude,
          locationAddress: payload.locationAddress || '',
          ticketId: payload.ticketId || null,
          attachedFormTitle: payload.attachedFormTitle || '',
          attachedFormType: payload.attachedFormType || '',
          attachedFormStatus: payload.attachedFormStatus || ''
        }
        dispatch({ type: ACTION_TYPES.SEND_CHAT_MESSAGE, payload: newMsg })
        return { success: true, message: 'Message sent successfully.' }
      },

      // ==========================================
      // USER MANAGEMENT & RBAC
      // ==========================================
      addUser: (name, role, teamName, phone, passwordPin) => {
        if (!canManageUsers(state.activeUser)) {
          return { success: false, message: 'Only Administrators have permission to add users.' }
        }

        const newUser = {
          id: Date.now(),
          employeeId: `EMP-${String(state.users.length + 1).padStart(3, '0')}`,
          name,
          role,
          region: teamName,
          email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@fosis-ops.id`,
          phone,
          initials: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST',
          passwordPin,
          canCreate: true,
          canEdit: true,
          canDelete: normalizeRole(role) === ROLES.ADMIN || normalizeRole(role) === ROLES.SUPER_ADMIN,
          isSuperAdmin: normalizeRole(role) === ROLES.SUPER_ADMIN,
          canImportPermit: normalizeRole(role) !== ROLES.TEKNISI,
          canExportPdf: normalizeRole(role) !== ROLES.TEKNISI
        }
        dispatch({ type: ACTION_TYPES.ADD_USER, payload: newUser })
        logActivity('CREATE', 'USER', newUser.email, `New staff ${newUser.name} (${newUser.role}) added.`)
        return { success: true, user: newUser, message: `Staff member ${newUser.name} added successfully.` }
      },

      updateUser: (user) => {
        if (!canManageUsers(state.activeUser) && state.activeUser?.id !== user.id) {
          return { success: false, message: 'You do not have authorization to modify other users data.' }
        }

        dispatch({ type: ACTION_TYPES.UPDATE_USER, payload: user })
        logActivity('UPDATE', 'USER', user.email, `Staff data ${user.name} updated.`)
        return { success: true, message: `Staff member ${user.name} updated.` }
      },

      deleteUser: (user) => {
        if (!canManageUsers(state.activeUser)) {
          return { success: false, message: 'Only Administrators have permission to remove staff.' }
        }

        dispatch({ type: ACTION_TYPES.DELETE_USER, payload: user })
        logActivity('DELETE', 'USER', user.email, `Staff member ${user.name} deleted.`)
        return { success: true, message: `Staff member ${user.name} has been deactivated.` }
      },

      // ==========================================
      // UTILS
      // ==========================================
      resetDemoData: () => {
        dispatch({ type: ACTION_TYPES.RESET_DEMO_DATA })
        logActivity('RESET', 'SYSTEM', 'ALL', 'Application data reset to demo defaults.')
        return { success: true, message: 'All operational data reset to initial state.' }
      }
    }),
    [state.tickets, state.permits, state.vehicleLogs, state.users, state.activeUser]
  )

  const value = {
    ...state,
    ...actions,
    permissions: {
      canCreateTicket: (ticket) => canCreateTicket(state.activeUser),
      canEditTicket: (ticket) => canEditTicket(state.activeUser, ticket),
      canDeleteTicket: (ticket) => canDeleteTicket(state.activeUser, ticket),
      canSubmitTicket: (ticket) => canSubmitTicket(state.activeUser, ticket),
      canVerifyTicket: (ticket) => canVerifyTicket(state.activeUser, ticket),
      canLockTicket: () => canLockTicket(state.activeUser),
      canUnlockTicket: () => canUnlockTicket(state.activeUser),
      canApproveTicket: () => canApproveTicket(state.activeUser),
      canRejectTicket: () => canRejectTicket(state.activeUser),
      canCommentTicket: () => canCommentTicket(state.activeUser),
      canManagePermit: () => canManagePermit(state.activeUser),
      canApproveRejectPermit: () => canApproveRejectPermit(state.activeUser),
      canManageUsers: () => canManageUsers(state.activeUser),
      canManageVehicle: () => canManageVehicle(state.activeUser),
      canBorrowVehicle: () => canBorrowVehicle(state.activeUser),
      canEditVehicle: () => canEditVehicle(state.activeUser),
      canDeleteVehicle: () => canDeleteVehicle(state.activeUser),
      canApproveVehicleReturn: () => canApproveVehicleReturn(state.activeUser),
      canVerifyVehicleReturn: (log) => canVerifyVehicleReturn(state.activeUser, log),
      canReturnOwnVehicle: (log) => canReturnOwnVehicle(state.activeUser, log),
      canRecordVehicleReturnForTechnician: (log) => canRecordVehicleReturnForTechnician(state.activeUser, log),
      canExportData: () => canExportData(state.activeUser),
      canShareTicketPdfToWA: (item) => canShareTicketPdfToWA(state.activeUser, item),
      canEditRecord: (item) => canEditRecord(state.activeUser, item),
      isRecordCreator: (item) => isRecordCreator(state.activeUser, item)
    }
  }

  return <FosisContext.Provider value={value}>{children}</FosisContext.Provider>
}

export function useFosis() {
  const context = useContext(FosisContext)
  if (!context) {
    throw new Error('useFosis must be used within a FosisProvider')
  }
  return context
}
