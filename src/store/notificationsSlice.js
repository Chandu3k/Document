import { createSlice } from '@reduxjs/toolkit'

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { readIds: [] },
  reducers: {
    markRead(state, { payload }) {
      if (!state.readIds.includes(payload)) state.readIds.push(payload)
    },
    markAllRead(state, { payload }) {
      payload.forEach((id) => {
        if (!state.readIds.includes(id)) state.readIds.push(id)
      })
    },
    resetNotifications(state) {
      state.readIds = []
    },
  },
})

export const { markRead, markAllRead, resetNotifications } = notificationsSlice.actions
export default notificationsSlice.reducer