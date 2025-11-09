import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Users, Clock, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { setRecords } from '@/redux/slices/attendanceSlice'
import { setRequests } from '@/redux/slices/leaveSlice'
import { setPayslips } from '@/redux/slices/payrollSlice'
import { setEmployees } from '@/redux/slices/employeesSlice'
import attendanceData from '@/data/attendance.json'
import leaveData from '@/data/leaves.json'
import payrollData from '@/data/payroll.json'
import employeesData from '@/data/employees.json'

const attendanceTrendData = [
  { month: 'Jun', present: 85, absent: 15 },
  { month: 'Jul', present: 88, absent: 12 },
  { month: 'Aug', present: 92, absent: 8 },
  { month: 'Sep', present: 87, absent: 13 },
  { month: 'Oct', present: 90, absent: 10 },
  { month: 'Nov', present: 93, absent: 7 },
]

const leaveStatsData = [
  { name: 'Annual', value: 45 },
  { name: 'Sick', value: 25 },
  { name: 'Casual', value: 30 },
]

const COLORS = ['#0d9488', '#14b8a6', '#2dd4bf']

export default function Dashboard() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const { records } = useSelector((state) => state.attendance)
  const { requests } = useSelector((state) => state.leave)
  const { payslips } = useSelector((state) => state.payroll)
  const { list: employees } = useSelector((state) => state.employees)

  useEffect(() => {
    // Load data into Redux
    dispatch(setRecords(attendanceData))
    dispatch(setRequests(leaveData))
    dispatch(setPayslips(payrollData))
    dispatch(setEmployees(employeesData))
  }, [dispatch])

  const isAdminOrHR = ['admin', 'hr'].includes(currentUser?.role?.toLowerCase())

  // Calculate stats
  const totalEmployees = employees.length
  const todayPresent = records.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length
  const pendingLeaves = requests.filter(r => r.status === 'Pending').length
  const thisMonthPayroll = payslips.filter(p => p.month.includes('October')).length

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name}! 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your organization today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdminOrHR && (
          <StatCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            trend="up"
            trendValue="+2 from last month"
          />
        )}
        <StatCard
          title="Present Today"
          value={todayPresent}
          icon={CheckCircle}
          trend="up"
          trendValue="93% attendance rate"
        />
        <StatCard
          title="Pending Leaves"
          value={pendingLeaves}
          icon={Calendar}
          trend="neutral"
          trendValue="2 requests pending"
        />
        <StatCard
          title="Payroll Processed"
          value={thisMonthPayroll}
          icon={DollarSign}
          trend="up"
          trendValue="On schedule"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#0d9488" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leaveStatsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveStatsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-auto py-4 flex flex-col items-center gap-2">
              <Clock size={24} />
              <span>Mark Attendance</span>
            </Button>
            <Button className="h-auto py-4 flex flex-col items-center gap-2" variant="outline">
              <Calendar size={24} />
              <span>Apply Leave</span>
            </Button>
            <Button className="h-auto py-4 flex flex-col items-center gap-2" variant="outline">
              <DollarSign size={24} />
              <span>View Payslip</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.slice(0, 3).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium">{req.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{req.type} - {req.days} day(s)</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  req.status === 'Approved' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                  req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
