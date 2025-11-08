import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  theme: 'light',
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
    },
    logout: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
    },
    updateProfile: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
  },
})

export const { login, logout, updateProfile, toggleTheme } = userSlice.actions
export default userSlice.reducer
