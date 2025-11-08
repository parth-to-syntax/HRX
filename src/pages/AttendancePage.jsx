import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markAttendance } from '@/redux/slices/attendanceSlice'
import PageHeader from '@/components/layout/PageHeader'

export default function AttendancePage() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const employees = useSelector((state) => state.employees.list)
  const attendanceRecords = useSelector((state) => state.attendance.records)
  const todayStatus = useSelector((state) => state.attendance.todayStatus)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')

  const isEmployee = currentUser?.role === 'Employee'

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

  // Get formatted date string for comparison
  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const todayStr = new Date().toISOString().split('T')[0]

  // Calculate work hours
  const calculateHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-'
    const [inHours, inMins] = checkIn.split(':').map(Number)
    const [outHours, outMins] = checkOut.split(':').map(Number)
    const totalMins = (outHours * 60 + outMins) - (inHours * 60 + inMins)
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  // Handle attendance marking
  const handleMarkAttendance = (type) => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    
    const today = todayStr
    const existingRecord = attendanceRecords.find(
      r => r.employeeId === currentUser.id && r.date === today
    )

    // Validate check-out time is greater than check-in time
    if (type === 'out' && existingRecord?.checkIn) {
      const [checkInHour, checkInMin] = existingRecord.checkIn.split(':').map(Number)
      const [checkOutHour, checkOutMin] = time.split(':').map(Number)
      
      const checkInMinutes = checkInHour * 60 + checkInMin
      const checkOutMinutes = checkOutHour * 60 + checkOutMin
      
      if (checkOutMinutes <= checkInMinutes) {
        alert('Check-out time must be greater than check-in time!')
        return
      }
    }

    const record = {
      id: existingRecord?.id || `ATT${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: `${currentUser.first_name} ${currentUser.last_name}`,
      date: today,
      checkIn: type === 'in' ? time : existingRecord?.checkIn,
      checkOut: type === 'out' ? time : existingRecord?.checkOut,
      status: 'Present',
    }

    dispatch(markAttendance(record))
  }

  const canCheckIn = !todayStatus?.checkIn
  const canCheckOut = todayStatus?.checkIn && !todayStatus?.checkOut

  // Get attendance data for selected date
  const getAttendanceData = () => {
    if (isEmployee) {
      // For employees, show their own records
      return attendanceRecords
        .filter(r => r.employeeId === currentUser.id && r.date === selectedDateStr)
        .map(record => {
          const workHours = calculateHours(record.checkIn, record.checkOut)
          const standardHours = 9 * 60
          const actualMins = record.checkIn && record.checkOut 
            ? (() => {
                const [inHours, inMins] = record.checkIn.split(':').map(Number)
                const [outHours, outMins] = record.checkOut.split(':').map(Number)
                return (outHours * 60 + outMins) - (inHours * 60 + inMins)
              })()
            : 0
          
          const extraMins = Math.max(0, actualMins - standardHours)
          const extraHours = extraMins > 0 
            ? `${String(Math.floor(extraMins / 60)).padStart(2, '0')}:${String(extraMins % 60).padStart(2, '0')}`
            : '00:00'

          return {
            id: record.id,
            date: record.date,
            checkIn: record.checkIn || '-',
            checkOut: record.checkOut || '-',
            workHours: workHours,
            extraHours: extraHours
          }
        })
    } else {
      // For admins/managers, show all employees
      return employees.map((emp) => {
        const record = attendanceRecords.find(
          r => r.employeeId === emp.id && r.date === selectedDateStr
        )
        
        const workHours = calculateHours(record?.checkIn, record?.checkOut)
        const standardHours = 9 * 60
        const actualMins = record?.checkIn && record?.checkOut 
          ? (() => {
              const [inHours, inMins] = record.checkIn.split(':').map(Number)
              const [outHours, outMins] = record.checkOut.split(':').map(Number)
              return (outHours * 60 + outMins) - (inHours * 60 + inMins)
            })()
          : 0
        
        const extraMins = Math.max(0, actualMins - standardHours)
        const extraHours = extraMins > 0 
          ? `${String(Math.floor(extraMins / 60)).padStart(2, '0')}:${String(extraMins % 60).padStart(2, '0')}`
          : '00:00'

        return {
          id: emp.id,
          name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '[Employee]',
          date: selectedDateStr,
          checkIn: record?.checkIn || '-',
          checkOut: record?.checkOut || '-',
          workHours: workHours,
          extraHours: extraHours,
          status: record?.status || 'Absent'
        }
      }).filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
  }

  const attendanceData = getAttendanceData()

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
              <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <Button 
                  onClick={() => handleMarkAttendance('in')}
                  disabled={!canCheckIn}
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  Check In
                </Button>
                <Button 
                  onClick={() => handleMarkAttendance('out')}
                  disabled={!canCheckOut}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  Check Out
                </Button>
                
                {todayStatus && (
                  <div className="ml-auto text-sm">
                    {todayStatus.checkIn && (
                      <p>Check-in: <span className="font-semibold">{todayStatus.checkIn}</span></p>
                    )}
                    {todayStatus.checkOut && (
                      <p>Check-out: <span className="font-semibold">{todayStatus.checkOut}</span></p>
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

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 font-medium"
                >
                  Oct ∨
                </Button>

                <div className="ml-4 flex gap-4">
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Count of days present</p>
                    <p className="text-lg font-semibold">
                      {attendanceRecords.filter(r => r.employeeId === currentUser.id && r.status === 'Present').length}
                    </p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Leaves count</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Total working days</p>
                    <p className="text-lg font-semibold">
                      {attendanceRecords.filter(r => r.employeeId === currentUser.id).length}
                    </p>
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
                      <th className="text-left p-4 font-semibold text-sm">Check In</th>
                      <th className="text-left p-4 font-semibold text-sm">Check Out</th>
                      <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
                      <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground">
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      attendanceData.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm">
                            {new Date(record.date).toLocaleDateString('en-GB')}
                          </td>
                          <td className="p-4 text-sm">{record.checkIn}</td>
                          <td className="p-4 text-sm">{record.checkOut}</td>
                          <td className="p-4 text-sm">{record.workHours}</td>
                          <td className="p-4 text-sm">{record.extraHours}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
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

              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 font-medium"
              >
                Oct ∨
              </Button>

              <div className="ml-4 flex gap-4">
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Count of days present</p>
                  <p className="text-lg font-semibold">
                    {attendanceRecords.filter(r => r.status === 'Present').length}
                  </p>
                </div>
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Leaves count</p>
                  <p className="text-lg font-semibold">0</p>
                </div>
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Total working days</p>
                  <p className="text-lg font-semibold">{attendanceRecords.length}</p>
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
                  {attendanceData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    attendanceData.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm font-medium">{record.name}</td>
                        <td className="p-4 text-sm">{record.checkIn}</td>
                        <td className="p-4 text-sm">{record.checkOut}</td>
                        <td className="p-4 text-sm">{record.workHours}</td>
                        <td className="p-4 text-sm">{record.extraHours}</td>
                        <td className="p-4 text-sm">
                          <Badge variant={record.status === 'Present' ? 'success' : 'destructive'}>
                            {record.status}
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
    </>
  )
}
