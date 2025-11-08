import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Logo from '@/components/ui/Logo'
import { motion, AnimatePresence } from 'framer-motion'
import { logout } from '@/redux/slices/userSlice'

export default function PageHeader({ 
  searchTerm, 
  setSearchTerm, 
  showNewButton = false, 
  onNewClick,
  showCompanyLogo = true
}) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleProfileClick = () => {
    navigate('/dashboard/profile')
    setShowProfileMenu(false)
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-6 bg-card border rounded-lg h-16 px-4">
      {/* Left: Company Name & Logo (only if showCompanyLogo is true) */}
      {showCompanyLogo && (
        <div className="flex items-center">
          <Logo className="h-8 w-auto text-primary" />
        </div>
      )}

      {/* Center: NEW button */}
      {showNewButton && (
        <Button 
          onClick={onNewClick}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 font-semibold h-10"
        >
          NEW
        </Button>
      )}

      {/* Right: Search and Profile - aligned to the right edge */}
      <div className="flex items-center gap-3 ml-auto">
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

        {/* Blue square */}
        <button className="w-10 h-10 rounded bg-blue-600 hover:bg-blue-700 transition-colors"></button>
      </div>
    </div>
  )
}
