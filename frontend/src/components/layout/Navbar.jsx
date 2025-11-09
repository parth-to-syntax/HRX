import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Search, Bell, Moon, Sun, User, Settings, LogOut } from 'lucide-react'
import UserStatusBadge from '@/components/ui/UserStatusBadge'
import UserAvatar from '@/components/ui/UserAvatar'
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus'
import { toggleTheme, performLogout } from '@/redux/slices/userSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Navbar({ onMenuClick }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, theme } = useSelector((state) => state.user)
  const employeeId = currentUser?.id
  const status = useEmployeeStatus(employeeId)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = async () => {
    await dispatch(performLogout())
    navigate('/')
  }

  const handleThemeToggle = () => {
    dispatch(toggleTheme())
    document.documentElement.classList.toggle('dark')
  }

  // Generate breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumb = pathSegments.map(segment => 
    segment.charAt(0).toUpperCase() + segment.slice(1)
  ).join(' / ')

  return (
    <header className="h-16 border-b bg-card sticky top-0 z-20">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu size={20} />
          </Button>

          {/* Breadcrumb */}
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">Pages / {breadcrumb}</p>
            <h1 className="text-lg font-semibold">{pathSegments[pathSegments.length - 1] || 'Dashboard'}</h1>
          </div>

          {/* Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-md ml-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-full"
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                ></div>
                <div className="absolute right-0 top-12 w-80 bg-card border rounded-lg shadow-lg z-50 p-4">
                  <h3 className="font-semibold mb-3">Notifications</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-accent/50 rounded-lg text-sm">
                      <p className="font-medium">Leave Request Approved</p>
                      <p className="text-muted-foreground text-xs mt-1">Your leave request has been approved</p>
                    </div>
                    <div className="p-3 bg-accent/50 rounded-lg text-sm">
                      <p className="font-medium">New Payslip Available</p>
                      <p className="text-muted-foreground text-xs mt-1">October 2025 payslip is ready</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Status Badge */}
          <UserStatusBadge status={status} />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <UserAvatar 
                user={currentUser} 
                size="sm"
              />
              <span className="hidden sm:block text-sm font-medium">{currentUser?.name}</span>
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 top-12 w-56 bg-card border rounded-lg shadow-lg z-50 py-2">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowProfileMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  {currentUser?.role === 'Admin' && (
                    <button
                      onClick={() => {
                        navigate('/dashboard/settings')
                        setShowProfileMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                  )}
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
