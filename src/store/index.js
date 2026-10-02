import { configureStore } from '@reduxjs/toolkit'
import preferences from './preferencesSlice'
import documents from './documentsSlice'
import subscriptions from './subscriptionsSlice'
import reminders from './remindersSlice'
import categories from './categoriesSlice'
import filters from './filtersSlice'
import calendar from './calendarSlice'
import notifications from './notificationsSlice'
import { loadPersistedState, savePersistedState } from './persist'

export const store = configureStore({
  reducer: {
    preferences,
    documents,
    subscriptions,
    reminders,
    categories,
    filters,
    calendar,
    notifications,
  },
  preloadedState: loadPersistedState(),
})

// Save preferences and read alerts, but only when one of them actually changed
let last = null
store.subscribe(() => {
  const { preferences, notifications } = store.getState()
  if (last && last.preferences === preferences && last.notifications === notifications) return
  last = { preferences, notifications }
  savePersistedState({ preferences, notifications })
})