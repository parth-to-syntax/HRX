import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { meApi, logoutApi } from '@/api/auth'
import { getMyProfile } from '@/api/employees'

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  restoring: true, // true until we attempt session restore once
  theme: 'light',
}

// Restore session from httpOnly cookie via /auth/me
export const restoreSession = createAsyncThunk('user/restoreSession', async (_, { rejectWithValue }) => {
  try {
    const me = await meApi()
    const role = (me.user?.role || '').toLowerCase()
    
    // Try to fetch employee profile (may not exist for admin/HR without profile)
    let profile = null
    try {
      profile = await getMyProfile()
    } catch (e) {
      if (e.status !== 404) {
        // Unexpected failure — rethrow to surface error
        throw e
      }
      // 404 means no employee profile — acceptable for admin/HR
      profile = null
    }
    
    // Map same shape as LoginPage for consistency
    const userData = {
      id: profile?.id || me.user?.id,
      name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (me.user?.login_id || 'User'),
      email: profile?.email || '',
      role,
      login_id: me.user?.login_id,
      company_id: me.user?.company_id,
      date_of_joining: profile?.date_of_joining || null,
      avatar_url: profile?.avatar_url || null,
      location: profile?.location || null,
      has_employee: !!profile,
    }
    return userData
  } catch (e) {
    return rejectWithValue(e?.message || 'unauthenticated')
  }
})

// Call backend logout then clear client state
export const performLogout = createAsyncThunk('user/performLogout', async () => {
  try { await logoutApi() } catch (_) { /* ignore */ }
})

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.currentUser = action.payload
      state.isAuthenticated = true
      state.restoring = false
    },
    logout: (state) => {
      state.currentUser = null
      state.isAuthenticated = false
      state.restoring = false
    },
    updateProfile: (state, action) => {
      state.currentUser = { ...state.currentUser, ...action.payload }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.currentUser = action.payload
        state.isAuthenticated = true
        state.restoring = false
      })
      .addCase(restoreSession.rejected, (state) => {
        state.currentUser = null
        state.isAuthenticated = false
        state.restoring = false
      })
      .addCase(performLogout.fulfilled, (state) => {
        state.currentUser = null
        state.isAuthenticated = false
        state.restoring = false
      })
  },
})

export const { login, logout, updateProfile, toggleTheme } = userSlice.actions
export default userSlice.reducer
