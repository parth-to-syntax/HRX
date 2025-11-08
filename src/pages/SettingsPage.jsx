import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, Calendar, DollarSign, Sun } from 'lucide-react'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('roles')

  const tabs = [
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'leave', label: 'Leave Policies', icon: Calendar },
    { id: 'payroll', label: 'Payroll Settings', icon: DollarSign },
    { id: 'holidays', label: 'Holiday Calendar', icon: Sun },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system configuration and policies</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'roles' && (
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {['Admin', 'HR Officer', 'Payroll Officer', 'Employee'].map((role) => (
                    <div key={role} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{role}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Manage permissions for {role.toLowerCase()} role
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'leave' && (
            <Card>
              <CardHeader>
                <CardTitle>Leave Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Annual Leave Days</label>
                      <Input type="number" defaultValue={15} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sick Leave Days</label>
                      <Input type="number" defaultValue={10} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Casual Leave Days</label>
                      <Input type="number" defaultValue={5} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Carry Forward Days</label>
                      <Input type="number" defaultValue={5} />
                    </div>
                  </div>
                  <Button className="mt-4">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payroll' && (
            <Card>
              <CardHeader>
                <CardTitle>Payroll Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax Rate (%)</label>
                      <Input type="number" defaultValue={15} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Cycle</label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>Monthly</option>
                        <option>Bi-weekly</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Date</label>
                      <Input type="number" defaultValue={1} min={1} max={31} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Currency</label>
                      <select className="w-full px-3 py-2 border rounded-lg">
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>
                  </div>
                  <Button className="mt-4">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'holidays' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Holiday Calendar</CardTitle>
                  <Button size="sm">Add Holiday</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { date: '2025-11-28', name: 'Thanksgiving' },
                    { date: '2025-12-25', name: 'Christmas Day' },
                    { date: '2026-01-01', name: 'New Year\'s Day' },
                  ].map((holiday, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(holiday.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Remove</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
