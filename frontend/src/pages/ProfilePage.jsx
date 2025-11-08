import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Plus, Clock, Camera, CheckCircle, Trash2 } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import PasswordManagementModal from '@/components/modals/PasswordManagementModal'
import FaceEnrollmentModal from '@/components/modals/FaceEnrollmentModal'
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus'
import toast from 'react-hot-toast'
import { getMyProfile, getMyPrivateInfo, updateMyProfile, updateMyPrivateInfo, listMySkills, addMySkill, deleteMySkill, listMyCerts, addMyCert, deleteMyCert } from '@/api/employees'
import { getMyAttendance } from '@/api/attendance'
import { getMyEnrollment, deleteMyEnrollment } from '@/api/face'

export default function ProfilePage() {
  const { currentUser } = useSelector((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('resume')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showFaceEnrollment, setShowFaceEnrollment] = useState(false)
  const [faceEnrollment, setFaceEnrollment] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const currentUserStatus = useEmployeeStatus(currentUser?.id)

  const isAdminOrPayroll = ['admin', 'payroll officer'].includes(
    (currentUser?.user?.role || currentUser?.role || '').toLowerCase()
  )

  const [profileData, setProfileData] = useState({
    name: '',
    loginId: '',
    email: '',
    mobile: '',
    company: '',
    department: '',
    manager: '',
    location: '',
    about: '',
    whatILove: '',
    interests: '',
    hobbies: '',
    dateOfJoining: '',
  })

  const [newSkill, setNewSkill] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Private Info data
  const [privateInfo, setPrivateInfo] = useState({
    dob: '',
    nationality: '',
    gender: '',
    maritalStatus: '',
    address: ''
  })

  // Bank Info data
  const [bankInfo, setBankInfo] = useState({
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    pan: '',
    uan: '',
    employeeCode: ''
  })

  const [skills, setSkills] = useState([])
  const [certifications, setCertifications] = useState([])
  const [totalWorkedHours, setTotalWorkedHours] = useState(0)

  // Salary data
  const [salaryData, setSalaryData] = useState({
    monthWage: 50000,
    yearlyWage: 600000,
    workingDaysPerWeek: 5,
    breakTime: '1 hour',
    components: [
      { name: 'Basic Salary', amount: 25000, percentage: 50.00, description: 'Define Basic salary from company cost compute it based on monthly Wages' },
      { name: 'House Rent Allowance', amount: 12500, percentage: 50.00, description: 'HRA provided to employees 50% of the basic salary' },
      { name: 'Standard Allowance', amount: 4167, percentage: 16.67, description: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary' },
      { name: 'Performance Bonus', amount: 2082.50, percentage: 8.33, description: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary' },
      { name: 'Leave Travel Allowance', amount: 2082.50, percentage: 8.33, description: 'LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary' },
      { name: 'Fixed Allowance', amount: 2918, percentage: 11.67, description: 'Fixed allowance portion of wages is determined after calculating all salary components' }
    ],
    pfContributions: [
      { name: 'Employee', amount: 3000, percentage: 12.00, description: 'PF is calculated based on the basic salary' },
      { name: 'Employer', amount: 3000, percentage: 12.00, description: 'PF is calculated based on the basic salary' }
    ],
    taxDeductions: [
      { name: 'Professional Tax', amount: 200, description: 'Professional Tax deducted from the Gross salary' }
    ]
  })

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return
    try {
      const created = await addMySkill(newSkill.trim())
      setSkills((prev) => [...prev, created])
      setNewSkill('')
      toast.success('Skill added')
    } catch (e) {
      toast.error(e.message || 'Failed to add skill')
    }
  }

  const handleAddCertification = async () => {
    if (!newCertification.trim()) return
    try {
      const created = await addMyCert({ title: newCertification.trim() })
      setCertifications((prev) => [...prev, created])
      setNewCertification('')
      toast.success('Certification added')
    } catch (e) {
      toast.error(e.message || 'Failed to add certification')
    }
  }

  const handleRemoveSkill = async (index) => {
    const item = skills[index]
    if (!item) return
    try {
      await deleteMySkill(item.id)
      setSkills((prev) => prev.filter((_, i) => i !== index))
      toast.success('Skill removed')
    } catch (e) {
      toast.error(e.message || 'Failed to remove skill')
    }
  }

  const handleRemoveCertification = async (index) => {
    const item = certifications[index]
    if (!item) return
    try {
      await deleteMyCert(item.id)
      setCertifications((prev) => prev.filter((_, i) => i !== index))
      toast.success('Certification removed')
    } catch (e) {
      toast.error(e.message || 'Failed to remove certification')
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
        // In real app, this would upload to server
        console.log('Avatar uploaded:', file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChanges = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      // 1. Update public profile fields
      const publicPayload = {
        about_job: profileData.about,
        interests: profileData.interests,
        hobbies: profileData.hobbies,
        address: privateInfo.address,
      }
      const profileRes = await updateMyProfile(publicPayload).catch(e => { throw e })

      // 2. Update private sensitive + bank info
      const privatePayload = {
        dob: privateInfo.dob || null,
        nationality: privateInfo.nationality || null,
        gender: privateInfo.gender || null,
        marital_status: privateInfo.maritalStatus || null,
        address: privateInfo.address || null,
        account_number: bankInfo.accountNumber || null,
        bank_name: bankInfo.bankName || null,
        ifsc_code: bankInfo.ifscCode || null,
        pan: bankInfo.pan || null,
        uan: bankInfo.uan || null,
        employee_code: bankInfo.employeeCode || null,
      }
      const privateRes = await updateMyPrivateInfo(privatePayload).catch(e => { throw e })

      // 3. Sync local state from responses (source of truth server)
      if (profileRes?.profile) {
        const p = profileRes.profile
        setProfileData(prev => ({
          ...prev,
          about: p.about_job || prev.about,
          interests: p.interests || prev.interests,
          hobbies: p.hobbies || prev.hobbies,
          // address is stored both places; leave address sync to private section
        }))
      }
      if (privateRes?.personal) {
        const per = privateRes.personal
        setPrivateInfo(prev => ({
          ...prev,
          dob: per.dob || '',
            nationality: per.nationality || '',
            gender: per.gender || '',
            maritalStatus: per.marital_status || '',
            address: per.address || ''
        }))
      }
      if (privateRes?.bank) {
        const b = privateRes.bank
        setBankInfo({
          accountNumber: b.account_number || '',
          bankName: b.bank_name || '',
          ifscCode: b.ifsc_code || '',
          pan: b.pan || '',
          uan: b.uan || '',
          employeeCode: b.employee_code || ''
        })
      }

      toast.success('Profile updated')
      setIsEditing(false)
    } catch (e) {
      toast.error(e.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isAdminOrPayroll ? [{ id: 'salary', label: 'Salary Info' }] : []),
    { id: 'security', label: 'Security' }
  ]

  // Fetch profile, private info, skills, and certifications on mount
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [p, priv, sk, certs] = await Promise.all([
          getMyProfile(),
          getMyPrivateInfo().catch(() => null),
          listMySkills().catch(() => []),
          listMyCerts().catch(() => []),
        ])
        if (!mounted) return
        const fullName = (p?.first_name || p?.last_name)
          ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
          : (currentUser?.name || p?.email || 'My Name')
        setProfileData(prev => ({
          ...prev,
          name: fullName,
          loginId: currentUser?.user?.login_id || currentUser?.login_id || '',
          email: p?.email || '',
          mobile: p?.phone || '',
          company: '',
          department: p?.department?.name || '',
          manager: '',
          location: p?.location || '',
          about: p?.about_job || '',
          whatILove: '',
          interests: p?.interests || '',
          hobbies: p?.hobbies || '',
          dateOfJoining: p?.date_of_joining || p?.joining_date || p?.join_date || ''
        }))
        if (priv?.personal) {
          setPrivateInfo({
            dob: priv.personal.dob || '',
            nationality: priv.personal.nationality || '',
            gender: priv.personal.gender || '',
            maritalStatus: priv.personal.marital_status || '',
            address: priv.personal.address || p?.address || ''
          })
        } else {
          setPrivateInfo({
            dob: p?.dob || '',
            nationality: p?.nationality || '',
            gender: p?.gender || '',
            maritalStatus: p?.marital_status || '',
            address: p?.address || ''
          })
        }
        if (priv?.bank) {
          setBankInfo({
            accountNumber: priv.bank.account_number || '',
            bankName: priv.bank.bank_name || '',
            ifscCode: priv.bank.ifsc_code || '',
            pan: priv.bank.pan || '',
            uan: priv.bank.uan || '',
            employeeCode: priv.bank.employee_code || ''
          })
        } else {
          setBankInfo({ accountNumber: '', bankName: '', ifscCode: '', pan: '', uan: '', employeeCode: '' })
        }
        setSkills(Array.isArray(sk) ? sk : [])
        setCertifications(Array.isArray(certs) ? certs : [])
        
        // Fetch current month's worked hours
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        
        try {
          const attendanceData = await getMyAttendance({ from: firstDayOfMonth, to: lastDayOfMonth })
          const totalHours = attendanceData.days?.reduce((sum, day) => {
            return sum + (Number(day.work_hours) || 0)
          }, 0) || 0
          setTotalWorkedHours(totalHours)
        } catch (err) {
          console.error('Failed to fetch attendance:', err)
          setTotalWorkedHours(0)
        }

        // Fetch face enrollment status
        try {
          const faceData = await getMyEnrollment()
          if (faceData.enrolled) {
            setFaceEnrollment(faceData.enrollment)
          }
        } catch (err) {
          console.error('Failed to fetch face enrollment:', err)
        }
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load profile')
        toast.error(e.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFaceEnrollment = async () => {
    try {
      const faceData = await getMyEnrollment()
      if (faceData.enrolled) {
        setFaceEnrollment(faceData.enrollment)
      } else {
        setFaceEnrollment(null)
      }
    } catch (err) {
      console.error('Failed to fetch face enrollment:', err)
      setFaceEnrollment(null)
    }
  }

  const handleDeleteFaceEnrollment = async () => {
    if (!confirm('Are you sure you want to delete your face enrollment? You will need to re-enroll to use facial recognition check-in.')) {
      return
    }
    try {
      await deleteMyEnrollment()
      setFaceEnrollment(null)
      toast.success('Face enrollment deleted successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete face enrollment')
    }
  }

  return (
    <>
      {/* Page Header */}
      <PageHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showNewButton={false}
        userStatus={currentUserStatus}
      />

      <div className="p-6 space-y-6">
        {loading && <div className="text-sm text-muted-foreground">Loading profile…</div>}
        {error && !loading && <div className="text-sm text-red-500">{error}</div>}
        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center">
                  <img
                    src={avatarPreview || currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${profileData.name}&background=ec4899&color=fff&size=128`}
                    alt={profileData.name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white shadow-lg cursor-pointer"
                >
                  <Edit size={18} />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-4">{profileData.name || 'My Name'}</h2>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Login ID</label>
                      <p className="font-medium">{profileData.loginId || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{profileData.email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Mobile</label>
                      <p className="font-medium">{profileData.mobile || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Company</label>
                    <p className="font-medium">{profileData.company || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Department</label>
                    <p className="font-medium">{profileData.department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Manager</label>
                    <p className="font-medium">{profileData.manager || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Location</label>
                    <p className="font-medium">{profileData.location || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Worked Hours */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Worked Hours (This Month)</p>
                <p className="text-3xl font-bold">{totalWorkedHours.toFixed(2)} hrs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - About Section */}
          <div className="col-span-2 space-y-6">
            {activeTab === 'resume' && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">About</h3>
                    {isEditing ? (
                      <Textarea
                        value={profileData.about}
                        onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {profileData.about || '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">What I love about my job</h3>
                    {isEditing ? (
                      <Textarea
                        value={profileData.whatILove}
                        onChange={(e) => setProfileData({ ...profileData, whatILove: e.target.value })}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {profileData.whatILove || '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">My interests and hobbies</h3>
                    {isEditing ? (
                      <Textarea
                        value={profileData.interests}
                        onChange={(e) => setProfileData({ ...profileData, interests: e.target.value })}
                        rows={4}
                        className="w-full"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {profileData.interests || '—'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'private' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column: Personal Details */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Date of Birth</label>
                        {isEditing ? (
                          <Input type="date" value={privateInfo.dob} onChange={(e) => setPrivateInfo({ ...privateInfo, dob: e.target.value })} />
                        ) : (
                          <p className="font-medium">{privateInfo.dob || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Nationality</label>
                        {isEditing ? (
                          <Input type="text" value={privateInfo.nationality} onChange={(e) => setPrivateInfo({ ...privateInfo, nationality: e.target.value })} placeholder="Enter nationality" />
                        ) : (
                          <p className="font-medium">{privateInfo.nationality || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Personal Email</label>
                        <p className="font-medium">{profileData.email || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Gender</label>
                        {isEditing ? (
                          <select
                            value={privateInfo.gender}
                            onChange={(e) => setPrivateInfo({ ...privateInfo, gender: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <p className="font-medium">{privateInfo.gender || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Marital Status</label>
                        {isEditing ? (
                          <select
                            value={privateInfo.maritalStatus}
                            onChange={(e) => setPrivateInfo({ ...privateInfo, maritalStatus: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <option value="">Select status</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        ) : (
                          <p className="font-medium">{privateInfo.maritalStatus || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Date of Joining</label>
                        <p className="font-medium">{profileData.dateOfJoining || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground block mb-2">Residing Address</label>
                        {isEditing ? (
                          <Textarea value={privateInfo.address} onChange={(e) => setPrivateInfo({ ...privateInfo, address: e.target.value })} placeholder="Enter address" rows={3} />
                        ) : (
                          <p className="font-medium">{privateInfo.address || '-'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right column: Bank Details */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground block mb-2">Bank Name</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} placeholder="Enter bank name" />
                        ) : (
                          <p className="font-medium">{bankInfo.bankName || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Account Number</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} placeholder="Enter account number" />
                        ) : (
                          <p className="font-medium">{bankInfo.accountNumber || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">IFSC Code</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.ifscCode} onChange={(e) => setBankInfo({ ...bankInfo, ifscCode: e.target.value })} placeholder="Enter IFSC code" />
                        ) : (
                          <p className="font-medium">{bankInfo.ifscCode || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">PAN No</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.pan} onChange={(e) => setBankInfo({ ...bankInfo, pan: e.target.value })} placeholder="Enter PAN" />
                        ) : (
                          <p className="font-medium">{bankInfo.pan || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">UAN No</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.uan} onChange={(e) => setBankInfo({ ...bankInfo, uan: e.target.value })} placeholder="Enter UAN" />
                        ) : (
                          <p className="font-medium">{bankInfo.uan || '-'}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-muted-foreground block mb-2">Employee Code</label>
                        {isEditing ? (
                          <Input type="text" value={bankInfo.employeeCode} onChange={(e) => setBankInfo({ ...bankInfo, employeeCode: e.target.value })} placeholder="Enter Employee Code" />
                        ) : (
                          <p className="font-medium">{bankInfo.employeeCode || '-'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'salary' && isAdminOrPayroll && (
              <div className="space-y-6">
                {/* Basic Wage Information */}
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Month Wage</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={salaryData.monthWage}
                            onChange={(e) => setSalaryData({ ...salaryData, monthWage: parseFloat(e.target.value) })}
                            className="flex-1"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-muted-foreground">/ Month</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">No of working days in a week:</label>
                        <Input
                          type="number"
                          value={salaryData.workingDaysPerWeek}
                          onChange={(e) => setSalaryData({ ...salaryData, workingDaysPerWeek: parseInt(e.target.value) })}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Yearly wage</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={salaryData.yearlyWage}
                            onChange={(e) => setSalaryData({ ...salaryData, yearlyWage: parseFloat(e.target.value) })}
                            className="flex-1"
                            disabled={!isEditing}
                          />
                          <span className="text-sm text-muted-foreground">/ Yearly</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Break Time:</label>
                        <Input
                          type="text"
                          value={salaryData.breakTime}
                          onChange={(e) => setSalaryData({ ...salaryData, breakTime: e.target.value })}
                          disabled={!isEditing}
                        />
                        <span className="text-xs text-muted-foreground">/hrs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salary Components */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Salary Components</h3>
                    <div className="space-y-4">
                      {salaryData.components.map((component, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{component.name}</h4>
                            <div className="flex items-center gap-4">
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) => {
                                  const newComponents = [...salaryData.components]
                                  newComponents[index].amount = parseFloat(e.target.value)
                                  setSalaryData({ ...salaryData, components: newComponents })
                                }}
                                className="w-32"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">₹ / month</span>
                              <Input
                                type="number"
                                value={component.percentage}
                                onChange={(e) => {
                                  const newComponents = [...salaryData.components]
                                  newComponents[index].percentage = parseFloat(e.target.value)
                                  setSalaryData({ ...salaryData, components: newComponents })
                                }}
                                className="w-24"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{component.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Provident Fund (PF) Contribution */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Provident Fund (PF) Contribution</h3>
                    <div className="space-y-4">
                      {salaryData.pfContributions.map((pf, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{pf.name}</h4>
                            <div className="flex items-center gap-4">
                              <Input
                                type="number"
                                value={pf.amount}
                                onChange={(e) => {
                                  const newPF = [...salaryData.pfContributions]
                                  newPF[index].amount = parseFloat(e.target.value)
                                  setSalaryData({ ...salaryData, pfContributions: newPF })
                                }}
                                className="w-32"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">₹ / month</span>
                              <Input
                                type="number"
                                value={pf.percentage}
                                onChange={(e) => {
                                  const newPF = [...salaryData.pfContributions]
                                  newPF[index].percentage = parseFloat(e.target.value)
                                  setSalaryData({ ...salaryData, pfContributions: newPF })
                                }}
                                className="w-24"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">%</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{pf.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Deductions */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tax Deductions</h3>
                    <div className="space-y-4">
                      {salaryData.taxDeductions.map((tax, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{tax.name}</h4>
                            <div className="flex items-center gap-4">
                              <Input
                                type="number"
                                value={tax.amount}
                                onChange={(e) => {
                                  const newTax = [...salaryData.taxDeductions]
                                  newTax[index].amount = parseFloat(e.target.value)
                                  setSalaryData({ ...salaryData, taxDeductions: newTax })
                                }}
                                className="w-32"
                                disabled={!isEditing}
                              />
                              <span className="text-sm text-muted-foreground">₹ / month</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{tax.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'salary' && !isAdminOrPayroll && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Salary Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Salary information is confidential and managed by the payroll department.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Password Management */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Password Management</h3>
                    <div className="space-y-4">
                      <Button
                        onClick={() => setShowPasswordModal(true)}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Change Password
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Update your password to keep your account secure.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Face Recognition */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Camera size={20} />
                      Facial Recognition
                    </h3>
                    
                    {faceEnrollment ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="font-semibold">Face Enrolled</span>
                        </div>
                        
                        <div className="flex gap-4 items-start">
                          <img 
                            src={faceEnrollment.face_photo_url} 
                            alt="Enrolled face" 
                            className="w-32 h-32 rounded-lg object-cover border-2 border-green-500"
                          />
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Your face has been enrolled successfully. You can now use facial recognition for quick check-in.
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Enrolled: {new Date(faceEnrollment.enrolled_at).toLocaleDateString()}</p>
                              {faceEnrollment.quality_score && (
                                <p>Quality: {(faceEnrollment.quality_score * 100).toFixed(0)}%</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => setShowFaceEnrollment(true)}
                            variant="outline"
                            size="sm"
                          >
                            <Camera size={16} className="mr-2" />
                            Update Face
                          </Button>
                          <Button 
                            onClick={handleDeleteFaceEnrollment}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Enable quick and secure check-in by enrolling your face. This is a one-time setup that takes less than a minute.
                        </p>
                        
                        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-sm">✨ Benefits:</h4>
                          <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                            <li>Lightning-fast check-in (2-3 seconds)</li>
                            <li>No need to remember login credentials</li>
                            <li>Secure and privacy-friendly</li>
                            <li>Works from any device with a camera</li>
                          </ul>
                        </div>
                        
                        <Button 
                          onClick={() => setShowFaceEnrollment(true)}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Camera className="mr-2" size={16} />
                          Enroll Face Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Skills & Certifications (Only in Resume Tab) */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Skills</h3>
                  <div className="space-y-3">
                    {skills.map((s, index) => (
                      <div key={s.id || index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{s.skill}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveSkill(index)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="Add new skill"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                        />
                        <Button
                          onClick={handleAddSkill}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Certification</h3>
                  <div className="space-y-3">
                    {certifications.map((c, index) => (
                      <div key={c.id || index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{c.title}</span>
                        {isEditing && (
                          <button
                            onClick={() => handleRemoveCertification(index)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {isEditing && (
                      <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="Add certification"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddCertification()}
                        />
                        <Button
                          onClick={handleAddCertification}
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Edit/Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              if (isEditing) {
                handleSaveChanges()
              } else {
                setIsEditing(true)
              }
            }}
            disabled={isSaving}
            className={(isEditing ? 'bg-green-600 hover:bg-green-700 ' : 'bg-blue-600 hover:bg-blue-700 ') + (isSaving ? 'opacity-70 cursor-not-allowed' : '')}
          >
            {isEditing ? (isSaving ? 'Saving…' : 'Save Changes') : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Password Management Modal */}
      <PasswordManagementModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        loginId={profileData.loginId || ''}
      />

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={showFaceEnrollment}
        onClose={() => setShowFaceEnrollment(false)}
        onEnrollSuccess={loadFaceEnrollment}
        existingEnrollment={faceEnrollment}
      />
    </>
  )
}
