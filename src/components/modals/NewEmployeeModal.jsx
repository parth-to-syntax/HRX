import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Mail, CheckCircle } from 'lucide-react'
import { addEmployee } from '@/redux/slices/employeesSlice'

export default function NewEmployeeModal({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    email: '',
    loginId: '',
    password: ''
  })
  const [emailSent, setEmailSent] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const generateLoginId = () => {
    // Generate Login ID based on name initials and date
    // Format: HRXXXXYYYYNNN (e.g., HRJODO20220001)
    const timestamp = Date.now().toString().slice(-4)
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `HR${timestamp}${year}${randomNum}`
  }

  const generatePassword = () => {
    // Generate random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleGenerateCredentials = () => {
    setFormData({
      ...formData,
      loginId: generateLoginId(),
      password: generatePassword()
    })
  }

  const handleSendEmail = async () => {
    if (!formData.email || !formData.loginId || !formData.password) {
      alert('Please generate credentials first')
      return
    }

    // Simulate email sending (backend will handle this)
    setEmailSent(true)
    setShowSuccess(true)

    // Show success message for 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const handleCreateEmployee = () => {
    if (!formData.email || !formData.loginId || !formData.password) {
      alert('Please fill all fields and generate credentials')
      return
    }

    if (!emailSent) {
      alert('Please send credentials email first')
      return
    }

    // Create employee record
    const newEmployee = {
      id: `550e8400-e29b-41d4-a716-${Date.now()}`,
      user_id: `550e8400-e29b-41d4-a716-${Date.now() + 1}`,
      company_id: '550e8400-e29b-41d4-a716-446655440000',
      department_id: null,
      first_name: formData.email.split('@')[0].split('.')[0] || 'New',
      last_name: formData.email.split('@')[0].split('.')[1] || 'Employee',
      email: formData.email,
      phone: '',
      location: '',
      manager_id: null,
      avatar_url: `https://ui-avatars.com/api/?name=${formData.email.split('@')[0]}&background=0d9488&color=fff`,
      resume_url: null,
      about_job: '',
      interests: '',
      hobbies: '',
      dob: '',
      nationality: '',
      gender: '',
      marital_status: '',
      address: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      joining_serial: Date.now(),
      has_bank_account: false,
      has_manager: false,
      user: {
        login_id: formData.loginId,
        role: 'employee',
        is_first_login: true,
        password: formData.password
      },
      department: {
        name: 'Unassigned',
        id: null
      },
      position: 'Employee'
    }

    dispatch(addEmployee(newEmployee))
    
    // Reset form and close
    setFormData({ email: '', loginId: '', password: '' })
    setEmailSent(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add New Employee</h2>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Employee Credentials Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold">EMAIL</th>
                        <th className="text-left p-3 font-semibold">LOG IN ID</th>
                        <th className="text-left p-3 font-semibold">Password</th>
                        <th className="text-left p-3 font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3">
                          <Input
                            type="email"
                            placeholder="employee@hrx.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="text"
                            placeholder="Auto-generated"
                            value={formData.loginId}
                            readOnly
                            className="w-full bg-muted/30"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="password"
                            placeholder="Auto-generated"
                            value={formData.password}
                            readOnly
                            className="w-full bg-muted/30"
                          />
                        </td>
                        <td className="p-3">
                          <Button
                            onClick={handleSendEmail}
                            disabled={!formData.loginId || !formData.password}
                            className="bg-teal-600 hover:bg-teal-700 whitespace-nowrap"
                            size="sm"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Mail
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> User should receive a mail with their Login ID and password. 
                    The current user login ID is automatically populated.
                  </p>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <strong>Email sent successfully!</strong> The employee will receive their login credentials.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateCredentials}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!formData.email}
                  >
                    Generate Credentials
                  </Button>
                  <Button
                    onClick={handleCreateEmployee}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={!emailSent}
                  >
                    Create Employee
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
