import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import attendanceReducer from './slices/attendanceSlice'
import leaveReducer from './slices/leaveSlice'
import payrollReducer from './slices/payrollSlice'
import employeesReducer from './slices/employeesSlice'
import settingsReducer from './slices/settingsSlice'

export const store = configureStore({
  reducer: {
    user: userReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
    payroll: payrollReducer,
    employees: employeesReducer,
    settings: settingsReducer,
  },
})
