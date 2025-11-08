import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Edit, Plus } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import PasswordManagementModal from '@/components/modals/PasswordManagementModal'
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus'

export default function ProfilePage() {
  const { currentUser } = useSelector((state) => state.user)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('resume')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const currentUserStatus = useEmployeeStatus(currentUser?.id)

  const isAdminOrPayroll = ['admin', 'payroll officer'].includes(
    (currentUser?.user?.role || currentUser?.role || '').toLowerCase()
  )

  const [profileData, setProfileData] = useState({
    name: currentUser?.first_name && currentUser?.last_name 
      ? `${currentUser.first_name} ${currentUser.last_name}` 
      : 'My Name',
    loginId: currentUser?.user?.login_id || 'LOGIN123',
    email: currentUser?.email || 'user@hrx.com',
    mobile: currentUser?.phone || '+1 234-567-8900',
    company: 'HRX',
    department: currentUser?.department?.name || 'Department',
    manager: 'Manager Name',
    location: currentUser?.location || 'Location',
    about: currentUser?.about_job || 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    whatILove: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    interests: currentUser?.interests || 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    hobbies: currentUser?.hobbies || 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    certifications: ['AWS Certified', 'Google Cloud Certified']
  })

  const [newSkill, setNewSkill] = useState('')
  const [newCertification, setNewCertification] = useState('')
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Private Info data
  const [privateInfo, setPrivateInfo] = useState({
    dob: currentUser?.dob || '',
    nationality: currentUser?.nationality || '',
    gender: currentUser?.gender || '',
    maritalStatus: currentUser?.marital_status || '',
    address: currentUser?.address || ''
  })

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

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  const handleAddCertification = () => {
    if (newCertification.trim()) {
      setProfileData({
        ...profileData,
        certifications: [...profileData.certifications, newCertification.trim()]
      })
      setNewCertification('')
    }
  }

  const handleRemoveSkill = (index) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter((_, i) => i !== index)
    })
  }

  const handleRemoveCertification = (index) => {
    setProfileData({
      ...profileData,
      certifications: profileData.certifications.filter((_, i) => i !== index)
    })
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

  const handleSaveChanges = () => {
    // Here you would save to backend
    console.log('Saving profile data:', profileData)
    console.log('Saving private info:', privateInfo)
    console.log('Saving salary data:', salaryData)
    setIsEditing(false)
  }

  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isAdminOrPayroll ? [{ id: 'salary', label: 'Salary Info' }] : []),
    { id: 'security', label: 'Security' }
  ]

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
                  <h2 className="text-2xl font-bold mb-4">{profileData.name}</h2>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-muted-foreground">Login ID</label>
                      <p className="font-medium">{profileData.loginId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium">{profileData.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Mobile</label>
                      <p className="font-medium">{profileData.mobile}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Company</label>
                    <p className="font-medium">{profileData.company}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Department</label>
                    <p className="font-medium">{profileData.department}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Manager</label>
                    <p className="font-medium">{profileData.manager}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Location</label>
                    <p className="font-medium">{profileData.location}</p>
                  </div>
                </div>
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
                        {profileData.about}
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
                        {profileData.whatILove}
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
                        {profileData.interests}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'private' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Private Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Date of Birth</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={privateInfo.dob}
                          onChange={(e) => setPrivateInfo({ ...privateInfo, dob: e.target.value })}
                        />
                      ) : (
                        <p className="font-medium">{privateInfo.dob || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Nationality</label>
                      {isEditing ? (
                        <Input
                          type="text"
                          value={privateInfo.nationality}
                          onChange={(e) => setPrivateInfo({ ...privateInfo, nationality: e.target.value })}
                          placeholder="Enter nationality"
                        />
                      ) : (
                        <p className="font-medium">{privateInfo.nationality || 'Not set'}</p>
                      )}
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
                        <p className="font-medium">{privateInfo.gender || 'Not set'}</p>
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
                        <p className="font-medium">{privateInfo.maritalStatus || 'Not set'}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-muted-foreground block mb-2">Address</label>
                      {isEditing ? (
                        <Textarea
                          value={privateInfo.address}
                          onChange={(e) => setPrivateInfo({ ...privateInfo, address: e.target.value })}
                          placeholder="Enter address"
                          rows={3}
                        />
                      ) : (
                        <p className="font-medium">{privateInfo.address || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
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
            )}
          </div>

          {/* Right Column - Skills & Certifications (Only in Resume Tab) */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Skills</h3>
                  <div className="space-y-3">
                    {profileData.skills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{skill}</span>
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
                    {profileData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{cert}</span>
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
            className={isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
          >
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* Password Management Modal */}
      <PasswordManagementModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  )
}
