import { createSlice } from '@reduxjs/toolkit'
import { todayISO } from '../utils/dates'

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: { selectedDate: todayISO() },
  reducers: {
    setSelectedDate(state, { payload }) {
      state.selectedDate = payload
    },
  },
})

export const { setSelectedDate } = calendarSlice.actions
export default calendarSlice.reducer