import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Clock, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { markAttendance } from '@/redux/slices/attendanceSlice'
import PageHeader from '@/components/layout/PageHeader'

export default function AttendancePage() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const { records, todayStatus } = useSelector((state) => state.attendance)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchTerm, setSearchTerm] = useState('')

  const userRecords = currentUser?.role === 'Employee' 
    ? records.filter(r => r.employeeId === currentUser.id)
    : records

  const filteredRecords = userRecords.filter(r => r.date.startsWith(selectedMonth))

  const handleMarkAttendance = (type) => {
    const now = new Date()
    const time = now.toTimeString().slice(0, 5)
    
    dispatch(markAttendance({
      id: `ATT${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: now.toISOString().split('T')[0],
      [type === 'in' ? 'checkIn' : 'checkOut']: time,
      status: 'Present',
    }))
  }

  const canCheckIn = !todayStatus?.checkIn
  const canCheckOut = todayStatus?.checkIn && !todayStatus?.checkOut

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNewButton={false}
        showCompanyLogo={false}
      />

      {/* Quick Actions */}
      {currentUser?.role === 'Employee' && (
        <Card>
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
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} />
              <label className="text-sm font-medium">Select Month:</label>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            {currentUser?.role !== 'Employee' && (
              <Button variant="outline" className="ml-auto">
                Export Records
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                {currentUser?.role !== 'Employee' && <TableHead>Employee</TableHead>}
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No records found for selected month
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    {currentUser?.role !== 'Employee' && (
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                    )}
                    <TableCell>{record.checkIn || '-'}</TableCell>
                    <TableCell>{record.checkOut || '-'}</TableCell>
                    <TableCell>{record.hours || '-'} hrs</TableCell>
                    <TableCell>
                      <Badge variant={
                        record.status === 'Present' ? 'success' :
                        record.status === 'Late' ? 'warning' :
                        'destructive'
                      }>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
