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

  const resetForm = () => {
    setFormData({ email: '', loginId: '', password: '' })
    setEmailSent(false)
    setShowSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

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

    // Extract name from email
    const emailParts = formData.email.split('@')[0].split('.')
    const firstName = emailParts[0] 
      ? emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1).toLowerCase()
      : 'New'
    const lastName = emailParts[1] 
      ? emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1).toLowerCase()
      : 'Employee'

    // Generate unique IDs
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)

    // Create employee record
    const newEmployee = {
      id: `550e8400-e29b-41d4-a716-${timestamp.toString().substring(0, 12)}`,
      user_id: `550e8400-e29b-41d4-a716-${(timestamp + 1).toString().substring(0, 12)}`,
      company_id: '550e8400-e29b-41d4-a716-446655440000',
      department_id: '550e8400-e29b-41d4-a716-446655440101',
      first_name: firstName,
      last_name: lastName,
      email: formData.email,
      phone: '+1 234-567-' + Math.floor(1000 + Math.random() * 9000),
      location: 'New York',
      manager_id: null,
      avatar_url: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${Math.floor(Math.random() * 16777215).toString(16)}&color=fff`,
      resume_url: null,
      about_job: `Joined as a new team member on ${new Date().toLocaleDateString()}`,
      interests: 'Professional Development',
      hobbies: 'Learning new technologies',
      dob: '',
      nationality: '',
      gender: '',
      marital_status: '',
      address: '',
      date_of_joining: new Date().toISOString().split('T')[0],
      joining_serial: timestamp,
      has_bank_account: false,
      has_manager: false,
      user: {
        login_id: formData.loginId,
        role: 'employee',
        is_first_login: true,
        password: formData.password
      },
      department: {
        name: 'Engineering',
        id: '550e8400-e29b-41d4-a716-446655440101'
      },
      position: 'Software Engineer'
    }

    console.log('Creating new employee:', newEmployee)
    dispatch(addEmployee(newEmployee))
    
    // Show success notification
    alert(`Employee ${firstName} ${lastName} created successfully!`)
    
    // Reset form and close
    resetForm()
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
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <Card>
                <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add New Employee</h2>
                  <button
                    onClick={handleClose}
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
                    onClick={handleClose}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
