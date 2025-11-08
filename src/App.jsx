import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider, useSelector } from 'react-redux'
import { store } from './redux/store'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Dashboard from './pages/Dashboard'
import AttendancePage from './pages/AttendancePage'
import LeavePage from './pages/LeavePage'
import PayrollPage from './pages/PayrollPage'
import EmployeeDirectory from './pages/EmployeeDirectory'
import ReportsAnalytics from './pages/ReportsAnalytics'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import CustomCursor from './components/ui/CustomCursor'
import './index.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/" replace />
}

// App Routes
function AppRoutes() {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated)

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />}
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
      <ThemeProvider>
        <Router>
          <CustomCursor />
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </Provider>
  )
}

export default App
