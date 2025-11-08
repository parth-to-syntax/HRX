import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Calendar, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { addRequest, updateStatus } from '@/redux/slices/leaveSlice'

export default function LeavePage() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const { requests, balance } = useSelector((state) => state.leave)
  const [filter, setFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const isHROrAdmin = ['HR Officer', 'Admin'].includes(currentUser?.role)
  
  const userRequests = isHROrAdmin 
    ? requests 
    : requests.filter(r => r.employeeId === currentUser.id)

  const filteredRequests = filter === 'All' 
    ? userRequests 
    : userRequests.filter(r => r.status === filter)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1

    const newRequest = {
      id: `LV${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      ...formData,
      days,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    }

    dispatch(addRequest(newRequest))
    setShowModal(false)
    setFormData({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' })
  }

  const handleApprove = (id) => {
    dispatch(updateStatus({ id, status: 'Approved' }))
  }

  const handleReject = (id) => {
    dispatch(updateStatus({ id, status: 'Rejected' }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage leave requests and balances</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Calendar size={18} />
          Apply Leave
        </Button>
      </div>

      {/* Leave Balance */}
      {currentUser?.role === 'Employee' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Annual Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{balance.annual} days</p>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Sick Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{balance.sick} days</p>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Casual Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{balance.casual} days</p>
              <p className="text-xs text-muted-foreground mt-1">Available</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center">
            <Filter size={18} />
            <span className="text-sm font-medium">Filter by status:</span>
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isHROrAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {isHROrAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    {isHROrAdmin && <TableCell className="font-medium">{request.employeeName}</TableCell>}
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.status === 'Approved' ? 'success' :
                        request.status === 'Pending' ? 'warning' :
                        'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </TableCell>
                    {isHROrAdmin && (
                      <TableCell>
                        {request.status === 'Pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleApprove(request.id)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(request.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply Leave Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Leave Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    >
                      <option>Annual Leave</option>
                      <option>Sick Leave</option>
                      <option>Casual Leave</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
