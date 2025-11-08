import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  roles: [],
  leavePolicies: [],
  payrollSettings: {},
  holidays: [],
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setRoles: (state, action) => {
      state.roles = action.payload
    },
    setLeavePolicies: (state, action) => {
      state.leavePolicies = action.payload
    },
    setPayrollSettings: (state, action) => {
      state.payrollSettings = action.payload
    },
    setHolidays: (state, action) => {
      state.holidays = action.payload
    },
    updateConfig: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
})

export const { setRoles, setLeavePolicies, setPayrollSettings, setHolidays, updateConfig } = settingsSlice.actions
export default settingsSlice.reducer
