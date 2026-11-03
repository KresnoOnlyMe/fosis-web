// Storage keys
const STORAGE_PREFIX = 'fosis_web_ops_'

export const STORAGE_KEYS = {
  SESSION: `${STORAGE_PREFIX}session`,
  USERS: `${STORAGE_PREFIX}users`,
  TICKETS: `${STORAGE_PREFIX}tickets`,
  PERMITS: `${STORAGE_PREFIX}permits`,
  VEHICLE_LOGS: `${STORAGE_PREFIX}vehicle_logs`,
  CHAT_MESSAGES: `${STORAGE_PREFIX}chat_messages`,
  ACTIVITY_LOGS: `${STORAGE_PREFIX}activity_logs`,
  APP_SETTINGS: `${STORAGE_PREFIX}settings`
}

export const storageService = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (item === null || item === undefined) return defaultValue
      return JSON.parse(item)
    } catch (e) {
      console.warn(`[storageService] Error reading key "${key}":`, e)
      return defaultValue
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`[storageService] Error writing key "${key}":`, e)
      return false
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.warn(`[storageService] Error removing key "${key}":`, e)
      return false
    }
  },

  // Session specific handling (Remember Me -> localStorage, else -> sessionStorage)
  setSession(sessionData, rememberMe = true) {
    try {
      const raw = JSON.stringify(sessionData)
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.SESSION, raw)
        sessionStorage.removeItem(STORAGE_KEYS.SESSION)
      } else {
        sessionStorage.setItem(STORAGE_KEYS.SESSION, raw)
        localStorage.removeItem(STORAGE_KEYS.SESSION)
      }
      return true
    } catch (e) {
      console.warn('[storageService] Error setting session:', e)
      return false
    }
  },

  getSession() {
    try {
      const inSession = sessionStorage.getItem(STORAGE_KEYS.SESSION)
      if (inSession) return JSON.parse(inSession)

      const inLocal = localStorage.getItem(STORAGE_KEYS.SESSION)
      if (inLocal) return JSON.parse(inLocal)

      return null
    } catch (e) {
      console.warn('[storageService] Error getting session:', e)
      return null
    }
  },

  removeSession() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION)
      localStorage.removeItem(STORAGE_KEYS.SESSION)
      return true
    } catch (e) {
      console.warn('[storageService] Error removing session:', e)
      return false
    }
  },

  clearAllFosisData() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => {
        localStorage.removeItem(k)
        sessionStorage.removeItem(k)
      })
      return true
    } catch (e) {
      console.warn('[storageService] Error clearing all data:', e)
      return false
    }
  }
}
