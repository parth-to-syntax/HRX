import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  records: [],
  todayStatus: null,
}

export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setRecords: (state, action) => {
      state.records = action.payload
    },
    addRecord: (state, action) => {
      state.records.unshift(action.payload)
    },
    markAttendance: (state, action) => {
      state.todayStatus = action.payload
      const today = new Date().toISOString().split('T')[0]
      const existingIndex = state.records.findIndex(r => r.date === today)
      
      if (existingIndex >= 0) {
        state.records[existingIndex] = { ...state.records[existingIndex], ...action.payload }
      } else {
        state.records.unshift({ ...action.payload, date: today })
      }
    },
  },
})

export const { setRecords, addRecord, markAttendance } = attendanceSlice.actions
export default attendanceSlice.reducer
