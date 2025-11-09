import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import { getMyAttendance } from '@/api/attendance'

// More defensive status resolution:
// - If employeeId missing, still show 'weekend' on Sat/Sun else 'not-checked-in'.
// - Leave takes precedence, then attendance, then weekend, then absent.
// - Gracefully handles slices not yet hydrated (undefined arrays).
// - Fetches real-time attendance data from API for accurate status
export const useEmployeeStatus = (employeeId) => {
  const attendanceSlice = useSelector((state) => state.attendance)
  const leaveSlice = useSelector((state) => state.leave)
  const currentUser = useSelector((state) => state.user?.currentUser)
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

  // Check if we have fresh attendance data from API (most reliable source)
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

  // Check if current user has backend attendance status (from getMyAttendance API)
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

  // Leave spanning today (case-insensitive check for 'approved')
  const onLeave = requests.some(req => {
    if (req.employeeId !== employeeId) return false
    const statusLower = (req.status || '').toLowerCase()
    if (statusLower !== 'approved') return false
    const start = new Date(req.startDate)
    const end = new Date(req.endDate)
    return start <= todayDate && end >= todayDate
  })
  if (onLeave) return 'on-leave'

  // Attendance from Redux
  const todayAttendance = records.find(rec => rec.employeeId === employeeId && rec.date === today)
  if (todayAttendance?.checkIn && todayAttendance?.checkOut) return 'checked-out'
  if (todayAttendance?.checkIn) return 'checked-in'

  // Weekend holiday fallback
  if (isWeekend) return 'weekend'
  return 'not-checked-in'
}
