import { storageService, STORAGE_KEYS } from './storageService.js'
import { users as defaultUsers } from '../data/mockData.js'

export const authService = {
  /**
   * Validates employeeId / email / username and user-specific password.
   * Compares strictly against user's own credentials.
   * Stores session in localStorage if rememberMe is true, else sessionStorage.
   */
  async login(identifier, password, rememberMe = true) {
    if (!identifier || !password) {
      throw new Error('Username or PIN is incorrect.')
    }

    const cleanId = String(identifier).trim().toLowerCase()
    const cleanPw = String(password).trim()

    // Get latest users list from persistence or mockData
    const currentUsers = storageService.get(STORAGE_KEYS.USERS, defaultUsers)

    // Match by username (primary) or employeeId / email as backward-compatible fallback
    const user = currentUsers.find((u) => {
      const usernameVal = String(u.username || '').toLowerCase()
      const emailVal = String(u.email || '').toLowerCase()
      const employeeIdVal = String(u.employeeId || '').toLowerCase()

      // Primary check: exact username match, or sanderlina.imelda alias for user sanderlina
      const usernameMatch =
        usernameVal === cleanId ||
        (cleanId === 'sanderlina.imelda' && (usernameVal === 'sanderlina' || usernameVal === 'sanderlina.imelda')) ||
        (cleanId === 'sanderlina' && (usernameVal === 'sanderlina' || usernameVal === 'sanderlina.imelda'))

      const employeeIdMatch = employeeIdVal === cleanId
      const emailMatch = emailVal === cleanId

      return usernameMatch || employeeIdMatch || emailMatch
    })

    if (!user) {
      throw new Error('Username or PIN is incorrect.')
    }

    // Check account status
    if (user.status && user.status.toLowerCase() === 'inactive') {
      throw new Error('Your account has been deactivated by the Administrator. Please contact Operational Admin.')
    }

    // Strict password verification: checks ONLY the target user's passwordPin or password
    const expectedPassword = user.passwordPin || user.password
    const isValid = expectedPassword && String(expectedPassword).trim() === cleanPw

    if (!isValid) {
      throw new Error('Username or PIN is incorrect.')
    }

    // Check specifically if authenticated user is Sanderlina Imelda
    const isSanderlina =
      cleanId === 'sanderlina.imelda' ||
      cleanId === 'sanderlina' ||
      String(user.username || '').toLowerCase() === 'sanderlina.imelda' ||
      String(user.username || '').toLowerCase() === 'sanderlina' ||
      String(user.name || '').toLowerCase() === 'sanderlina imelda' ||
      user.employeeId === 'EMP-001' ||
      user.id === 1

    const finalRole = isSanderlina ? 'Super Admin' : user.role
    const finalUsername = isSanderlina ? 'sanderlina.imelda' : (user.username || user.name.toLowerCase().replace(/\s+/g, '.'))
    const isSuperAdminFlag = isSanderlina ? true : (user.isSuperAdmin === true || String(user.role || '').toLowerCase().includes('super admin'))
    const canDeleteFlag = isSanderlina ? true : (user.canDelete === true)

    // Heal local storage user record if stale
    if (isSanderlina && (user.role !== 'Super Admin' || user.username !== 'sanderlina.imelda')) {
      user.role = 'Super Admin'
      user.username = 'sanderlina.imelda'
      user.isSuperAdmin = true
      user.canDelete = true
      storageService.set(STORAGE_KEYS.USERS, currentUsers)
    }

    // Session payload (no sensitive credentials/passwords stored)
    const session = {
      user: {
        userId: user.id,
        id: user.id,
        employeeId: user.employeeId || `EMP-00${user.id}`,
        username: finalUsername,
        name: user.name,
        email: user.email,
        role: finalRole,
        region: user.region || finalRole,
        phone: user.phone,
        initials: user.initials || user.name.slice(0, 2).toUpperCase(),
        canCreate: user.canCreate !== false,
        canEdit: user.canEdit !== false,
        canDelete: canDeleteFlag,
        isSuperAdmin: isSuperAdminFlag,
        canImportPermit: user.canImportPermit !== false,
        canExportPdf: user.canExportPdf !== false
      },
      token: `fosis_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginAt: new Date().toISOString(),
      rememberMe: Boolean(rememberMe)
    }

    // Persist session to localStorage or sessionStorage based on rememberMe flag
    storageService.setSession(session, rememberMe)

    return session.user
  },

  logout() {
    storageService.removeSession()
  },

  getSession() {
    const session = storageService.getSession()
    if (!session || !session.user) return null
    const u = session.user
    const isSanderlina =
      String(u.username || '').toLowerCase() === 'sanderlina.imelda' ||
      String(u.username || '').toLowerCase() === 'sanderlina' ||
      String(u.name || '').toLowerCase() === 'sanderlina imelda' ||
      u.employeeId === 'EMP-001' ||
      u.id === 1

    if (isSanderlina) {
      u.role = 'Super Admin'
      u.isSuperAdmin = true
      u.username = 'sanderlina.imelda'
      u.canDelete = true
    }
    return u
  },

  restoreSession() {
    return this.getSession()
  }
}
