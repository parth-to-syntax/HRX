import { useSelector } from 'react-redux'

// More defensive status resolution:
// - If employeeId missing, still show 'weekend' on Sat/Sun else 'not-checked-in'.
// - Leave takes precedence, then attendance, then weekend, then absent.
// - Gracefully handles slices not yet hydrated (undefined arrays).
export const useEmployeeStatus = (employeeId) => {
  const attendanceSlice = useSelector((state) => state.attendance)
  const leaveSlice = useSelector((state) => state.leave)
  const records = Array.isArray(attendanceSlice?.records) ? attendanceSlice.records : []
  const requests = Array.isArray(leaveSlice?.requests) ? leaveSlice.requests : []

  const todayDate = new Date()
  const today = todayDate.toISOString().split('T')[0]
  const day = todayDate.getDay() // 0 Sun, 6 Sat
  const isWeekend = day === 0 || day === 6

  // If we don't have an employeeId yet (e.g., admin without profile), still surface weekend/absent.
  if (!employeeId) {
    return isWeekend ? 'weekend' : 'not-checked-in'
  }

  // Leave spanning today
  const onLeave = requests.some(req => {
    if (req.employeeId !== employeeId) return false
    if (req.status !== 'Approved') return false
    const start = new Date(req.startDate)
    const end = new Date(req.endDate)
    return start <= todayDate && end >= todayDate
  })
  if (onLeave) return 'on-leave'

  // Attendance
  const todayAttendance = records.find(rec => rec.employeeId === employeeId && rec.date === today)
  if (todayAttendance?.checkIn && todayAttendance?.checkOut) return 'checked-out'
  if (todayAttendance?.checkIn) return 'checked-in'

  // Weekend holiday fallback
  if (isWeekend) return 'weekend'
  return 'not-checked-in'
}
