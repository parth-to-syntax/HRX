import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { AlertTriangle, X, Download, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/layout/PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  createPayrun, 
  listPayruns, 
  getPayrun, 
  listPayslipsForPayrun, 
  getPayslip,
  listMyPayslips,
  validatePayslip,
  cancelPayslip,
  recomputePayslip,
  downloadPayslipPdf,
  employerCostReport,
  employeeCountReport
} from '@/api/payroll'
import toast from 'react-hot-toast'

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
  
  // State for dynamic data
  const [loading, setLoading] = useState(false)
  const [payruns, setPayruns] = useState([])
  const [employerCostData, setEmployerCostData] = useState([])
  const [employeeCountData, setEmployeeCountData] = useState([])
  const [showCreatePayrunModal, setShowCreatePayrunModal] = useState(false)
  const [newPayrun, setNewPayrun] = useState({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })

  const isPayrollOrAdmin = ['payroll', 'admin'].includes(currentUser?.role?.toLowerCase())
  const isEmployee = currentUser?.role?.toLowerCase() === 'employee'

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    try {
      if (isPayrollOrAdmin) {
        // Load payruns
        const payrunsData = await listPayruns({ page: 1, pageSize: 100 })
        
        // Load payslips for each payrun
        const payrunsWithEmployees = await Promise.all(
          payrunsData.items.map(async (payrun) => {
            const payslipsData = await listPayslipsForPayrun(payrun.id, { page: 1, pageSize: 100 })
            
            // Load full payslip details with components
            const employeesWithDetails = await Promise.all(
              payslipsData.items.map(async (payslip) => {
                const fullPayslip = await getPayslip(payslip.id)
                // Map backend structure to frontend expected structure
                return {
                  ...fullPayslip.payslip,  // Spread all payslip properties (employee_name, basic_wage, etc.)
                  
                  // Map for detail view - worked days tab
                  attendance: {
                    days: fullPayslip.payslip.total_worked_days || 0,
                    detail: `(${fullPayslip.payslip.total_worked_days || 0} working days)`
                  },
                  paidTimeOffDetails: {
                    days: fullPayslip.payslip.total_leaves || 0,
                    detail: `(${fullPayslip.payslip.total_leaves || 0} approved leaves)`
                  },
                  
                  // Map for detail view - salary computation tab
                  salaryComponents: {
                    earnings: fullPayslip.components.filter(c => !c.is_deduction).map(c => ({
                      name: c.component_name,
                      rate: '-', // Rate not available in backend
                      amount: parseFloat(c.amount) || 0
                    })),
                    deductions: fullPayslip.components.filter(c => c.is_deduction).map(c => ({
                      name: c.component_name,
                      rate: '-', // Rate not available in backend
                      amount: parseFloat(c.amount) || 0
                    })),
                    gross: parseFloat(fullPayslip.payslip.gross_wage) || 0,
                    netAmount: parseFloat(fullPayslip.payslip.net_wage) || 0
                  }
                }
              })
            )
            
            return {
              ...payrun,
              employees: employeesWithDetails
            }
          })
        )
        
        setPayruns(payrunsWithEmployees)
        
        // Load reports data
        const currentYear = new Date().getFullYear()
        const costReport = await employerCostReport(currentYear)
        const countReport = await employeeCountReport(currentYear)
        
        setEmployerCostData(costReport.monthly || [])
        setEmployeeCountData(countReport.monthly || [])
      } else if (isEmployee) {
        // Load employee's own payslips
        const myPayslips = await listMyPayslips({ page: 1, pageSize: 100 })
        // Transform to match payrun format for display
        // Group by period
        const grouped = {}
        for (const slip of myPayslips.items) {
          const key = `${slip.period_year}-${slip.period_month}`
          if (!grouped[key]) {
            grouped[key] = {
              id: key,
              period_month: slip.period_month,
              period_year: slip.period_year,
              employees: []
            }
          }
          grouped[key].employees.push(slip)
        }
        setPayruns(Object.values(grouped))
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayrun = async () => {
    try {
      await createPayrun(newPayrun)
      toast.success('Payrun created successfully')
      setShowCreatePayrunModal(false)
      setNewPayrun({ period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() })
      loadData() // Reload data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create payrun')
    }
  }

  const handleDownloadPayslip = async (payslipId, employeeName) => {
    try {
      const blob = await downloadPayslipPdf(payslipId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payslip_${employeeName}_${payslipId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Payslip downloaded')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download payslip')
    }
  }

  const handleValidatePayslip = async (payslipId) => {
    try {
      await validatePayslip(payslipId)
      toast.success('Payslip validated')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to validate payslip')
    }
  }

  const handleCancelPayslip = async (payslipId) => {
    try {
      await cancelPayslip(payslipId)
      toast.success('Payslip cancelled')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel payslip')
    }
  }

  const handleRecomputePayslip = async (payslipId) => {
    try {
      await recomputePayslip(payslipId)
      toast.success('Payslip recomputed')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to recompute payslip')
    }
  }

  // Helper functions
  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1] || ''
  }

  const formatPayrunText = (payrun) => {
    return `Payrun for ${getMonthName(payrun.period_month)} ${payrun.period_year} (${payrun.employee_count || payrun.employees?.length || 0} Payslip${(payrun.employee_count || payrun.employees?.length || 0) !== 1 ? 's' : ''})`
  }

  // Generate warnings based on payroll data
  const warnings = []
  
  // Check if current month payrun exists
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentMonthPayrun = payruns.find(pr => pr.period_month === currentMonth && pr.period_year === currentYear)
  
  if (isPayrollOrAdmin && !currentMonthPayrun) {
    warnings.push({
      id: 'no-payrun',
      text: `⚠️ No payrun generated for ${getMonthName(currentMonth)} ${currentYear}. Click "New Payrun" to create one.`
    })
  }

  // Check for unvalidated payslips
  const unvalidatedCount = payruns.reduce((count, pr) => {
    const unvalidated = pr.employees?.filter(e => e.status !== 'validated' && e.status !== 'cancelled').length || 0
    return count + unvalidated
  }, 0)

  if (isPayrollOrAdmin && unvalidatedCount > 0) {
    warnings.push({
      id: 'unvalidated',
      text: `⚠️ ${unvalidatedCount} payslip${unvalidatedCount !== 1 ? 's' : ''} pending validation.`
    })
  }

  // Info about access rights
  warnings.push({
    id: 'info',
    text: `ℹ️ Payroll menu is accessible only to users with Admin/Payroll Officer access rights.`
  })

  if (!isPayrollOrAdmin && !isEmployee) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">You don't have permission to view payroll</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Payrun</CardTitle>
                  {isPayrollOrAdmin && (
                    <Button size="sm" onClick={() => setShowCreatePayrunModal(true)}>
                      <Plus size={16} className="mr-1" />
                      New Payrun
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : payruns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payruns found</p>
                  ) : (
                    payruns.map((payrun) => (
                      <div 
                        key={payrun.id} 
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer text-sm"
                        onClick={() => {
                          setActiveTab('payrun')
                          setSelectedPayrun(payrun)
                        }}
                      >
                        {formatPayrunText(payrun)}
                      </div>
                    ))
                  )}
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

              {/* Wage Types Legend */}
              <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Understanding Wage Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">Employer Cost:</span>
                    <span className="text-gray-600 dark:text-gray-400"> Employee's monthly wage including employer contributions (PF, etc.)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">Basic Wage:</span>
                    <span className="text-gray-600 dark:text-gray-400"> Employee's basic salary (prorated by attendance)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">Gross Wage:</span>
                    <span className="text-gray-600 dark:text-gray-400"> Basic salary + all allowances</span>
                  </div>
                  <div>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">Net Wage:</span>
                    <span className="text-gray-600 dark:text-gray-400"> Gross wage - all deductions (take-home pay)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Payrun Tab Content */}
        {activeTab === 'payrun' && (
          <div>
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">ℹ️ About Payslips:</span> The Payroll Payrun allows you to generate payslips for all employees at once. 
                Payslips are generated automatically based on attendance. You can validate, recompute, or cancel individual payslips. 
                <span className="font-semibold text-green-700 dark:text-green-400"> "Done" status</span> is shown once any payslip has been validated.
              </p>
            </div>

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
                  {isPayrollOrAdmin && (
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => setShowCreatePayrunModal(true)}
                    >
                      <Plus size={16} className="mr-1" />
                      Generate Payrun
                    </Button>
                  )}
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
                        <p className="text-lg font-semibold">₹ {(selectedPayrun.total_employer_cost || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gross Wage</p>
                        <p className="text-lg font-semibold">₹ {(selectedPayrun.employees?.reduce((sum, e) => sum + (e.gross_wage || 0), 0) || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net Wage</p>
                        <p className="text-lg font-semibold">₹ {(selectedPayrun.employees?.reduce((sum, e) => sum + (e.net_wage || 0), 0) || 0).toLocaleString()}</p>
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
                          {selectedPayrun.employees?.map((employee) => (
                            <tr 
                              key={employee.id}
                              className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => setSelectedEmployee(employee)}
                            >
                              <td className="py-3 px-4 text-sm">{getMonthName(selectedPayrun.period_month)} {selectedPayrun.period_year}</td>
                              <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400">
                                {employee.employee_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A'}
                              </td>
                              <td className="py-3 px-4 text-sm">₹ {(employee.gross_wage || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {(employee.basic_wage || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {(employee.gross_wage || 0).toLocaleString()}</td>
                              <td className="py-3 px-4 text-sm">₹ {(employee.net_wage || 0).toLocaleString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                  employee.status === 'validated' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : employee.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                }`}>
                                  {employee.status === 'validated' ? 'Done' : employee.status || 'Generated'}
                                </span>
                              </td>
                            </tr>
                          )) || []}
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
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedEmployee.employee_name || `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim() || '[Employee]'}
                  </h2>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Payrun</span>
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        {getMonthName(selectedPayrun?.period_month)} {selectedPayrun?.period_year}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        selectedEmployee.status === 'validated' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : selectedEmployee.status === 'cancelled'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {selectedEmployee.status === 'validated' ? 'Done' : selectedEmployee.status || 'Generated'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleRecomputePayslip(selectedEmployee.id)}
                    disabled={selectedEmployee.status === 'cancelled'}
                    variant="outline"
                  >
                    Compute
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleValidatePayslip(selectedEmployee.id)}
                    disabled={selectedEmployee.status === 'validated' || selectedEmployee.status === 'cancelled'}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                  >
                    Validate
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleCancelPayslip(selectedEmployee.id)}
                    disabled={selectedEmployee.status === 'cancelled'}
                    className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleDownloadPayslip(selectedEmployee.id, selectedEmployee.employee_name || 'employee')}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Export PDF
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
                {/* Info Banner */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-semibold">ℹ️ Salary Calculation:</span> Salary is calculated based on the employee's monthly attendance. 
                    Paid leaves are included in the total payable days, while unpaid leaves are deducted from the salary.
                  </p>
                </div>

                {/* Payslip Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period</p>
                    <p className="font-medium">{getMonthName(selectedPayrun?.period_month)} {selectedPayrun?.period_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Basic Wage</p>
                    <p className="font-medium">₹ {(selectedEmployee.basic_wage || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gross Wage</p>
                    <p className="font-medium text-green-600 dark:text-green-400">₹ {(selectedEmployee.gross_wage || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Net Wage</p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">₹ {(selectedEmployee.net_wage || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payable Days</p>
                    <p className="font-semibold">{selectedEmployee.payable_days || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Worked Days</p>
                    <p className="font-semibold">{selectedEmployee.total_worked_days || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Paid Leaves</p>
                    <p className="font-semibold">{selectedEmployee.total_leaves || 0}</p>
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
                              ₹ {(((selectedEmployee.basic_wage || 0) / (selectedEmployee.payable_days || 22)) * (selectedEmployee.attendance.days || 0)).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="border-t dark:border-gray-700">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Paid Time off</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">
                              <span className="text-blue-600 dark:text-blue-400">{selectedEmployee.paidTimeOffDetails.days}.00</span>
                              <span className="text-sm text-gray-500 ml-1">{selectedEmployee.paidTimeOffDetails.detail}</span>
                            </td>
                            <td className="py-3 px-4 text-blue-600 dark:text-blue-400">
                              ₹ {(((selectedEmployee.basic_wage || 0) / (selectedEmployee.payable_days || 22)) * (selectedEmployee.paidTimeOffDetails.days || 0)).toFixed(2)}
                            </td>
                          </tr>
                          <tr className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700"></td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">{(selectedEmployee.attendance.days + selectedEmployee.paidTimeOffDetails.days).toFixed(2)}</td>
                            <td className="py-3 px-4">₹ {(selectedEmployee.basic_wage || 0).toFixed(2)}</td>
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
                          {selectedEmployee.salaryComponents.earnings?.length > 0 && selectedEmployee.salaryComponents.earnings.map((earning, index) => (
                            <tr key={`earning-${index}`} className="border-t dark:border-gray-700">
                              <td className="py-3 px-4 border-r dark:border-gray-700">{earning.name}</td>
                              <td className="py-3 px-4 border-r dark:border-gray-700">{earning.rate}</td>
                              <td className="py-3 px-4">₹ {(earning.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                          
                          {/* Gross Total */}
                          <tr className="border-t-2 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Gross</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">100</td>
                            <td className="py-3 px-4">₹ {(selectedEmployee.salaryComponents.gross || 0).toFixed(2)}</td>
                          </tr>

                          {/* Deductions Section */}
                          {selectedEmployee.salaryComponents.deductions?.length > 0 && selectedEmployee.salaryComponents.deductions.map((deduction, index) => (
                            <tr key={`deduction-${index}`} className="border-t dark:border-gray-700">
                              <td className="py-3 px-4 border-r dark:border-gray-700">{deduction.name}</td>
                              <td className="py-3 px-4 border-r dark:border-gray-700">{deduction.rate}</td>
                              <td className="py-3 px-4">- ₹ {(deduction.amount || 0).toFixed(2)}</td>
                            </tr>
                          ))}

                          {/* Net Amount */}
                          <tr className="border-t-2 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold">
                            <td className="py-3 px-4 border-r dark:border-gray-700">Net Amount</td>
                            <td className="py-3 px-4 border-r dark:border-gray-700">100</td>
                            <td className="py-3 px-4">₹ {(selectedEmployee.salaryComponents.netAmount || 0).toFixed(2)}</td>
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

      {/* Create Payrun Modal */}
      {showCreatePayrunModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Create New Payrun
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreatePayrunModal(false)}
                >
                  <X size={20} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Period Month</label>
                <select 
                  className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md"
                  value={newPayrun.period_month}
                  onChange={(e) => setNewPayrun({ ...newPayrun, period_month: parseInt(e.target.value) })}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(month => (
                    <option key={month} value={month}>{getMonthName(month)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Period Year</label>
                <Input
                  type="number"
                  value={newPayrun.period_year}
                  onChange={(e) => setNewPayrun({ ...newPayrun, period_year: parseInt(e.target.value) })}
                  min={2020}
                  max={2100}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCreatePayrunModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePayrun}>
                  Create Payrun
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
