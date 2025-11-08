import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const attendanceData = [
  { month: 'Jun', present: 520, late: 45, absent: 35 },
  { month: 'Jul', present: 540, late: 35, absent: 25 },
  { month: 'Aug', present: 565, late: 25, absent: 10 },
  { month: 'Sep', present: 530, late: 40, absent: 30 },
  { month: 'Oct', present: 555, late: 30, absent: 15 },
  { month: 'Nov', present: 570, late: 20, absent: 10 },
]

const payrollData = [
  { month: 'Jun', amount: 125000 },
  { month: 'Jul', amount: 128000 },
  { month: 'Aug', amount: 132000 },
  { month: 'Sep', amount: 129000 },
  { month: 'Oct', amount: 135000 },
  { month: 'Nov', amount: 138000 },
]

const leaveData = [
  { month: 'Jun', approved: 25, rejected: 3, pending: 2 },
  { month: 'Jul', approved: 30, rejected: 2, pending: 3 },
  { month: 'Aug', approved: 35, rejected: 1, pending: 1 },
  { month: 'Sep', approved: 28, rejected: 4, pending: 2 },
  { month: 'Oct', approved: 32, rejected: 2, pending: 3 },
  { month: 'Nov', approved: 27, rejected: 1, pending: 2 },
]

export default function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState('6months')
  const [department, setDepartment] = useState('all')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive HR data insights</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download size={18} />
          Export All Reports
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Department:</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">All Departments</option>
                <option value="it">IT</option>
                <option value="hr">Human Resources</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Trend */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Attendance Trend Analysis</CardTitle>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" fill="#0d9488" name="Present" />
              <Bar dataKey="late" fill="#f59e0b" name="Late" />
              <Bar dataKey="absent" fill="#ef4444" name="Absent" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payroll Summary (Monthly)</CardTitle>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={payrollData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#0d9488" strokeWidth={2} name="Total Payroll" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Leave Statistics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Leave Statistics</CardTitle>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill="#0d9488" name="Approved" />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">92.5%</p>
            <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
              <TrendingUp size={14} />
              +3.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Payroll (Nov)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">$138,000</p>
            <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
              <TrendingUp size={14} />
              +2.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Leave Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">96.4%</p>
            <p className="text-xs text-muted-foreground mt-1">
              27 out of 28 requests approved
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
