import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { ChevronLeft, ChevronRight, Clock, Calendar, Scan } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/layout/PageHeader'
import FaceCheckInModal from '@/components/modals/FaceCheckInModal'
import { checkIn, checkOut, getMyAttendance, listAttendanceByDate, markAbsents } from '@/api/attendance'
import { getMyEnrollment } from '@/api/face'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const { currentUser } = useSelector((state) => state.user)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState([])
  const [todayStatus, setTodayStatus] = useState(null)
  const [summary, setSummary] = useState({ present_days: 0, leave_days: 0, total_working_days: 0 })
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFaceCheckIn, setShowFaceCheckIn] = useState(false)
  const [faceEnrollment, setFaceEnrollment] = useState(null)
  const datePickerRef = useRef(null)

  // Debug: Track showFaceCheckIn state changes
  useEffect(() => {
    console.log('showFaceCheckIn state changed to:', showFaceCheckIn);
  }, [showFaceCheckIn]);

  const isEmployee = currentUser?.role?.toLowerCase() === 'employee'
  const isAdminOrHR = ['admin', 'hr'].includes(currentUser?.role?.toLowerCase())

  // Get current month name
  const currentMonth = selectedDate.toLocaleString('en-US', { month: 'short' })

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch attendance data when date changes
  useEffect(() => {
    loadAttendance()
  }, [selectedDate, currentUser])

  // Load face enrollment status
  useEffect(() => {
    loadFaceEnrollment()
  }, [currentUser])

  const loadFaceEnrollment = async () => {
    try {
      const result = await getMyEnrollment()
      if (result.enrolled) {
        setFaceEnrollment(result.enrollment)
      }
    } catch (error) {
      console.error('Error loading face enrollment:', error)
    }
  }

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0]
      
      if (isEmployee) {
        // For employees: fetch their own attendance
        const today = new Date().toISOString().split('T')[0]
        
        // Get first and last day of selected month for summary stats
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0]
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0]
        
        // Fetch month summary for stats
        const monthResult = await getMyAttendance({ from: firstDayOfMonth, to: lastDayOfMonth })
        setSummary(monthResult.summary || { present_days: 0, leave_days: 0, total_working_days: 0 })
        
        // Fetch SELECTED date's attendance for both table AND check-in/out buttons
        const selectedDateResult = await getMyAttendance({ from: selectedDateStr, to: selectedDateStr })
        console.log('Selected date result from API:', selectedDateResult)
        const selectedDateRecord = selectedDateResult.days?.[0]
        console.log('Selected date attendance record:', selectedDateRecord)
        
        // Set both the table data and button status from the same query
        setAttendanceData(selectedDateResult.days || [])
        setTodayStatus(selectedDateRecord || null)
      } else if (isAdminOrHR) {
        // For admin/hr: fetch all employees' attendance for selected date
        const result = await listAttendanceByDate({ date: selectedDateStr, page: 1, pageSize: 100 })
        setAttendanceData(result.items || [])
        
        // Calculate summary
        const present = result.items.filter(r => r.status === 'present').length
        const leave = result.items.filter(r => r.status === 'leave').length
        setSummary({ 
          present_days: present, 
          leave_days: leave, 
          total_working_days: present + leave 
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  // Handle check-in
  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      const result = await checkIn(selectedDateStr)
      console.log('Check-in result:', result)
      toast.success('Checked in successfully')
      setTodayStatus(result)
      loadAttendance()
    } catch (err) {
      console.error('Check-in error:', err)
      toast.error(err.response?.data?.error || 'Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  // Handle check-out
  const handleCheckOut = async () => {
    setCheckingOut(true)
    try {
      const result = await checkOut(selectedDateStr)
      console.log('Check-out result:', result)
      toast.success('Checked out successfully')
      setTodayStatus(result)
      loadAttendance()
    } catch (err) {
      console.error('Check-out error:', err)
      toast.error(err.response?.data?.error || 'Failed to check out')
    } finally {
      setCheckingOut(false)
    }
  }

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Format date for display
  const formatDate = (date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()
    return `${day},${month} ${year}`
  }

  // Navigate date
  const handlePrevDate = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDate = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleDateSelect = (dateString) => {
    setSelectedDate(new Date(dateString))
    setShowDatePicker(false)
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Check if selected date is a weekday (Mon-Fri)
  const selectedDayOfWeek = selectedDate.getDay()
  const isWeekday = selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5
  
  // Check if employee has approved leave for selected date
  const hasLeave = todayStatus?.status === 'leave'
  
  // Can check in/out for any weekday (past, present, or future), but NOT if on approved leave
  const canCheckIn = isWeekday && !todayStatus?.check_in && !hasLeave
  const canCheckOut = isWeekday && todayStatus?.check_in && !todayStatus?.check_out && !hasLeave

  console.log('Button states:', {
    selectedDateStr,
    todayStr,
    selectedDayOfWeek,
    isWeekday,
    hasLeave,
    todayStatus,
    canCheckIn,
    canCheckOut
  })

  // Filter data for admin view
  const filteredData = isEmployee ? attendanceData : attendanceData.filter(emp => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  // Employee View - New Design
  if (isEmployee) {
    return (
      <>
        <PageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showNewButton={false}
        />

        <div className="p-8">
          {/* Check In/Out Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mark Attendance - {formatDate(selectedDate)}</CardTitle>
              {!isWeekday && (
                <p className="text-sm text-muted-foreground text-red-500 mt-2">
                  ⚠️ Weekends (Saturday/Sunday) are not working days
                </p>
              )}
              {hasLeave && isWeekday && (
                <p className="text-sm text-blue-600 mt-2">
                  ℹ️ You have approved leave for this date
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <Button 
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || checkingIn}
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  {checkingIn ? 'Checking In...' : 'Check In'}
                </Button>

                {/* Face Check-In Button (only show if enrolled) */}
                {faceEnrollment && isEmployee && (
                  <Button
                    onClick={() => {
                      console.log('Face Check-In button clicked!');
                      console.log('faceEnrollment:', faceEnrollment);
                      console.log('selectedDate:', selectedDate);
                      console.log('BEFORE setShowFaceCheckIn - current value:', showFaceCheckIn);
                      setShowFaceCheckIn(true);
                      console.log('AFTER setShowFaceCheckIn called');
                      setTimeout(() => {
                        console.log('1 second later - showFaceCheckIn value:', showFaceCheckIn);
                      }, 1000);
                    }}
                    disabled={!canCheckIn || checkingIn}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Scan size={18} />
                    Face Check-In
                  </Button>
                )}
                
                <Button 
                  onClick={handleCheckOut}
                  disabled={!canCheckOut || checkingOut}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </Button>
                
                {todayStatus && isWeekday && (
                  <div className="ml-auto text-sm">
                    {hasLeave ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm">On Leave</Badge>
                      </div>
                    ) : (
                      <>
                        {todayStatus.check_in && (
                          <p>Check-in: <span className="font-semibold">{formatTime(todayStatus.check_in)}</span></p>
                        )}
                        {todayStatus.check_out && (
                          <p>Check-out: <span className="font-semibold">{formatTime(todayStatus.check_out)}</span></p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-0">
              {/* Top Controls */}
              <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDate}
                  className="h-10 w-16"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDate}
                  className="h-10 w-16"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="relative" ref={datePickerRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 font-medium"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {currentMonth} ∨
                  </Button>

                  {showDatePicker && (
                    <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
                      <input
                        type="date"
                        value={selectedDateStr}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex gap-4">
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Count of days present</p>
                    <p className="text-lg font-semibold">{summary.present_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Leaves count</p>
                    <p className="text-lg font-semibold">{summary.leave_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Total working days</p>
                    <p className="text-lg font-semibold">{summary.total_working_days}</p>
                  </div>
                </div>
              </div>

              {/* Date Display */}
              <div className="p-4 bg-background">
                <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-sm">Date</th>
                      <th className="text-left p-4 font-semibold text-sm">Status</th>
                      <th className="text-left p-4 font-semibold text-sm">Check In</th>
                      <th className="text-left p-4 font-semibold text-sm">Check Out</th>
                      <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
                      <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((record, idx) => (
                        <tr key={record.attendance_id || idx} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm">
                            {selectedDateStr}
                          </td>
                          <td className="p-4 text-sm">
                            <Badge variant={
                              record.status === 'present' ? 'success' : 
                              record.status === 'leave' ? 'default' : 
                              'destructive'
                            }>
                              {record.status === 'present' ? 'Present' : 
                               record.status === 'leave' ? 'On Leave' : 
                               'Absent'}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm">{record.status === 'leave' ? '-' : formatTime(record.check_in)}</td>
                          <td className="p-4 text-sm">{record.status === 'leave' ? '-' : formatTime(record.check_out)}</td>
                          <td className="p-4 text-sm">{record.status === 'leave' ? '-' : (record.work_hours ? Number(record.work_hours).toFixed(2) : '-')}</td>
                          <td className="p-4 text-sm">{record.status === 'leave' ? '-' : (record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Face Check-In Modal */}
        <FaceCheckInModal
          isOpen={showFaceCheckIn}
          onClose={() => setShowFaceCheckIn(false)}
          onCheckInSuccess={(attendance) => {
            setTodayStatus(attendance);
            loadAttendance();
            setShowFaceCheckIn(false);
          }}
          enrolledFaceUrl={faceEnrollment?.face_photo_url}
          selectedDate={selectedDate}
        />
      </>
    )
  }

  // Admin/Manager View - Traditional Design
  return (
    <>
      <PageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={false}
      />
      <div className="p-8">
        <Card className="border-2">
          <CardContent className="p-0">
            {/* Top Controls */}
            <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevDate}
                className="h-10 w-16"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDate}
                className="h-10 w-16"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="relative" ref={datePickerRef}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 font-medium"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {currentMonth} ∨
                </Button>

                {showDatePicker && (
                  <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
                    <input
                      type="date"
                      value={selectedDateStr}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="ml-4 flex gap-4">
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Count of days present</p>
                  <p className="text-lg font-semibold">{summary.present_days}</p>
                </div>
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Leaves count</p>
                  <p className="text-lg font-semibold">{summary.leave_days}</p>
                </div>
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Total working days</p>
                  <p className="text-lg font-semibold">{summary.total_working_days}</p>
                </div>
              </div>
            </div>

            {/* Date Display */}
            <div className="p-4 bg-background">
              <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-sm">Employee</th>
                    <th className="text-left p-4 font-semibold text-sm">Check In</th>
                    <th className="text-left p-4 font-semibold text-sm">Check Out</th>
                    <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
                    <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((record) => (
                      <tr key={record.employee_id} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm font-medium">
                          {`${record.first_name || ''} ${record.last_name || ''}`.trim() || '[Employee]'}
                        </td>
                        <td className="p-4 text-sm">{formatTime(record.check_in)}</td>
                        <td className="p-4 text-sm">{formatTime(record.check_out)}</td>
                        <td className="p-4 text-sm">{record.work_hours ? Number(record.work_hours).toFixed(2) : '-'}</td>
                        <td className="p-4 text-sm">{record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00'}</td>
                        <td className="p-4 text-sm">
                          <Badge variant={record.status === 'present' ? 'success' : record.status === 'leave' ? 'default' : 'destructive'}>
                            {record.status || 'Absent'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Face Check-In Modal */}
      {(() => {
        console.log('=== MODAL RENDER CHECK ===', {
          showFaceCheckIn,
          type: typeof showFaceCheckIn,
          strictEqual: showFaceCheckIn === true
        });
        return null;
      })()}
      
      {showFaceCheckIn === true && (
        <FaceCheckInModal
          isOpen={true}
          onClose={() => {
            console.log('Modal close clicked');
            setShowFaceCheckIn(false);
          }}
          onCheckInSuccess={(attendance) => {
            console.log('Check-in success callback');
            setTodayStatus(attendance);
            loadAttendance();
            setShowFaceCheckIn(false);
          }}
          enrolledFaceUrl={faceEnrollment?.face_photo_url}
          selectedDate={selectedDate}
        />
      )}
    </>
  )
}
