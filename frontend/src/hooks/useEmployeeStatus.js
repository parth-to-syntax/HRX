import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { getMyAttendance } from '@/api/attendance'

// More defensive status resolution:
// - PRIORITY 1: Redux employeeStatusMap (real-time updates from check-in/check-out)
// - PRIORITY 2: API fetch for today's attendance (most reliable source)
// - PRIORITY 3: Backend attendance_status from currentUser
// - PRIORITY 4: Redux attendance records
// - PRIORITY 5: Leave requests
// - If employeeId missing, still show 'weekend' on Sat/Sun else 'not-checked-in'.
// - Leave takes precedence, then attendance, then weekend, then absent.
// - Gracefully handles slices not yet hydrated (undefined arrays).
export const useEmployeeStatus = (employeeId) => {
  const attendanceSlice = useSelector((state) => state.attendance)
  const leaveSlice = useSelector((state) => state.leave)
  const currentUser = useSelector((state) => state.user?.currentUser)
  const employeeStatusMap = useSelector((state) => state.attendance?.employeeStatusMap || {})
  const records = Array.isArray(attendanceSlice?.records) ? attendanceSlice.records : []
  const requests = Array.isArray(leaveSlice?.requests) ? leaveSlice.requests : []
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState(null)

  const todayDate = new Date()
  const today = todayDate.toISOString().split('T')[0]
  const day = todayDate.getDay() // 0 Sun, 6 Sat
  const isWeekend = day === 0 || day === 6

  // Fetch today's attendance status from API for accurate data
  useEffect(() => {
    if (!employeeId || !currentUser) return
    
    const fetchTodayStatus = async () => {
      try {
        const result = await getMyAttendance({ from: today, to: today })
        const todayRecord = result.days?.[0]
        if (todayRecord) {
          setTodayAttendanceStatus(todayRecord)
        }
      } catch (err) {
        console.error('Failed to fetch today attendance status:', err)
      }
    }

    fetchTodayStatus()
  }, [employeeId, currentUser, today])

  // If we don't have an employeeId yet (e.g., admin without profile), still surface weekend/absent.
  if (!employeeId) {
    return isWeekend ? 'weekend' : 'not-checked-in'
  }

  // PRIORITY 1: Check Redux employeeStatusMap for real-time status updates
  const reduxStatus = employeeStatusMap[employeeId]
  console.log(`useEmployeeStatus for ${employeeId}:`, { 
    reduxStatus, 
    today, 
    hasMatch: reduxStatus && reduxStatus.date === today,
    allStatusMap: employeeStatusMap 
  })
  
  if (reduxStatus && reduxStatus.date === today) {
    console.log(`Using Redux status for ${employeeId}:`, reduxStatus.status)
    if (reduxStatus.status === 'leave') return 'on-leave'
    if (reduxStatus.status === 'present') {
      // Check if checked in and out
      if (reduxStatus.check_in && reduxStatus.check_out) return 'checked-out'
      if (reduxStatus.check_in) return 'checked-in'
    }
  }

  // PRIORITY 2: Check if we have fresh attendance data from API (most reliable source)
  if (todayAttendanceStatus) {
    const status = todayAttendanceStatus.status
    if (status === 'leave') return 'on-leave'
    if (status === 'present') {
      // Check if checked in and out
      if (todayAttendanceStatus.check_in && todayAttendanceStatus.check_out) return 'checked-out'
      if (todayAttendanceStatus.check_in) return 'checked-in'
    }
    if (status === 'absent') {
      return isWeekend ? 'weekend' : 'not-checked-in'
    }
  }

  // PRIORITY 3: Check if current user has backend attendance status (from getMyAttendance API)
  // This is more reliable than Redux state for leave status
  if (currentUser?.attendance_status) {
    const status = currentUser.attendance_status
    if (status === 'leave') return 'on-leave'
    if (status === 'present') return 'checked-in'
    if (status === 'absent') {
      // If weekend, show as holiday instead of absent
      return isWeekend ? 'weekend' : 'not-checked-in'
    }
  }

  // PRIORITY 4: Leave spanning today (case-insensitive check for 'approved')
  const onLeave = requests.some(req => {
    if (req.employeeId !== employeeId) return false
    const statusLower = (req.status || '').toLowerCase()
    if (statusLower !== 'approved') return false
    const start = new Date(req.startDate)
    const end = new Date(req.endDate)
    return start <= todayDate && end >= todayDate
  })
  if (onLeave) return 'on-leave'

  // PRIORITY 5: Attendance from Redux
  const todayAttendance = records.find(rec => rec.employeeId === employeeId && rec.date === today)
  if (todayAttendance?.checkIn && todayAttendance?.checkOut) return 'checked-out'
  if (todayAttendance?.checkIn) return 'checked-in'

  // Weekend holiday fallback
  if (isWeekend) return 'weekend'
  return 'not-checked-in'
}
