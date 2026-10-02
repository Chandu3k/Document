import { defaultPreferences } from './preferencesSlice'

const KEY = 'keepsafe:prefs:v1'

// Used as the store's starting state, so preferences and read alerts survive a refresh
export function loadPersistedState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return undefined
    const saved = JSON.parse(raw)
    const state = {}
    if (saved.preferences && typeof saved.preferences === 'object') {
      state.preferences = { ...defaultPreferences, ...saved.preferences }
    }
    if (Array.isArray(saved.notifications?.readIds)) {
      state.notifications = { readIds: saved.notifications.readIds }
    }
    return state
  } catch {
    return undefined
  }
}

export function savePersistedState(state) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ preferences: state.preferences, notifications: state.notifications })
    )
  } catch {
    // storage full or blocked: the app still works, it just won't remember
  }
}