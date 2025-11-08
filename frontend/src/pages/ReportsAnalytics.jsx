import React from 'react'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function ReportsAnalytics() {
  const dispatch = useDispatch()
  const employeesList = useSelector((state) => state.employees.list)
  const [selectedEmployee, setSelectedEmployee] = React.useState('')
  const [selectedYear, setSelectedYear] = React.useState(String(new Date().getFullYear()))
  const [downloading, setDownloading] = React.useState(false)
  

  useEffect(() => {
    if (!employeesList || employeesList.length === 0) {
      ;(async () => {
        try {
          const { listEmployees } = await import('@/api/employees')
          const { setEmployees } = await import('@/redux/slices/employeesSlice')
          const data = await listEmployees({ page: 1, pageSize: 1000 })
          const items = Array.isArray(data) ? data : (data.items || [])
          dispatch(setEmployees(items))
        } catch (err) {
          // Fallback: if forbidden, at least load current user's profile so they can generate their own report
          try {
            if (err?.status === 403) {
              const { getMyProfile } = await import('@/api/employees')
              const { setEmployees } = await import('@/redux/slices/employeesSlice')
              const me = await getMyProfile()
              dispatch(setEmployees([me]))
              // preselect self
              setSelectedEmployee(me.id)
            }
          } catch (_) {
            // ignore
          }
        }
      })()
    }
  }, [employeesList?.length, dispatch])

  // Auto-select first employee when list becomes available and none selected yet
  useEffect(() => {
    if (!selectedEmployee && Array.isArray(employeesList) && employeesList.length > 0) {
      setSelectedEmployee(employeesList[0].id)
    }
  }, [employeesList, selectedEmployee])

  const onDownload = async () => {
    if (!selectedEmployee || !selectedYear) return
    try {
      setDownloading(true)
      const { downloadYearSalaryPdf } = await import('@/api/payroll')
      const blob = await downloadYearSalaryPdf(selectedEmployee, selectedYear)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `salary_${selectedEmployee}_${selectedYear}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-2">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
                disabled={Array.isArray(employeesList) && employeesList.length <= 1}
              >
                <option value="">Select Employee</option>
                {employeesList?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {(emp.first_name || '') + ' ' + (emp.last_name || '')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                {[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2].map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-teal-600 hover:bg-teal-700 flex-1"
                onClick={onDownload}
                disabled={!selectedEmployee || !selectedYear || downloading}
              >
                <Download size={16} className="mr-2" />
                {downloading ? 'Downloading…' : 'Download PDF'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
