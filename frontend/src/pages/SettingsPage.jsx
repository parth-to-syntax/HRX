import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Settings } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'
import { listUsers, updateUserRole } from '@/api/admin'
import { publicSignupApi } from '@/api/auth'

export default function SettingsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const COMPANY_ID = import.meta.env.VITE_COMPANY_ID || 'e66712e5-ca3f-4252-8827-61ff6257a565'
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  // Load users on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const u = await listUsers()
        if (!mounted) return
        setUsers(u)
      } catch (e) {
        toast.error(e.message || 'Failed to load settings')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const refreshUsers = async () => {
    try {
      const u = await listUsers()
      setUsers(u)
    } catch (e) {
      toast.error(e.message || 'Failed to refresh users')
    }
  }

  const onAddUser = async (e) => {
    e?.preventDefault?.()
    // simple validation
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.phone) {
      toast.error('First name, Last name, Email and Phone are required')
      return
    }
    setAdding(true)
    try {
      const payload = {
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        email: newUser.email,
        phone: newUser.phone,
        company_id: COMPANY_ID,
        date_of_joining: new Date().toISOString().slice(0,10),
      }
      const resp = await publicSignupApi(payload)
      toast.success(`User created (Login ID: ${resp.login_id})`)
      setShowAdd(false)
  setNewUser({ firstName: '', lastName: '', email: '', phone: '' })
      await refreshUsers()
    } catch (e) {
      toast.error(e.message || 'Failed to create user')
    } finally {
      setAdding(false)
    }
  }

  const onChangeRole = async (userId, role) => {
    try {
      await updateUserRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Role updated')
    } catch (e) {
      toast.error(e.message || 'Failed to update role')
    }
  }

  return (
    <>
      <PageHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={true}
        newButtonLabel={"Add User"}
        onNewClick={() => setShowAdd(true)}
      />
      <div className="p-8">
        {/* Main Container with Border */}
        <Card className="border-2">
          <CardContent className="p-0">
            {/* Users table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-sm">Name</th>
                    <th className="text-left p-4 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 font-semibold text-sm">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 text-sm">{u.name || '-'}</td>
                      <td className="p-3 text-sm">{u.email || '-'}</td>
                      <td className="p-3 text-sm">
                        <select
                          className="border rounded px-2 py-1 text-sm capitalize dark:bg-gray-800 dark:border-gray-700"
                          value={u.role || 'employee'}
                          onChange={(e) => onChangeRole(u.id, e.target.value)}
                        >
                          {['admin','hr','payroll','employee'].map(r => (
                            <option key={r} value={r} className="capitalize">{r}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New User</h3>
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form onSubmit={onAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">First Name</label>
                  <Input value={newUser.firstName} onChange={(e)=>setNewUser(v=>({...v, firstName: e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm">Last Name</label>
                  <Input value={newUser.lastName} onChange={(e)=>setNewUser(v=>({...v, lastName: e.target.value}))} required />
                </div>
              </div>
              <div>
                <label className="text-sm">Email</label>
                <Input type="email" value={newUser.email} onChange={(e)=>setNewUser(v=>({...v, email: e.target.value}))} required />
              </div>
              <div>
                <label className="text-sm">Phone</label>
                <Input type="tel" value={newUser.phone} onChange={(e)=>setNewUser(v=>({...v, phone: e.target.value}))} required />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={adding} className="bg-teal-600 hover:bg-teal-700">{adding ? 'Creating…' : 'Create User'}</Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">User will be created with a temporary password and role 'employee'. You can change their role from the list.</p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}