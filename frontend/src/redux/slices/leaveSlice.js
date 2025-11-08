import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  requests: [],
  balance: {
    annual: 15,
    sick: 10,
    casual: 5,
  },
}

export const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    setRequests: (state, action) => {
      state.requests = action.payload
    },
    addRequest: (state, action) => {
      state.requests.unshift(action.payload)
    },
    updateStatus: (state, action) => {
      const { id, status } = action.payload
      const request = state.requests.find(r => r.id === id)
      if (request) {
        request.status = status
      }
    },
    setBalance: (state, action) => {
      state.balance = action.payload
    },
  },
})

export const { setRequests, addRequest, updateStatus, setBalance } = leaveSlice.actions
export default leaveSlice.reducer
