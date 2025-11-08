import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Download, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'

export default function PayrollPage() {
  const { currentUser } = useSelector((state) => state.user)
  const { payslips } = useSelector((state) => state.payroll)
  const [selectedPayslip, setSelectedPayslip] = useState(null)

  const isPayrollOrAdmin = ['Payroll Officer', 'Admin'].includes(currentUser?.role)
  
  const userPayslips = isPayrollOrAdmin 
    ? payslips 
    : payslips.filter(p => p.employeeId === currentUser.id)

  const handleDownload = (payslip) => {
    alert(`Downloading payslip for ${payslip.month}...`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">View and manage employee payslips</p>
        </div>
        {isPayrollOrAdmin && (
          <Button className="flex items-center gap-2">
            <DollarSign size={18} />
            Generate Payslip
          </Button>
        )}
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isPayrollOrAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Month</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userPayslips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No payslips found
                  </TableCell>
                </TableRow>
              ) : (
                userPayslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    {isPayrollOrAdmin && (
                      <TableCell className="font-medium">{payslip.employeeName}</TableCell>
                    )}
                    <TableCell>{payslip.month}</TableCell>
                    <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                    <TableCell>{formatCurrency(payslip.allowances)}</TableCell>
                    <TableCell>{formatCurrency(payslip.deductions)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payslip.netPay)}</TableCell>
                    <TableCell>
                      <Badge variant={payslip.status === 'Paid' ? 'success' : 'warning'}>
                        {payslip.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedPayslip(payslip)}>
                          View
                        </Button>
                        <Button size="sm" onClick={() => handleDownload(payslip)}>
                          <Download size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payslip Details Modal */}
      {selectedPayslip && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedPayslip(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Payslip Details - {selectedPayslip.month}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Employee Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedPayslip.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{selectedPayslip.employeeId}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Earnings</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.allowances)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-semibold">
                      <span>Gross Pay</span>
                      <span>{formatCurrency(selectedPayslip.basicSalary + selectedPayslip.allowances)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Deductions</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Deductions</span>
                      <span className="font-medium">{formatCurrency(selectedPayslip.deductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Net Pay</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPayslip.netPay)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedPayslip(null)}>
                    Close
                  </Button>
                  <Button onClick={() => handleDownload(selectedPayslip)}>
                    <Download size={16} className="mr-2" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
