import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { publicSignupApi } from '@/api/auth'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
// Password fields are removed; temp password will be emailed from backend
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Vortex } from '@/components/ui/vortex'
import { InteractiveCard } from '@/components/ui/interactive-card'
import Logo from '@/components/ui/Logo'

export default function SignupPage() {
  const navigate = useNavigate()
  const COMPANY_ID = import.meta.env.VITE_COMPANY_ID || 'e66712e5-ca3f-4252-8827-61ff6257a565'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      // Assume a single company & date_of_joining today for MVP (could be a select later)
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        company_id: COMPANY_ID,
        date_of_joining: new Date().toISOString().slice(0,10),
      }
      const resp = await publicSignupApi(payload)
      const msg = `Account created. Login ID: ${resp.login_id}. A temporary password has been emailed to ${formData.email}.`
      setSuccess(msg)
      toast.success(msg)
      setLoading(false)
      setTimeout(() => navigate('/'), 2500)
    } catch (err) {
      const msg = err.message || 'Signup failed'
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full overflow-hidden">
      <Vortex
        backgroundColor="#000000"
        baseHue={180}
        rangeHue={40}
        particleCount={500}
        baseSpeed={0.1}
        rangeSpeed={1.0}
        className="min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.8,
            ease: "easeOut",
          }}
          className="min-h-screen flex items-center justify-center p-4 py-12"
        >
          <Card className="w-full max-w-md backdrop-blur-xl bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.5,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200,
                }}
                className="mx-auto"
              >
                <Logo className="h-20 w-auto text-white" white={true} />
              </motion.div>
              <div>
                <CardDescription className="text-teal-100 text-base">Create your account</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-red-500/20 border border-red-400/50 rounded-lg text-red-200 text-sm backdrop-blur-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-green-500/20 border border-green-400/50 rounded-lg text-green-200 text-sm backdrop-blur-sm"
                  >
                    {success}
                  </motion.div>
                )}

                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="text-sm font-medium text-white">
                      First Name
                    </label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-white">
                      Last Name
                    </label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-white">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@hrx.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-white">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234-567-8900"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                    required
                  />
                </div>

                {/* Password fields removed - temp password will be emailed */}

                <InteractiveCard
                  enableTilt={false}
                  enableParticles={true}
                  enableMagnetism={false}
                  clickEffect={true}
                  particleCount={8}
                  glowColor="13, 148, 136"
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold shadow-lg shadow-teal-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/70" 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </InteractiveCard>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-300">
                  Already have an account?{' '}
                  <Link 
                    to="/" 
                    className="text-teal-300 hover:text-teal-200 font-semibold transition-colors"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Vortex>
    </div>
  )
}
