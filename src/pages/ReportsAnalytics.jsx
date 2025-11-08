import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, TrendingUp, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/layout/PageHeader'
import { AnimatePresence, motion } from 'framer-motion'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [showSalaryReport, setShowSalaryReport] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedYear, setSelectedYear] = useState('2025')
  const { employees } = useSelector((state) => state.employees)
  const { currentUser } = useSelector((state) => state.user)

  const isHROrAdmin = ['HR Officer', 'Admin', 'Payroll Officer'].includes(currentUser?.role)

  return (
    <>
      <PageHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={false}
      />
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground mt-1">Generate and export HR reports</p>
          </div>
        </div>

      {/* Salary Statement Report Card */}
      {isHROrAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Salary Statement Report</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowSalaryReport(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <FileText size={16} className="mr-2" />
                Print
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Employee Name :</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="">Select Employee</option>
                  {employees?.list?.map((emp) => (
                    <option key={emp.id} value={emp.username}>
                      {emp.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
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
                className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="all">All Departments</option>
                <option value="it">IT</option>
                <option value="hr">Human Resources</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
              </select>
            </div>
            <Button variant="outline" size="sm" className="ml-auto">
              <Download size={16} className="mr-2" />
              Export All Reports
            </Button>
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

      {/* Salary Statement Report Modal */}
      <AnimatePresence>
        {showSalaryReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">Salary Statement Report Print</h2>
                <button
                  onClick={() => setShowSalaryReport(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Company Section */}
                <div className="border-b dark:border-gray-700 pb-4">
                  <p className="text-red-600 dark:text-red-400 font-semibold">[Company]</p>
                  <p className="text-red-600 dark:text-red-400 font-semibold mt-1">Salary Statement Report</p>
                </div>

                {/* Employee Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="text-red-600 dark:text-red-400 w-32">Employee Name</span>
                      <span className="font-medium">{selectedEmployee || '[Emp Name]'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-red-600 dark:text-red-400 w-32">Designation</span>
                      <span className="font-medium">[Designation]</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="flex justify-end">
                      <span className="text-red-600 dark:text-red-400 w-32">Date Of Joining</span>
                      <span className="font-medium">[Date]</span>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-red-600 dark:text-red-400 w-32">Salary Effective From</span>
                      <span className="font-medium text-red-600 dark:text-red-400">[From Date]</span>
                    </div>
                  </div>
                </div>

                {/* Salary Components Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border dark:border-gray-700">
                    <thead>
                      <tr className="bg-pink-100 dark:bg-pink-900/20">
                        <th className="text-left py-3 px-4 font-semibold text-sm border-r dark:border-gray-700 text-red-600 dark:text-red-400">
                          Salary Components
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-sm border-r dark:border-gray-700 text-red-600 dark:text-red-400">
                          Monthly Amount
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-sm text-red-600 dark:text-red-400">
                          Yearly Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Earnings */}
                      <tr className="bg-pink-50 dark:bg-pink-900/10">
                        <td className="py-2 px-4 font-semibold text-red-600 dark:text-red-400 border-r dark:border-gray-700" colSpan={3}>
                          Earnings
                        </td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">Basic</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">[₹ 12233]</td>
                        <td className="py-2 px-4 text-center">[₹ 12233]</td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">HRA</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">[₹ 12233]</td>
                        <td className="py-2 px-4 text-center">[₹ 12233]</td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center">:</td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center">:</td>
                      </tr>

                      {/* Deduction */}
                      <tr className="bg-pink-50 dark:bg-pink-900/10 border-t-2 dark:border-gray-600">
                        <td className="py-2 px-4 font-semibold text-red-600 dark:text-red-400 border-r dark:border-gray-700" colSpan={3}>
                          Deduction
                        </td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">PF--</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">[₹ 12233]</td>
                        <td className="py-2 px-4 text-center">[₹ 12233]</td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center">:</td>
                      </tr>
                      <tr className="border-t dark:border-gray-700">
                        <td className="py-2 px-4 border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center border-r dark:border-gray-700">:</td>
                        <td className="py-2 px-4 text-center">:</td>
                      </tr>

                      {/* Net Salary */}
                      <tr className="bg-pink-50 dark:bg-pink-900/10 border-t-2 dark:border-gray-600">
                        <td className="py-3 px-4 font-semibold text-red-600 dark:text-red-400 border-r dark:border-gray-700">
                          Net Salary
                        </td>
                        <td className="py-3 px-4 text-center font-semibold border-r dark:border-gray-700">[₹ 12233]</td>
                        <td className="py-3 px-4 text-center font-semibold">[₹ 12233]</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSalaryReport(false)}
                  >
                    Close
                  </Button>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
