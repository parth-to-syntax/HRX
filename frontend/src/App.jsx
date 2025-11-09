import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Provider, useSelector, useDispatch } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './redux/store'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/AttendancePage'
import AttendanceSimplePage from './pages/AttendanceSimplePage'
import LeavePage from './pages/LeavePage'
import PayrollPage from './pages/PayrollPage'
import EmployeeDirectory from './pages/EmployeeDirectory'
import ReportsAnalytics from './pages/ReportsAnalytics'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { restoreSession, performLogout } from './redux/slices/userSlice'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, restoring } = useSelector((state) => state.user)
  if (restoring) return <div className="p-6 text-sm">Restoring session...</div>
  return isAuthenticated ? children : <Navigate to="/" replace />
}

// App Routes
function AppRoutes() {
  const dispatch = useDispatch()
  const { isAuthenticated, restoring } = useSelector((state) => state.user)
  const navigate = useNavigate()
  // kick off restore only once at mount
  React.useEffect(() => { dispatch(restoreSession()) }, [dispatch])
  // Global 401 handler via custom event from axios interceptor
  React.useEffect(() => {
    const onExpired = async () => {
      await dispatch(performLogout())
      navigate('/', { replace: true })
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [dispatch, navigate])

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (restoring ? <div className="p-6 text-sm">Restoring session...</div> : <LoginPage />)}
      />
      
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (restoring ? <div className="p-6 text-sm">Restoring session...</div> : <SignupPage />)}
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/employees" replace />} />
        <Route path="employees" element={<EmployeeDirectory />} />
  <Route path="attendance" element={<AttendancePage />} />
  <Route path="attendance-simple" element={<AttendanceSimplePage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div className="p-6 text-sm">Loading...</div>} persistor={persistor}>
        <ThemeProvider>
          <Router>
            <Toaster position="top-right" toastOptions={{ duration: 300 }} />
            <AppRoutes />
          </Router>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
}

export default App
