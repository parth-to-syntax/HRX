import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  payslips: [],
}

export const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setPayslips: (state, action) => {
      state.payslips = action.payload
    },
    addPayslip: (state, action) => {
      state.payslips.unshift(action.payload)
    },
  },
})

export const { setPayslips, addPayslip } = payrollSlice.actions
export default payrollSlice.reducer
