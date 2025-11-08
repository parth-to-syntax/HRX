import { useState } from 'react'
import { useSelector } from 'react-redux'
import { AlertTriangle, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/layout/PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'

export default function PayrollPage() {
  const { currentUser } = useSelector((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' or 'payrun'
  const [employerCostView, setEmployerCostView] = useState('monthly') // 'annually' or 'monthly'
  const [employeeCountView, setEmployeeCountView] = useState('monthly') // 'annually' or 'monthly'
  const [selectedPayrun, setSelectedPayrun] = useState(null) // For Payrun tab
  const [selectedEmployee, setSelectedEmployee] = useState(null) // For detailed payslip view
  const [activePayrunSubTab, setActivePayrunSubTab] = useState('payrun') // 'payrun' or 'validate'
  const [activePayslipTab, setActivePayslipTab] = useState('worked-days') // 'worked-days' or 'salary-computation'

  const isPayrollOrAdmin = ['Payroll Officer', 'Admin'].includes(currentUser?.role)

  // Sample data for employer cost chart
  const employerCostData = [
    { month: 'Jan 2025', annual: 300000, monthly: 25000 },
    { month: 'Feb 2025', annual: 320000, monthly: 26500 },
    { month: 'Mar 2025', annual: 340000, monthly: 28000 }
  ]

  // Sample data for employee count chart
  const employeeCountData = [
    { month: 'Jan 2025', annual: 30, monthly: 28 },
    { month: 'Feb 2025', annual: 32, monthly: 30 },
    { month: 'Mar 2025', annual: 35, monthly: 32 }
  ]

  // Warnings data
  const warnings = [
    { id: 1, text: '1 Employee without Bank A/c', count: 1 },
    { id: 2, text: '1 Employee without Manager', count: 1 }
  ]

  // Payrun data
  const payruns = [
    { 
      id: 1, 
      text: 'Payrun for Oct 2025 (3 Payslip)', 
      month: 'Payrun Oct 2025', 
      count: 3,
      employerCost: 50000,
      grossWage: 50000,
      netWage: 43800,
      employees: [
        { 
          id: 1, 
          name: 'Brilliant Clam', 
          employerCost: 25000, 
          basicWage: 25000, 
          grossWage: 50000, 
          netWage: 43800,
          status: 'Done',
          salaryStructure: 'Regular Pay',
          period: '01 Oct To 31 Oct',
          workingDays: 20,
          paidTimeOff: 2,
          attendance: { days: 20, detail: '(5 working days in week)' },
          paidTimeOffDetails: { days: 2, detail: '(2 Paid leaves/Month)' },
          salaryComponents: {
            earnings: [
              { name: 'Basic Salary', rate: 100, amount: 25000.00 },
              { name: 'House Rent Allowance', rate: 100, amount: 12500.00 },
              { name: 'Standard Allowance', rate: 100, amount: 4167.00 },
              { name: 'Performance Bonus', rate: 100, amount: 2082.50 },
              { name: 'Leave Travel Allowance', rate: 100, amount: 2082.50 },
              { name: 'Fixed Allowance', rate: 100, amount: 4168.00 }
            ],
            deductions: [
              { name: 'PF Employee', rate: 100, amount: 3000.00 },
              { name: "PF Employer", rate: 100, amount: 3000.00 },
              { name: 'Professional Tax', rate: 100, amount: 200.00 }
            ],
            gross: 50000.00,
            totalDeductions: 6200.00,
            netAmount: 43800.00
          }
        },
        { 
          id: 2, 
          name: 'Warm Hummingbird', 
          employerCost: 25000, 
          basicWage: 25000, 
          grossWage: 50000, 
          netWage: 43800,
          status: 'Done',
          salaryStructure: 'Regular Pay',
          period: '01 Oct To 31 Oct',
          workingDays: 20,
          paidTimeOff: 2,
          attendance: { days: 20, detail: '(5 working days in week)' },
          paidTimeOffDetails: { days: 2, detail: '(2 Paid leaves/Month)' },
          salaryComponents: {
            earnings: [
              { name: 'Basic Salary', rate: 100, amount: 25000.00 },
              { name: 'House Rent Allowance', rate: 100, amount: 12500.00 },
              { name: 'Standard Allowance', rate: 100, amount: 4167.00 },
              { name: 'Performance Bonus', rate: 100, amount: 2082.50 },
              { name: 'Leave Travel Allowance', rate: 100, amount: 2082.50 },
              { name: 'Fixed Allowance', rate: 100, amount: 4168.00 }
            ],
            deductions: [
              { name: 'PF Employee', rate: 100, amount: 3000.00 },
              { name: "PF Employer", rate: 100, amount: 3000.00 },
              { name: 'Professional Tax', rate: 100, amount: 200.00 }
            ],
            gross: 50000.00,
            totalDeductions: 6200.00,
            netAmount: 43800.00
          }
        }
      ]
    },
    { 
      id: 2, 
      text: 'Payrun for Sept 2025 (3 Payslip)', 
      month: 'Payrun Sept 2025', 
      count: 3,
      employerCost: 50000,
      grossWage: 50000,
      netWage: 43800,
      employees: [
        { 
          id: 1, 
          name: 'Brilliant Clam', 
          employerCost: 25000, 
          basicWage: 25000, 
          grossWage: 50000, 
          netWage: 43800,
          status: 'Done'
        },
        { 
          id: 2, 
          name: 'Warm Hummingbird', 
          employerCost: 25000, 
          basicWage: 25000, 
          grossWage: 50000, 
          netWage: 43800,
          status: 'Done'
        }
      ]
    }
  ]

  return (
    <>
      <PageHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={false}
      />
      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              activeTab === 'dashboard'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('payrun')}
            className={`pb-3 px-4 font-medium text-sm transition-colors ${
              activeTab === 'payrun'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Payrun
          </button>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Warnings and Payrun */}
            <div className="space-y-6">
              {/* Warnings Section */}
              <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={20} />
                    Warning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warnings.map((warning) => (
                    <div 
                      key={warning.id} 
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer text-sm"
                    >
                      {warning.text}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payrun Section */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Payrun</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payruns.map((payrun) => (
                    <div 
                      key={payrun.id} 
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer text-sm"
                      onClick={() => {
                        setActiveTab('payrun')
                        setSelectedPayrun(payrun)
                      }}
                    >
                      {payrun.text}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Charts */}
            <div className="space-y-6">
              {/* Employer Cost Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Employer cost</CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEmployerCostView('annually')}
                        className={`px-3 py-1 text-xs rounded ${
                          employerCostView === 'annually' 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        Annually
                      </button>
                      <div className="relative inline-block w-10 h-5">
                        <button
                          onClick={() => setEmployerCostView(employerCostView === 'monthly' ? 'annually' : 'monthly')}
                          className={`w-10 h-5 rounded-full transition-colors ${
                            employerCostView === 'monthly' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              employerCostView === 'monthly' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <button
                        onClick={() => setEmployerCostView('monthly')}
                        className={`px-3 py-1 text-xs rounded ${
                          employerCostView === 'monthly' 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={employerCostData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#9ca3af' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#9ca3af' }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        formatter={(value) => `₹${value.toLocaleString()}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      />
                      <Bar 
                        dataKey={employerCostView === 'monthly' ? 'monthly' : 'annual'} 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      >
                        {employerCostData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === employerCostData.length - 1 ? '#3b82f6' : '#93c5fd'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Employee Count Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Employee count</CardTitle>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEmployeeCountView('annually')}
                        className={`px-3 py-1 text-xs rounded ${
                          employeeCountView === 'annually' 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        Annually
                      </button>
                      <div className="relative inline-block w-10 h-5">
                        <button
                          onClick={() => setEmployeeCountView(employeeCountView === 'monthly' ? 'annually' : 'monthly')}
                          className={`w-10 h-5 rounded-full transition-colors ${
                            employeeCountView === 'monthly' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              employeeCountView === 'monthly' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                      <button
                        onClick={() => setEmployeeCountView('monthly')}
                        className={`px-3 py-1 text-xs rounded ${
                          employeeCountView === 'monthly' 
                            ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100' 
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={employeeCountData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#9ca3af' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        axisLine={{ stroke: '#9ca3af' }}
                        domain={[0, 40]}
                      />
                      <Tooltip 
                        formatter={(value) => `${value} employees`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      />
                      <Bar 
                        dataKey={employeeCountView === 'monthly' ? 'monthly' : 'annual'} 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      >
                        {employeeCountData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === employeeCountData.length - 1 ? '#3b82f6' : '#93c5fd'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Payrun Tab Content */}
        {activeTab === 'payrun' && (
          <div>
            {/* Payrun Sub-tabs */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActivePayrunSubTab('payrun')}
                className={`pb-2 px-4 font-medium text-sm transition-colors ${
                  activePayrunSubTab === 'payrun'
                    ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 rounded-md'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Payrun
              </button>
              <button
                onClick={() => setActivePayrunSubTab('validate')}
                className={`pb-2 px-4 font-medium text-sm transition-colors ${
                  activePayrunSubTab === 'validate'
                    ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 rounded-md'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Validate
              </button>
            </div>

            {/* Payrun List or Selected Payrun */}
            {!selectedPayrun ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Select a Payrun</h2>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    Generate Payrun
                  </Button>
                </div>
                <div className="grid gap-4">
                  {payruns.map((payrun) => (
                    <Card 
                      key={payrun.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedPayrun(payrun)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{payrun.month}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {payrun.count} Payslips
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                            <p className="font-semibold text-lg">₹ {payrun.netWage.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Payrun Header with Summary */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">{selectedPayrun.month}</h2>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPayrun(null)
                          setSelectedEmployee(null)
                        }}
                      >
                        Back to List
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Employer Cost</p>
                        <p className="text-lg font-semibold">₹ {selectedPayrun.employerCost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gross Wage</p>
                        <p className="text-lg font-semibold">₹ {selectedPayrun.grossWage.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net Wage</p>
                        <p className="text-lg font-semibold">₹ {selectedPayrun.netWage.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Employee Payslips Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Employee Payslips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-sm">Pay Period</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Employee</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Employer Cost</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Basic Wage</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Gross Wage</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Net Wage</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPayrun.employees.map((employee) => (
                            <tr 
                              key={employee.id}
                              className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <td className="py-3 px-4 text-sm">Oct 2025</td>
                              <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400">
                                {employee.name}
                              </td>
                              <td className="py-3 px-4 text-sm">₹ {employee.employerCost.toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {employee.basicWage.toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {employee.grossWage.toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {employee.netWage.toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  {employee.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Employee Payslip Detail Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">[Employee]</h2>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Payrun</span>
                      <span className="ml-2 text-blue-600 dark:text-blue-400">{selectedPayrun?.month}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Payslip
                  </Button>
                  <Button size="sm" variant="outline">
                    Compute
                  </Button>
                  <Button size="sm" variant="outline">
                    Validate
                  </Button>
                  <Button size="sm" variant="outline">
                    Cancel
                  </Button>
                  <Button size="sm" variant="outline">
                    Print
                  </Button>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Payslip Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Salary Structure</p>
                    <p className="font-medium">{selectedEmployee.salaryStructure}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-500 font-semibold text-lg">Considerate Lion</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period</p>
                    <p className="font-medium">{selectedEmployee.period}</p>
                  </div>
                </div>

                {/* Worked Days and Salary Computation Tabs */}
                <div className="mb-6">
                  <div className="flex gap-4 border-b dark:border-gray-700 mb-4">
                    <button 
                      onClick={() => setActivePayslipTab('worked-days')}
                      className={`pb-2 px-4 font-medium text-sm ${
                        activePayslipTab === 'worked-days'
                          ? 'border-b-2 border-purple-600 text-purple-600'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Worked Days
                    </button>
                    <button 
                      onClick={() => setActivePayslipTab('salary-computation')}
                      className={`pb-2 px-4 font-medium text-sm ${
                        activePayslipTab === 'salary-computation'
                          ? 'border-b-2 border-purple-600 text-purple-600'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Salary Computation
                    </button>
                  </div>

                  {/* Worked Days Table */}
                  {activePayslipTab === 'worked-days' && (
                    <div className="overflow-x-auto">
                      <table className="w-full border dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="text-left py-3 px-4 font-medium text-sm border-r dark:border-gray-700">Type</th>
                            <th className="text-left py-3 px-4 font-medium text-sm border-r dark:border-gray-700">Days</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t dark:border-gray-700">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Attendance</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">
                              <span className="text-blue-600 dark:text-blue-400">{selectedEmployee.attendance.days}.00</span>
                              <span className="text-sm text-gray-500 ml-1">{selectedEmployee.attendance.detail}</span>
                            </td>
                            <td className="py-3 px-4 text-blue-600 dark:text-blue-400">
                              ₹ 45833.333326
                            </td>
                          </tr>
                          <tr className="border-t dark:border-gray-700">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Paid Time off</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">
                              <span className="text-blue-600 dark:text-blue-400">{selectedEmployee.paidTimeOffDetails.days}.00</span>
                              <span className="text-sm text-gray-500 ml-1">{selectedEmployee.paidTimeOffDetails.detail}</span>
                            </td>
                            <td className="py-3 px-4 text-blue-600 dark:text-blue-400">
                              ₹ 4166.666666
                            </td>
                          </tr>
                          <tr className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700"></td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">22.00</td>
                            <td className="py-3 px-4">₹ 50000.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Salary Computation Table */}
                  {activePayslipTab === 'salary-computation' && selectedEmployee.salaryComponents && (
                    <div className="overflow-x-auto">
                      <table className="w-full border dark:border-gray-700">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <th className="text-left py-3 px-4 font-medium text-sm border-r dark:border-gray-700">Rule Name</th>
                            <th className="text-left py-3 px-4 font-medium text-sm border-r dark:border-gray-700">Rate %</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Earnings Section */}
                          {selectedEmployee.salaryComponents.earnings.map((earning, index) => (
                            <tr key={`earning-${index}`} className="border-t dark:border-gray-700">
                              <td className="py-3 px-4 border-r dark:border-gray-700">{earning.name}</td>
                              <td className="py-3 px-4 border-r dark:border-gray-700">{earning.rate}</td>
                              <td className="py-3 px-4">₹ {earning.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                          
                          {/* Gross Total */}
                          <tr className="border-t-2 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Gross</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">100</td>
                            <td className="py-3 px-4">₹ {selectedEmployee.salaryComponents.gross.toFixed(2)}</td>
                          </tr>

                          {/* Deductions Section */}
                          {selectedEmployee.salaryComponents.deductions.map((deduction, index) => (
                            <tr key={`deduction-${index}`} className="border-t dark:border-gray-700">
                              <td className="py-3 px-4 border-r dark:border-gray-700">{deduction.name}</td>
                              <td className="py-3 px-4 border-r dark:border-gray-700">{deduction.rate}</td>
                              <td className="py-3 px-4">- ₹ {deduction.amount.toFixed(2)}</td>
                            </tr>
                          ))}

                          {/* Net Amount */}
                          <tr className="border-t-2 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Net Amount</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">100</td>
                            <td className="py-3 px-4">₹ {selectedEmployee.salaryComponents.netAmount.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Gross and Deductions Labels */}
                      <div className="mt-4 flex justify-end gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-0.5 bg-gray-400"></div>
                          <span className="text-gray-600 dark:text-gray-400">Gross</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-0.5 bg-gray-400"></div>
                          <span className="text-gray-600 dark:text-gray-400">Deductions</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Salary Info */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Salary is calculated based on the employee's monthly attendance. Paid leaves are included in the total payable days, while unpaid leaves are deducted from the salary
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    'Done' status show once any pay run or payslip has been validated
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
