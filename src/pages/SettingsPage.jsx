import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Calendar, DollarSign, Sun, Settings } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { Checkbox } from '@/components/ui/checkbox'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('user-setting')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [users, setUsers] = useState([
    {
      id: 1,
      username: '',
      loginId: '',
      email: 'abcd@gmail.com',
      role: '',
      permissions: {
        employees: false,
        attendance: false,
        timeOff: false,
        payroll: false,
        reports: false,
        settings: false
      }
    }
  ])

  const tabs = [
    { id: 'user-setting', label: 'User Setting', icon: Settings },
    { id: 'employees', label: 'Employees', icon: Shield },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'time-off', label: 'Time Off', icon: Sun },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleAddUser = () => {
    setUsers([...users, {
      id: users.length + 1,
      username: '',
      loginId: '',
      email: '',
      role: '',
      permissions: {
        employees: false,
        attendance: false,
        timeOff: false,
        payroll: false,
        reports: false,
        settings: false
      }
    }])
  }

  const handlePermissionChange = (userId, module) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, permissions: { ...user.permissions, [module]: !user.permissions[module] } }
        : user
    ))
  }

  const handleInputChange = (userId, field, value) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, [field]: value }
        : user
    ))
  }

  return (
    <>
      <PageHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={true}
        onNewClick={handleAddUser}
      />
      <div className="p-8">
        {/* Main Container with Border */}
        <Card className="border-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold text-sm">User name</th>
                    <th className="text-left p-4 font-semibold text-sm">Login id</th>
                    <th className="text-left p-4 font-semibold text-sm">Email</th>
                    <th className="text-left p-4 font-semibold text-sm">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <Input
                          value={user.username}
                          onChange={(e) => handleInputChange(user.id, 'username', e.target.value)}
                          placeholder="Enter name"
                          className="h-9 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={user.loginId}
                          onChange={(e) => handleInputChange(user.id, 'loginId', e.target.value)}
                          placeholder="Enter login ID"
                          className="h-9 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={user.email}
                          onChange={(e) => handleInputChange(user.id, 'email', e.target.value)}
                          placeholder="Enter email"
                          className="h-9 text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleInputChange(user.id, 'role', e.target.value)}
                          className="w-full h-9 px-3 py-2 border rounded-md text-sm bg-background"
                        >
                          <option value="">Select role</option>
                          <option value="Employee">Employee</option>
                          <option value="Admin">Admin</option>
                          <option value="HR Officer">HR Officer</option>
                          <option value="Payroll Officer">Payroll Officer</option>
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
    </>
  )
}