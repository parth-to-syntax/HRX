import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { changePasswordApi } from '@/api/auth'
import toast from 'react-hot-toast'

export default function PasswordManagementModal({ isOpen, onClose, loginId = '' }) {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  const handleResetPassword = async () => {
    setError('')

    // Validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsChanging(true)
      await changePasswordApi({
        current_password: formData.oldPassword,
        new_password: formData.newPassword
      })

      setShowSuccess(true)
      toast.success('Password changed successfully!')
      
      // Reset form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      // Show success message for 2 seconds then close
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 2000)
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to change password'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsChanging(false)
    }
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md">
              <Card>
                <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-bold">Password Management</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Login Id:</label>
                    <Input
                      type="text"
                      value={loginId}
                      readOnly
                      className="bg-muted/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Old Password:</label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={formData.oldPassword}
                      onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                      disabled={isChanging}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">New Password:</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      disabled={isChanging}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password:</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={isChanging}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        <strong>Password changed successfully!</strong>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>Minimum 8 characters long</li>
                    <li>Contains uppercase and lowercase letters</li>
                    <li>Contains numbers and special characters</li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-3">
                    <strong>Note:</strong> Make sure the employee receives the password through email 
                    or another digital method. The password change mechanism should be different for 
                    administrators and regular users.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isChanging}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResetPassword}
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isChanging}
                  >
                    {isChanging ? 'Changing...' : 'Reset Password'}
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
