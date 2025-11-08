import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InteractiveCard } from '@/components/ui/interactive-card'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '@/components/layout/PageHeader'

export default function EmployeeDirectory() {
  const { currentUser } = useSelector((state) => state.user)
  const { list: employees } = useSelector((state) => state.employees)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  const isHROrAdmin = ['HR Officer', 'Admin'].includes(currentUser?.user?.role || currentUser?.role)

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) ||
           emp.email.toLowerCase().includes(searchLower) ||
           emp.department?.name?.toLowerCase().includes(searchLower) ||
           emp.position?.toLowerCase().includes(searchLower)
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNewButton={isHROrAdmin}
        onNewClick={() => console.log('Add new employee')}
        showCompanyLogo={false}
      />

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee, index) => (
          <InteractiveCard
            key={employee.id}
            enableTilt={true}
            enableParticles={true}
            enableMagnetism={true}
            clickEffect={true}
            particleCount={6}
            glowColor="13, 148, 136"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedEmployee(employee)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Employee Avatar */}
                    <div className="flex-shrink-0">
                      <img
                        src={employee.avatar_url || `https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=0d9488&color=fff`}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="w-16 h-16 rounded border-2 border-primary/20"
                      />
                    </div>

                    {/* Employee Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {employee.first_name} {employee.last_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.position || 'Employee'}
                      </p>
                    </div>

                    {/* Status Indicator (circle on right) */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                        {/* You can add status logic here - green dot for present, plane for on leave, etc */}
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </InteractiveCard>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No employees found</p>
        </div>
      )}

      {/* Employee Details Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedEmployee(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
            >
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Employee Details</h2>
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src={selectedEmployee.avatar_url || `https://ui-avatars.com/api/?name=${selectedEmployee.first_name}+${selectedEmployee.last_name}&background=0d9488&color=fff`}
                      alt={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                      className="w-20 h-20 rounded-full"
                    />
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </h3>
                      <p className="text-muted-foreground">{selectedEmployee.position}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Login ID</p>
                      <p className="font-medium">{selectedEmployee.user?.login_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedEmployee.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedEmployee.department?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{selectedEmployee.user?.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">
                        {new Date(selectedEmployee.date_of_joining).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedEmployee.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">{selectedEmployee.gender}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
