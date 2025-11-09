import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  records: [],
  todayStatus: null,
  // Real-time employee status map: { employeeId: { status, checkIn, checkOut, workHours } }
  employeeStatusMap: {},
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
    
    // NEW: Update employee status in real-time
    updateEmployeeStatus: (state, action) => {
      const { employeeId, status, check_in, check_out, work_hours, date, lastUpdated } = action.payload
      const today = new Date().toISOString().split('T')[0]
      
      // Only update if it's for today
      if (!date || date === today) {
        state.employeeStatusMap[employeeId] = {
          status,
          check_in,
          check_out,
          work_hours,
          date: date || today,
          lastUpdated: lastUpdated || new Date().toISOString(),
        }
        console.log('Redux state updated for employee:', employeeId, state.employeeStatusMap[employeeId])
      }
    },
    
    // NEW: Batch update employee statuses (for initial load)
    setEmployeeStatuses: (state, action) => {
      state.employeeStatusMap = action.payload
    },
    
    // NEW: Clear an employee's status
    clearEmployeeStatus: (state, action) => {
      const employeeId = action.payload
      delete state.employeeStatusMap[employeeId]
    },
    
    // NEW: Clear all statuses (e.g., on date change)
    clearAllStatuses: (state) => {
      state.employeeStatusMap = {}
    },
  },
})

export const { 
  setRecords, 
  addRecord, 
  markAttendance,
  updateEmployeeStatus,
  setEmployeeStatuses,
  clearEmployeeStatus,
  clearAllStatuses,
} = attendanceSlice.actions

export default attendanceSlice.reducer
