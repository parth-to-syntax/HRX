import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, User as UserIcon, Plane, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '@/redux/slices/userSlice'
import { useTheme } from '@/contexts/ThemeContext'

export default function PageHeader({ 
  searchTerm, 
  setSearchTerm, 
  showNewButton = false, 
  onNewClick,
  showCompanyLogo = false,
  userStatus = null,
  onStatusClick = null
}) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { isDarkMode, toggleTheme } = useTheme()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleProfileClick = () => {
    navigate('/dashboard/profile')
    setShowProfileMenu(false)
  }

  // Get user name for display
  const userName = currentUser?.first_name 
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.name || 'User'

  return (
    <div className="flex items-center justify-between gap-4 bg-card border-b h-16 px-4">
      {/* Left: User Name */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold">{userName}</h2>
        <p className="text-xs text-muted-foreground capitalize">
          {currentUser?.user?.role || currentUser?.role || 'Employee'}
        </p>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* Center: NEW button */}
        {showNewButton && (
          <Button 
            onClick={onNewClick}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 font-semibold h-10"
          >
            NEW
          </Button>
        )}

        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50 h-10"
          />
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? (
            <Sun className="text-foreground" size={20} />
          ) : (
            <Moon className="text-foreground" size={20} />
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 transition-colors flex items-center justify-center"
          >
            <UserIcon className="text-white" size={20} />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <UserIcon size={18} />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2 border-t"
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Status Indicator */}
        {userStatus && (
          <button 
            onClick={onStatusClick}
            disabled={userStatus === 'on-leave'}
            className={`flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border transition-all ${
              userStatus === 'on-leave' 
                ? 'cursor-not-allowed opacity-60' 
                : 'hover:bg-muted/50 hover:scale-105 cursor-pointer'
            }`}
          >
            {userStatus === 'on-leave' ? (
              <>
                <Plane className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">On Leave</span>
              </>
            ) : userStatus === 'checked-in' || userStatus === 'checked-out' ? (
              <>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Present</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Absent</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
