import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import attendanceReducer from './slices/attendanceSlice'
import leaveReducer from './slices/leaveSlice'
import payrollReducer from './slices/payrollSlice'
import employeesReducer from './slices/employeesSlice'
import settingsReducer from './slices/settingsSlice'

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // Only persist user slice
}

const rootReducer = combineReducers({
  user: userReducer,
  attendance: attendanceReducer,
  leave: leaveReducer,
  payroll: payrollReducer,
  employees: employeesReducer,
  settings: settingsReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)
