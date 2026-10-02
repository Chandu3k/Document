import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../api'

export function createCollection(name) {
  const fetchAll = createAsyncThunk(`${name}/fetchAll`, () => api[name].list())
  const addItem = createAsyncThunk(`${name}/add`, (item) => api[name].create(item))
  const updateItem = createAsyncThunk(`${name}/update`, ({ id, changes }) =>
    api[name].update(id, changes)
  )
  const removeItem = createAsyncThunk(`${name}/remove`, (id) => api[name].remove(id))

  const slice = createSlice({
    name,
    initialState: { items: [], status: 'idle', error: null },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => {
          state.status = 'loading'
          state.error = null
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state.status = 'succeeded'
          state.items = action.payload
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.status = 'failed'
          state.error = action.error.message
        })
        .addCase(addItem.fulfilled, (state, action) => {
          state.items.unshift(action.payload)
        })
        .addCase(updateItem.fulfilled, (state, action) => {
          const index = state.items.findIndex((x) => x.id === action.payload.id)
          if (index !== -1) state.items[index] = action.payload
        })
        .addCase(removeItem.fulfilled, (state, action) => {
          state.items = state.items.filter((x) => x.id !== action.payload)
        })
    },
  })

  return { reducer: slice.reducer, fetchAll, addItem, updateItem, removeItem }
}