import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Logo from '@/components/ui/Logo'
import { InteractiveCard } from '@/components/ui/interactive-card'

const menuItems = [
  { path: '/dashboard/employees', icon: Users, label: 'Employees', roles: ['Employee', 'HR Officer', 'Payroll Officer', 'Admin'] },
  { path: '/dashboard/attendance', icon: Clock, label: 'Attendance', roles: ['Employee', 'HR Officer', 'Admin'] },
  { path: '/dashboard/leave', icon: Calendar, label: 'Time Off', roles: ['Employee', 'HR Officer', 'Admin'] },
  { path: '/dashboard/payroll', icon: DollarSign, label: 'Payroll', roles: ['Employee', 'Payroll Officer', 'Admin'] },
  { path: '/dashboard/reports', icon: FileText, label: 'Reports', roles: ['HR Officer', 'Payroll Officer', 'Admin'] },
  { path: '/dashboard/settings', icon: Settings, label: 'Settings', roles: ['Admin'] },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const currentUser = useSelector((state) => state.user.currentUser)
  const userRole = currentUser?.user?.role || currentUser?.role || 'employee'

  const allowedItems = menuItems.filter(item => 
    item.roles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())
  )

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 256 : 80,
          x: 0,
        }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r z-50 lg:z-30 transition-all duration-300",
          !isOpen && "lg:w-20"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-4 border-b bg-card">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <Logo className="h-10 w-auto text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="logo-mini"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Logo className="h-8 w-auto text-primary" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button beside logo */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {allowedItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              if (isActive) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 bg-primary text-primary-foreground shadow-md"
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                )
              }
              
              return (
                <InteractiveCard
                  key={item.path}
                  enableTilt={false}
                  enableParticles={true}
                  enableMagnetism={false}
                  clickEffect={true}
                  particleCount={4}
                  glowColor="13, 148, 136"
                >
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 hover:bg-accent text-muted-foreground hover:text-foreground"
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </InteractiveCard>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className={cn(
              "flex items-center gap-3",
              !isOpen && "justify-center"
            )}>
              <img
                src={currentUser?.avatar_url || currentUser?.avatar || 'https://ui-avatars.com/api/?name=User'}
                alt="User"
                className="w-8 h-8 rounded-full"
              />
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium truncate">
                      {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name}` : currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate capitalize">
                      {currentUser?.user?.role || currentUser?.role || 'Employee'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
