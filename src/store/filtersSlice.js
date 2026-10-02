import { createSlice } from '@reduxjs/toolkit'

export const defaultFilters = {
  search: '',
  category: 'all',
  status: 'all', // all (hides archived), active, expired, paused, cancelled, archived
  expiry: 'any', // any, expired, 7, 30, 90, none
  cycle: 'all', // all, monthly, quarterly, yearly (subscriptions only)
  type: 'all', // all, document, subscription
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState: defaultFilters,
  reducers: {
    setSearch(state, { payload }) {
      state.search = payload
    },
    setFilter(state, { payload }) {
      state[payload.key] = payload.value
    },
    resetFilters() {
      return defaultFilters
    },
  },
})

export const { setSearch, setFilter, resetFilters } = filtersSlice.actions
export default filtersSlice.reducer