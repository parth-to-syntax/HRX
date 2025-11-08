import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { X, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addRequest, updateStatus } from '@/redux/slices/leaveSlice'
import PageHeader from '@/components/layout/PageHeader'

export default function LeavePage() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const { requests } = useSelector((state) => state.leave)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [formData, setFormData] = useState({
    employee: '',
    timeOffType: 'Paid time off',
    startDate: '',
    endDate: '',
    allocation: '',
    attachment: null,
  })

  // Users who should only see their own time-off entries
  const isSelfScopedUser = ['Employee', 'Payroll Officer'].includes(currentUser?.role)
  const isHROrAdmin = ['HR Officer', 'Admin'].includes(currentUser?.role)

  const handleApprove = (id) => {
    dispatch(updateStatus({ id, status: 'Approved' }))
  }

  const handleReject = (id) => {
    dispatch(updateStatus({ id, status: 'Rejected' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    const newRequest = {
      id: `LV${Date.now()}`,
      employeeId: isSelfScopedUser ? currentUser.id : 'admin',
      employeeName: isSelfScopedUser 
        ? `${currentUser.first_name} ${currentUser.last_name}`
        : formData.employee,
      type: formData.timeOffType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: formData.allocation || days,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
      attachment: formData.attachment,
    }

    dispatch(addRequest(newRequest))
    setShowNewModal(false)
    setFormData({ 
      employee: '', 
      timeOffType: 'Paid time off', 
      startDate: '', 
      endDate: '', 
      allocation: '',
      attachment: null 
    })
  }

  // Filter requests by role
  const getFilteredRequests = () => {
    // HR/Admin see all requests; Employees and Payroll Officers see only their own
    let filtered = isSelfScopedUser 
      ? requests.filter(r => r.employeeId === currentUser.id)
      : requests

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const filteredRequests = getFilteredRequests()

  // Calculate available days
  const paidDaysAvailable = 24
  const sickDaysAvailable = 7
  const unpaidDaysAvailable = 10

  return (
    <>
      <PageHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={true}
        onNewClick={() => setShowNewModal(true)}
      />

      <div className="p-8">
        <Card className="border-2">
          <CardContent className="p-0">
            {/* Stats Section */}
            <div className="p-6 border-b bg-background">
              <div className="flex gap-12">
                <div>
                  <h3 className="text-blue-600 font-semibold text-lg mb-2">Paid time Off</h3>
                  <p className="text-2xl font-bold">{paidDaysAvailable} Days Available</p>
                </div>
                <div>
                  <h3 className="text-blue-600 font-semibold text-lg mb-2">Sick Leave</h3>
                  <p className="text-2xl font-bold">{sickDaysAvailable} Days Available</p>
                </div>
                <div>
                  <h3 className="text-blue-600 font-semibold text-lg mb-2">Unpaid Leaves</h3>
                  <p className="text-2xl font-bold">{unpaidDaysAvailable} Days Available</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-sm">Name</th>
                    <th className="text-left p-4 font-semibold text-sm">Start Date</th>
                    <th className="text-left p-4 font-semibold text-sm">End Date</th>
                    <th className="text-left p-4 font-semibold text-sm">Time off Type</th>
                    <th className="text-left p-4 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        No time off requests found
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-muted/30">
                        <td className="p-4 text-sm">
                          {request.employeeName || '[Emp Name]'}
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(request.startDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(request.endDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="text-blue-600">{request.type}</span>
                        </td>
                        <td className="p-4 text-sm">
                          {isHROrAdmin && request.status === 'Pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(request.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                              >
                                ✕
                              </button>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <span className={`text-sm ${
                              request.status === 'Approved' ? 'text-green-600' : 
                              request.status === 'Rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {request.status}
                            </span>
                          )}
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

      {/* New Time Off Request Modal */}
      {showNewModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50" 
            onClick={() => setShowNewModal(false)} 
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="w-full max-w-xl bg-card rounded-lg shadow-lg border-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h2 className="text-xl font-bold">Time off Type Request</h2>
                  <button
                    onClick={() => setShowNewModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Employee */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Employee</label>
                    <div className="flex-1 text-blue-600 font-medium">
                      {isSelfScopedUser 
                        ? `[${currentUser.first_name} ${currentUser.last_name}]`
                        : (
                          <Input
                            value={formData.employee}
                            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                            placeholder="[Employee]"
                            className="text-blue-600"
                            required
                          />
                        )
                      }
                    </div>
                  </div>

                  {/* Time off Type */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Time off Type</label>
                    <select
                      value={formData.timeOffType}
                      onChange={(e) => setFormData({ ...formData, timeOffType: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md bg-background text-blue-600 font-medium"
                      required
                    >
                      <option value="Paid time off">[Paid time off]</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Unpaid Leaves">Unpaid Leaves</option>
                    </select>
                  </div>

                  {/* Validity Period */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Validity Period</label>
                    <div className="flex-1 flex items-center gap-3">
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="text-blue-600"
                        required
                      />
                      <span className="text-sm font-medium">To</span>
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="text-blue-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Allocation */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Allocation</label>
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.allocation}
                        onChange={(e) => setFormData({ ...formData, allocation: e.target.value })}
                        placeholder="01.00"
                        className="w-32 text-blue-600"
                      />
                      <span className="text-sm text-blue-600 font-medium">Days</span>
                    </div>
                  </div>

                  {/* Attachment */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Attachment:</label>
                    <div className="flex-1 flex items-center gap-3">
                      <button
                        type="button"
                        className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Upload size={20} />
                      </button>
                      <span className="text-sm text-muted-foreground">
                        (For sick leave certificate)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-start pt-4">
                    <Button 
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                    >
                      Submit
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewModal(false)}
                      className="px-6 bg-muted hover:bg-muted/80"
                    >
                      Discard
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
