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
  // Employees should be visible to everyone
  { path: '/dashboard/employees', icon: Users, label: 'Employees', roles: ['Employee', 'HR Officer', 'Payroll Officer', 'Admin'] },
  // Attendance for employees and HR/Admin
  { path: '/dashboard/attendance', icon: Clock, label: 'Attendance', roles: ['Employee', 'HR Officer', 'Admin'] },
  // Time Off visible to Employee, HR, Payroll, Admin (HR/Admin approve all; others see only their own)
  { path: '/dashboard/leave', icon: Calendar, label: 'Time Off', roles: ['Employee', 'HR Officer', 'Payroll Officer', 'Admin'] },
  // Payroll visible to all roles, but views are role-scoped in the page (Admin/Payroll see everyone; HR/Employee see their own)
  { path: '/dashboard/payroll', icon: DollarSign, label: 'Payroll', roles: ['Employee', 'HR Officer', 'Payroll Officer', 'Admin'] },
  // Reports accessible only to HR, Payroll and Admin
  { path: '/dashboard/reports', icon: FileText, label: 'Reports', roles: ['HR Officer', 'Payroll Officer', 'Admin'] },
  // Settings only Admin
  { path: '/dashboard/settings', icon: Settings, label: 'Settings', roles: ['Admin'] },
]

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation()
  const currentUser = useSelector((state) => state.user.currentUser)
  
  // Get user role and normalize it
  const userRole = currentUser?.user?.role || currentUser?.role || 'Employee'
  
  // Debug: Log the user role to console
  console.log('Current User Role:', userRole)
  console.log('Current User Object:', currentUser)

  const allowedItems = menuItems.filter(item => {
    // Case-insensitive role matching
    const itemRolesLower = item.roles.map(r => r.toLowerCase().trim())
    const userRoleLower = (userRole || '').toLowerCase().trim()
    const isAllowed = itemRolesLower.includes(userRoleLower)
    
    console.log(`Checking ${item.label}: user=${userRoleLower}, allowed=${itemRolesLower}, match=${isAllowed}`)
    
    return isAllowed
  })

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
        }}
        className={cn(
          "h-screen bg-card border-r z-50 lg:z-30 transition-all duration-300 flex-shrink-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="h-16 flex items-center border-b bg-card relative px-2">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="logo-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center pr-8"
                >
                  <Logo className="h-10 w-auto text-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="logo-mini"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center"
                >
                  <Logo className="h-8 w-auto text-primary" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button - positioned absolutely */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "absolute p-1 rounded-lg hover:bg-accent transition-colors flex-shrink-0",
                isOpen ? "right-2" : "right-1"
              )}
            >
              {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
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
        </div>
      </motion.aside>
    </>
  )
}
