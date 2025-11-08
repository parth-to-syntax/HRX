import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '@/redux/slices/userSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Vortex } from '@/components/ui/vortex'
import { InteractiveCard } from '@/components/ui/interactive-card'
import Logo from '@/components/ui/Logo'
import employeesData from '@/data/employees.json'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const quickFillCredentials = (role) => {
    const credentials = {
      Admin: { loginId: 'HRJODO20220001', password: 'password123' },
      'HR Officer': { loginId: 'HRJASM20220002', password: 'password123' },
      'Payroll Officer': { loginId: 'HRMIJO20220003', password: 'password123' },
      Employee: { loginId: 'HRSAWI20220004', password: 'password123' },
    }
    
    const cred = credentials[role]
    if (cred) {
      setLoginId(cred.loginId)
      setPassword(cred.password)
      setError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const employee = employeesData.find(
        (emp) => emp.user.login_id === loginId && emp.user.password === password
      )

      if (employee) {
        const userWithoutPassword = {
          id: employee.id,
          user_id: employee.user_id,
          name: `${employee.first_name} ${employee.last_name}`,
          email: employee.email,
          role: employee.user.role.charAt(0).toUpperCase() + employee.user.role.slice(1),
          login_id: employee.user.login_id,
          department: employee.department.name,
          position: employee.position,
          phone: employee.phone,
          joinDate: employee.date_of_joining,
          avatar: employee.avatar_url,
          location: employee.location,
          manager_id: employee.manager_id,
          has_manager: employee.has_manager
        }
        dispatch(login(userWithoutPassword))
        navigate('/dashboard')
      } else {
        setError('Invalid Login ID or Password')
      }
      setLoading(false)
    }, 500)
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
          className="min-h-screen flex items-center justify-center p-4"
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
                <CardDescription className="text-teal-100 text-base">Sign in to your account</CardDescription>
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

                <div className="space-y-2">
                  <label htmlFor="loginId" className="text-sm font-medium text-white">
                    Login ID
                  </label>
                  <Input
                    id="loginId"
                    type="text"
                    placeholder="Enter your login ID"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-300 backdrop-blur-sm focus:bg-white/20 focus:border-teal-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

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
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </InteractiveCard>
              </form>

              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-xs font-semibold mb-3 text-teal-300">Quick Login (Demo):</p>
                <div className="grid grid-cols-2 gap-2">
                  <InteractiveCard
                    enableTilt={false}
                    enableParticles={true}
                    enableMagnetism={false}
                    clickEffect={true}
                    particleCount={4}
                    glowColor="13, 148, 136"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickFillCredentials('Admin')}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-teal-400 transition-all text-xs"
                    >
                      Admin
                    </Button>
                  </InteractiveCard>
                  <InteractiveCard
                    enableTilt={false}
                    enableParticles={true}
                    enableMagnetism={false}
                    clickEffect={true}
                    particleCount={4}
                    glowColor="13, 148, 136"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickFillCredentials('HR Officer')}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-teal-400 transition-all text-xs"
                    >
                      HR Officer
                    </Button>
                  </InteractiveCard>
                  <InteractiveCard
                    enableTilt={false}
                    enableParticles={true}
                    enableMagnetism={false}
                    clickEffect={true}
                    particleCount={4}
                    glowColor="13, 148, 136"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickFillCredentials('Payroll Officer')}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-teal-400 transition-all text-xs"
                    >
                      Payroll
                    </Button>
                  </InteractiveCard>
                  <InteractiveCard
                    enableTilt={false}
                    enableParticles={true}
                    enableMagnetism={false}
                    clickEffect={true}
                    particleCount={4}
                    glowColor="13, 148, 136"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => quickFillCredentials('Employee')}
                      className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-teal-400 transition-all text-xs"
                    >
                      Employee
                    </Button>
                  </InteractiveCard>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-300">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-teal-300 hover:text-teal-200 font-semibold transition-colors"
                  >
                    Sign Up
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
