import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InteractiveCard } from '@/components/ui/interactive-card'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import NewEmployeeModal from '@/components/modals/NewEmployeeModal'
import { markAttendance } from '@/redux/slices/attendanceSlice'
import { setEmployees } from '@/redux/slices/employeesSlice'
import { listEmployees as listEmployeesApi } from '@/api/employees'
import { listAttendanceByDate } from '@/api/attendance'
import toast from 'react-hot-toast'

export default function EmployeeDirectory() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const { list: employees } = useSelector((state) => state.employees)
  const { records } = useSelector((state) => state.attendance)
  const { requests } = useSelector((state) => state.leave)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showAttendanceModal, setShowAttendanceModal] = useState(null)
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const isHROrAdmin = ['HR Officer', 'Admin'].includes(currentUser?.user?.role || currentUser?.role)
  const today = new Date().toISOString().split('T')[0]

  // Fetch employees (with backend attendance enrichment for admin/hr) on load
  useEffect(() => {
    let mounted = true
    async function loadAll() {
      setLoading(true)
      try {
        const pageSize = 100
        let page = 1
        const all = []
        // paginate until all fetched
        // prevent excessive loops with a hard cap
        for (let i = 0; i < 50; i++) {
          const data = await listEmployeesApi({ page, pageSize })
          all.push(...(data.items || []))
          if (!data.total || all.length >= data.total || (data.items || []).length === 0) break
          page += 1
        }
        // Backend attendance overlay (admin/hr only)
        let attendanceMap = new Map()
        const roleLower = (currentUser?.role || '').toLowerCase()
        if (['admin','hr'].includes(roleLower)) {
          try {
            const resp = await listAttendanceByDate({ date: today })
            attendanceMap = new Map(resp.items.map(r => [r.employee_id, r]))
          } catch (_) {
            // silent fallback
          }
        }
        const enriched = all.map(e => {
          const att = attendanceMap.get(e.id)
          return {
            ...e,
            // dynamic role: infer from joined data? For now attach nothing if not provided
            attendance: att || null,
            attendance_status: att?.status || null,
          }
        })
        if (mounted) dispatch(setEmployees(enriched))
      } catch (err) {
        if (mounted) {
          toast.error(err.message || 'Failed to load employees')
          dispatch(setEmployees([]))
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAll()
    return () => { mounted = false }
  }, [dispatch, currentUser, today])

  // Get employee status
  const getEmployeeStatus = (employeeId) => {
    // Check if employee is on approved leave today
    const onLeave = requests.some(req => 
      req.employeeId === employeeId && 
      req.status === 'Approved' &&
      new Date(req.startDate) <= new Date(today) &&
      new Date(req.endDate) >= new Date(today)
    )
    
    if (onLeave) return 'on-leave'

    // Check attendance for today
    const todayAttendance = records.find(rec => 
      rec.employeeId === employeeId && 
      rec.date === today
    )

    if (todayAttendance?.checkIn && todayAttendance?.checkOut) {
      return 'checked-out' // Red - completed day, show hours
    } else if (todayAttendance?.checkIn) {
      return 'checked-in' // Green - currently present
    } else {
      return 'not-checked-in' // Red - not yet checked in
    }
  }

  const calculateHoursWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null
    
    const [inHour, inMin] = checkIn.split(':').map(Number)
    const [outHour, outMin] = checkOut.split(':').map(Number)
    
    const inMinutes = inHour * 60 + inMin
    const outMinutes = outHour * 60 + outMin
    
    const totalMinutes = outMinutes - inMinutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours}h ${minutes}m`
  }

  const getEmployeeAttendance = (employeeId) => {
    return records.find(rec => 
      rec.employeeId === employeeId && 
      rec.date === today
    )
  }

  const handleStatusClick = (e, employee) => {
    e.stopPropagation()
    const status = getEmployeeStatus(employee.id)
    
    if (status === 'on-leave' || status === 'checked-out') {
      return // Can't check in/out when on leave or already checked out
    }
    
    setShowAttendanceModal(employee)
  }

  const handleCheckIn = () => {
    if (!showAttendanceModal) return
    
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    
    dispatch(markAttendance({
      id: `ATT${Date.now()}`,
      employeeId: showAttendanceModal.id,
      employeeName: `${showAttendanceModal.first_name} ${showAttendanceModal.last_name}`,
      date: today,
      checkIn: time,
      status: 'Present',
    }))
    
    setShowAttendanceModal(null)
  }

  const handleCheckOut = () => {
    if (!showAttendanceModal) return
    
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    
    const todayAttendance = records.find(rec => 
      rec.employeeId === showAttendanceModal.id && 
      rec.date === today
    )
    
    if (todayAttendance) {
      dispatch(markAttendance({
        ...todayAttendance,
        checkOut: time,
      }))
    }
    
    setShowAttendanceModal(null)
  }

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) ||
           emp.email.toLowerCase().includes(searchLower) ||
           emp.department?.name?.toLowerCase().includes(searchLower) ||
           emp.position?.toLowerCase().includes(searchLower)
  })

  // Get current user's status
  const currentUserStatus = currentUser?.id ? getEmployeeStatus(currentUser.id) : null

  const handleCurrentUserStatusClick = () => {
    if (currentUser && currentUserStatus !== 'on-leave') {
      setShowAttendanceModal(currentUser)
    }
  }

  return (
    <>
      {/* Page Header - Full width, no padding */}
      <PageHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNewButton={isHROrAdmin}
        onNewClick={() => setShowNewEmployeeModal(true)}
        userStatus={currentUserStatus}
        onStatusClick={handleCurrentUserStatusClick}
      />

      <div className="p-6 space-y-6">
        {loading && employees.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">Loading employees…</div>
        )}
        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee, index) => (
          <InteractiveCard
            key={employee.id}
            enableTilt={true}
            enableParticles={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={6}
            glowColor="13, 148, 136"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEmployee(employee)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Employee Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={employee.avatar_url || `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=0d9488&color=fff`}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="w-16 h-16 rounded border-2 border-primary/20"
                      />
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.position || employee.user_role || 'Employee'}
                      </p>
                      {/* Status Text and Hours */}
                      <div className="mt-1">
                        {(() => {
                          const backendStatus = employee.attendance_status
                          const attendance = employee.attendance || getEmployeeAttendance(employee.id)
                          const status = backendStatus || getEmployeeStatus(employee.id)
                          
                          if (status === 'leave' || status === 'on-leave') {
                            return (
                              <span className="text-xs font-medium text-purple-600">
                                On Leave
                              </span>
                            )
                          } else if ((status === 'checked-out' || status === 'absent')) {
                            let hours = null
                            if (employee.attendance && employee.attendance.work_hours != null) {
                              hours = `${employee.attendance.work_hours}h`
                            } else if (attendance?.checkIn && attendance?.checkOut) {
                              hours = calculateHoursWorked(attendance.checkIn, attendance.checkOut)
                            }
                            return (
                              <span className="text-xs font-medium text-red-600">
                                Absent{hours ? ` • ${hours}` : ''}
                              </span>
                            )
                          } else if (status === 'present' || status === 'checked-in') {
                            return (
                              <span className="text-xs font-medium text-green-600">
                                Present
                              </span>
                            )
                          } else {
                            return (
                              <span className="text-xs font-medium text-red-600">
                                Absent
                              </span>
                            )
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </InteractiveCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      )}
      </div>

      {/* Employee Details Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedEmployee(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Employee Details</h2>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={selectedEmployee.avatar_url || `https://ui-avatars.com/api/?name=${selectedEmployee.first_name}+${selectedEmployee.last_name}&background=0d9488&color=fff`}
                      alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                      className="w-20 h-20 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </h3>
                      <p className="text-muted-foreground">{selectedEmployee.position}</p>
                    </div>
                  </div>

                  {/* Private Information Section */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Private Information</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Date of Birth</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.dob || ''}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Account Number</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.bank_account || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Residing Address</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.address || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Bank Name</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.bank_name || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Nationality</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.nationality || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">IFSC Code</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.ifsc_code || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Personal Email</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.email || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">PAN No</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.pan_no || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Gender</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.gender || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">UAN NO</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.uan_no || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Marital Status</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.marital_status || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Emp Code</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">{selectedEmployee.user?.login_id || ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="text-sm text-muted-foreground min-w-[140px]">Date of Joining</label>
                        <div className="flex-1 border-b border-muted-foreground/30 pb-1">
                          <span className="text-sm">
                            {selectedEmployee.date_of_joining ? new Date(selectedEmployee.date_of_joining).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Check-in/Check-out Modal */}
      <AnimatePresence>
        {showAttendanceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowAttendanceModal(null)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Attendance</h2>
                    <button
                      onClick={() => setShowAttendanceModal(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {showAttendanceModal.first_name} {showAttendanceModal.last_name}
                    </p>
                    <p className="text-2xl font-bold">
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  {(() => {
                    const status = getEmployeeStatus(showAttendanceModal.id)
                    const todayAttendance = records.find(rec => 
                      rec.employeeId === showAttendanceModal.id && 
                      rec.date === today
                    )

                    return (
                      <div className="space-y-3">
                        {todayAttendance?.checkIn && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-green-700">Check-in</span>
                            <span className="text-sm text-green-600">{todayAttendance.checkIn}</span>
                          </div>
                        )}
                        
                        {todayAttendance?.checkOut && (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-blue-700">Check-out</span>
                            <span className="text-sm text-blue-600">{todayAttendance.checkOut}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {!todayAttendance?.checkIn ? (
                            <Button 
                              onClick={handleCheckIn}
                              className="flex-1 bg-teal-600 hover:bg-teal-700"
                            >
                              Check In
                            </Button>
                          ) : !todayAttendance?.checkOut ? (
                            <Button 
                              onClick={handleCheckOut}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              Check Out
                            </Button>
                          ) : (
                            <div className="flex-1 text-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm text-gray-600">Day completed</span>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAttendanceModal(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* New Employee Modal */}
      <NewEmployeeModal 
        isOpen={showNewEmployeeModal}
        onClose={() => setShowNewEmployeeModal(false)}
      />
    </>
  )
}
