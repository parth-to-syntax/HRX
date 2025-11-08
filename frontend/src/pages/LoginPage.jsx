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
import toast from 'react-hot-toast'
import { loginApi, meApi } from '@/api/auth'
import { getMyProfile } from '@/api/employees'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Removed hardcoded quick-fill demo accounts to enforce real backend credentials.

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const loginResp = await loginApi({ login_id: loginId, password })
      // Handle first login requirement (HTTP 428 via interceptor normalization not implemented here)
      if (loginResp?.first_login) {
        const msg = 'Password reset required on first login. Use first-reset flow.'
        setError(msg)
        toast.error(msg)
        setLoading(false)
        return
      }
      // Fetch user (basic) then try employee profile (optional for admin/HR without profile)
      const me = await meApi()
      const role = (me.user?.role || loginResp.role || '').toLowerCase()
      let profile = null
      try {
        profile = await getMyProfile()
      } catch (e) {
        if (e.status !== 404) {
          // Unexpected failure — rethrow to surface error
          throw e
        }
        // 404 means no employee profile — acceptable for admin/HR
        profile = null
      }
      const userData = {
        id: profile?.id || me.user?.id,
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : (loginResp.login_id || loginId),
        email: profile?.email || '',
        role,
        login_id: loginResp.login_id || loginId,
        company_id: me.user?.company_id,
        date_of_joining: profile?.date_of_joining || null,
        avatar_url: profile?.avatar_url || null,
        location: profile?.location || null,
        has_employee: !!profile,
      }
      dispatch(login(userData))
      toast.success('Signed in successfully')
  navigate('/dashboard/employees')
    } catch (err) {
      const msg = err.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    } finally {
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

              {/* Quick login buttons removed to avoid hardcoded credentials; all input now fully dynamic. */}
              {/* Signup links removed; user creation now handled by admin in Settings page */}
            </CardContent>
          </Card>
        </motion.div>
      </Vortex>
    </div>
  )
}
