import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { X, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageHeader from '@/components/layout/PageHeader'
import { 
  listLeaveTypes, 
  listMyAllocations, 
  listLeaveRequests, 
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest
} from '@/api/leaves'
import toast from 'react-hot-toast'

export default function LeavePage() {
  const { currentUser } = useSelector((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState([])
  const [myAllocations, setMyAllocations] = useState([])
  const [requests, setRequests] = useState([])
  const [formData, setFormData] = useState({
    leave_type_id: '',
    startDate: '',
    endDate: '',
    notes: '',
    attachment_url: '',
  })

  // Users who should only see their own time-off entries
  const isEmployee = currentUser?.role?.toLowerCase() === 'employee'
  const isPayroll = currentUser?.role?.toLowerCase() === 'payroll'
  const isHROrAdmin = ['admin', 'hr'].includes(currentUser?.role?.toLowerCase())

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load leave types
      const types = await listLeaveTypes()
      setLeaveTypes(types)

      // Load employee allocations
      if (isEmployee) {
        const allocations = await listMyAllocations()
        setMyAllocations(allocations)
      }

      // Load leave requests
      const requestsData = await listLeaveRequests()
      setRequests(requestsData.items || requestsData)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await approveLeaveRequest(id)
      toast.success('Leave request approved')
      loadData() // Reload data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve leave request')
    }
  }

  const handleReject = async (id) => {
    try {
      await rejectLeaveRequest(id)
      toast.success('Leave request rejected')
      loadData() // Reload data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject leave request')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.leave_type_id || !formData.startDate || !formData.endDate) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      await createLeaveRequest({
        leave_type_id: formData.leave_type_id,
        start_date: formData.startDate,
        end_date: formData.endDate,
        notes: formData.notes,
        attachment_url: formData.attachment_url
      })
      toast.success('Leave request submitted successfully')
      setShowNewModal(false)
      setFormData({ 
        leave_type_id: '',
        startDate: '', 
        endDate: '', 
        notes: '',
        attachment_url: '' 
      })
      loadData() // Reload data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create leave request')
    }
  }

  // Filter requests by search
  const filteredRequests = searchTerm
    ? requests.filter(r => {
        const name = `${r.first_name || ''} ${r.last_name || ''}`.trim().toLowerCase()
        return name.includes(searchTerm.toLowerCase())
      })
    : requests

  // Get allocations with calculated available days
  const allocationsWithAvailable = myAllocations.map(allocation => {
    const total = allocation.allocated_days || 0
    const used = allocation.used_days || 0
    return {
      name: allocation.leave_type || 'Unknown',
      total,
      used,
      available: total - used
    }
  })

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
            {/* Stats Section - Only show for employees */}
            {isEmployee && allocationsWithAvailable.length > 0 && (
              <div className="p-6 border-b bg-background">
                <div className="flex gap-12 flex-wrap">
                  {allocationsWithAvailable.map((allocation, idx) => (
                    <div key={idx}>
                      <h3 className="text-blue-600 font-semibold text-lg mb-2">{allocation.name}</h3>
                      <p className="text-2xl font-bold">{allocation.available} / {allocation.total} Days Available</p>
                      <p className="text-sm text-muted-foreground">{allocation.used} days used</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          {`${request.first_name || ''} ${request.last_name || ''}`.trim() || '[Employee]'}
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(request.start_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(request.end_date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-4 text-sm">
                          <span className="text-blue-600">{request.leave_type}</span>
                        </td>
                        <td className="p-4 text-sm">
                          {(isPayroll || isHROrAdmin) && request.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReject(request.id)}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                              >
                                ✕ Reject
                              </button>
                              <button
                                onClick={() => handleApprove(request.id)}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                              >
                                ✓ Approve
                              </button>
                            </div>
                          ) : (
                            <span className={`text-sm font-medium ${
                              request.status === 'approved' ? 'text-green-600' : 
                              request.status === 'rejected' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                  {/* Employee - auto-filled for employees */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Employee</label>
                    <div className="flex-1 text-blue-600 font-medium">
                      {currentUser.first_name} {currentUser.last_name}
                    </div>
                  </div>

                  {/* Leave Type */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Leave Type *</label>
                    <select
                      value={formData.leave_type_id}
                      onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md bg-background text-blue-600 font-medium"
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map(type => (
                        <option key={type.id} value={type.id}>
                          {type.name} {type.is_paid ? '(Paid)' : '(Unpaid)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Date Range *</label>
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

                  {/* Notes */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes..."
                      className="flex-1 px-3 py-2 border rounded-md bg-background min-h-[80px]"
                    />
                  </div>

                  {/* Attachment URL */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium w-32">Attachment URL</label>
                    <Input
                      value={formData.attachment_url}
                      onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                      placeholder="Optional attachment URL (e.g., medical certificate)"
                      className="flex-1"
                    />
                  </div>

                  <div className="flex gap-3 justify-start pt-4">
                    <Button 
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                    >
                      Submit Request
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowNewModal(false)}
                      className="px-6 bg-muted hover:bg-muted/80"
                    >
                      Cancel
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
