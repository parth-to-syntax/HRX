import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, TrendingUp, TrendingDown, AlertTriangle, Calendar, Download } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import UserAvatar from '@/components/ui/UserAvatar'
import toast from 'react-hot-toast'

/**
 * Attendance Analytics Page
 * Shows employees working excessive overtime or leaving early
 * For Admin/HR to monitor work patterns and employee wellbeing
 */
export default function AttendanceAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // Last 30 days
  const [overtimeEmployees, setOvertimeEmployees] = useState([])
  const [earlyCheckoutEmployees, setEarlyCheckoutEmployees] = useState([])

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const data = await getAttendanceAnalytics(dateRange)
      
      // Simulated data for UI
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setOvertimeEmployees([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
          department: 'Engineering',
          avgOvertimeHours: 3.5,
          totalOvertimeHours: 42,
          daysWithOvertime: 12,
          maxOvertimeDay: '2025-11-05',
          maxOvertimeHours: 5.5
        },
        {
          id: 2,
          name: 'Sarah Smith',
          email: 'sarah@example.com',
          avatar_url: null,
          department: 'Marketing',
          avgOvertimeHours: 2.8,
          totalOvertimeHours: 28,
          daysWithOvertime: 10,
          maxOvertimeDay: '2025-11-08',
          maxOvertimeHours: 4.2
        }
      ])

      setEarlyCheckoutEmployees([
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          avatar_url: null,
          department: 'Sales',
          earlyCheckouts: 8,
          avgEarlyMinutes: 45,
          totalEarlyMinutes: 360,
          lastEarlyCheckout: '2025-11-08'
        },
        {
          id: 4,
          name: 'Emily Brown',
          email: 'emily@example.com',
          avatar_url: null,
          department: 'HR',
          earlyCheckouts: 5,
          avgEarlyMinutes: 30,
          totalEarlyMinutes: 150,
          lastEarlyCheckout: '2025-11-07'
        }
      ])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load attendance analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    toast.success('Export feature will be implemented with backend')
  }

  const getSeverityColor = (hours) => {
    if (hours >= 4) return 'text-red-600 bg-red-50'
    if (hours >= 2) return 'text-orange-600 bg-orange-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  const getEarlySeverityColor = (minutes) => {
    if (minutes >= 60) return 'text-red-600 bg-red-50'
    if (minutes >= 30) return 'text-orange-600 bg-orange-50'
    return 'text-yellow-600 bg-yellow-50'
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Attendance Analytics"
        subtitle="Monitor overtime and early checkouts to ensure employee wellbeing"
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-muted-foreground" />
              <label className="text-sm font-medium">Time Period:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>

            <Button onClick={exportToCSV} variant="outline">
              <Download size={18} className="mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Excessive Overtime Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="text-orange-600" size={20} />
                </div>
                <div>
                  <CardTitle>Employees with Excessive Overtime</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {overtimeEmployees.length} employees working beyond standard hours
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {overtimeEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No employees with excessive overtime in this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overtimeEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <UserAvatar user={employee} size="lg" />

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {employee.department} • {employee.email}
                            </p>
                          </div>

                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(employee.avgOvertimeHours)}`}>
                            {employee.avgOvertimeHours.toFixed(1)}h avg overtime
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Overtime</p>
                            <p className="font-semibold text-orange-600">
                              {employee.totalOvertimeHours}h
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days with OT</p>
                            <p className="font-semibold">
                              {employee.daysWithOvertime} days
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Peak Overtime</p>
                            <p className="font-semibold text-red-600">
                              {employee.maxOvertimeHours}h
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Peak Date</p>
                            <p className="font-semibold">
                              {new Date(employee.maxOvertimeDay).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {employee.avgOvertimeHours >= 3 && (
                          <div className="mt-3 flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                            <AlertTriangle size={14} />
                            <span>
                              Consider discussing workload with this employee to prevent burnout
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Early Checkout Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingDown className="text-blue-600" size={20} />
                </div>
                <div>
                  <CardTitle>Employees Leaving Early</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {earlyCheckoutEmployees.length} employees with frequent early checkouts
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {earlyCheckoutEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No employees with early checkouts in this period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {earlyCheckoutEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <UserAvatar user={employee} size="lg" />

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{employee.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {employee.department} • {employee.email}
                            </p>
                          </div>

                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEarlySeverityColor(employee.avgEarlyMinutes)}`}>
                            {employee.avgEarlyMinutes} min avg early
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Early Checkouts</p>
                            <p className="font-semibold text-blue-600">
                              {employee.earlyCheckouts} times
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Early Time</p>
                            <p className="font-semibold">
                              {Math.floor(employee.totalEarlyMinutes / 60)}h {employee.totalEarlyMinutes % 60}m
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Early By</p>
                            <p className="font-semibold text-orange-600">
                              {employee.avgEarlyMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Occurrence</p>
                            <p className="font-semibold">
                              {new Date(employee.lastEarlyCheckout).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {employee.earlyCheckouts >= 5 && (
                          <div className="mt-3 flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                            <AlertTriangle size={14} />
                            <span>
                              Pattern detected - may need to review schedule or workload
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <TrendingUp className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Overtime Hours</p>
                    <p className="text-2xl font-bold">
                      {overtimeEmployees.reduce((sum, e) => sum + e.totalOvertimeHours, 0)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingDown className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Early Time Lost</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(earlyCheckoutEmployees.reduce((sum, e) => sum + e.totalEarlyMinutes, 0) / 60)}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <AlertTriangle className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Employees Needing Attention</p>
                    <p className="text-2xl font-bold">
                      {overtimeEmployees.filter(e => e.avgOvertimeHours >= 3).length + 
                       earlyCheckoutEmployees.filter(e => e.earlyCheckouts >= 5).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
