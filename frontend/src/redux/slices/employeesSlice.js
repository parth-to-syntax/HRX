import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  list: [],
}

export const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.list = action.payload
    },
    addEmployee: (state, action) => {
      state.list.push(action.payload)
    },
    updateEmployee: (state, action) => {
      const index = state.list.findIndex(e => e.id === action.payload.id)
      if (index >= 0) {
        state.list[index] = { ...state.list[index], ...action.payload }
      }
    },
    removeEmployee: (state, action) => {
      state.list = state.list.filter(e => e.id !== action.payload)
    },
  },
})

export const { setEmployees, addEmployee, updateEmployee, removeEmployee } = employeesSlice.actions
export default employeesSlice.reducer
