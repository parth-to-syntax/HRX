import { useSelector } from 'react-redux'

export const useEmployeeStatus = (employeeId) => {
  const { records } = useSelector((state) => state.attendance)
  const { requests } = useSelector((state) => state.leave)
  
  const today = new Date().toISOString().split('T')[0]

  if (!employeeId) return null

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
