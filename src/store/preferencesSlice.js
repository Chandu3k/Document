import { createSlice } from '@reduxjs/toolkit'

export const defaultPreferences = {
  theme: 'system', // light, dark or system
  reminderLeadDays: 30,
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: defaultPreferences,
  reducers: {
    setPreference(state, { payload }) {
      Object.assign(state, payload)
    },
  },
})

export const { setPreference } = preferencesSlice.actions
export default preferencesSlice.reducer