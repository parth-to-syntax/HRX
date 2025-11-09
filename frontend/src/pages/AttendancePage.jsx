// import { useState, useEffect, useRef } from 'react'
// import { useSelector } from 'react-redux'
// import { ChevronLeft, ChevronRight, Clock, Calendar, Scan } from 'lucide-react'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import { Badge } from '@/components/ui/badge'
// import PageHeader from '@/components/layout/PageHeader'
// import FaceCheckInModal from '@/components/modals/FaceCheckInModal'
// import { checkIn, checkOut, getMyAttendance, listAttendanceByDate, markAbsents } from '@/api/attendance'
// import { getMyEnrollment } from '@/api/face'
// import { listMyAllocations } from '@/api/leaves'
// import toast from 'react-hot-toast'

// export default function AttendancePage() {
// const { currentUser } = useSelector((state) => state.user)
// const [selectedDate, setSelectedDate] = useState(new Date())
// const [searchTerm, setSearchTerm] = useState('')
// const [loading, setLoading] = useState(false)
// const [attendanceData, setAttendanceData] = useState([])
// const [todayStatus, setTodayStatus] = useState(null)
// const [summary, setSummary] = useState({ present_days: 0, leave_days: 0, total_working_days: 0 })
// const [checkingIn, setCheckingIn] = useState(false)
// const [checkingOut, setCheckingOut] = useState(false)
// const [lastClickTime, setLastClickTime] = useState(0)
// const [showDatePicker, setShowDatePicker] = useState(false)
// const [showFaceCheckIn, setShowFaceCheckIn] = useState(false)
// const [faceEnrollment, setFaceEnrollment] = useState(null)
// const [leaveAllocations, setLeaveAllocations] = useState([])
// const datePickerRef = useRef(null)

// // Canonical date strings used across handlers/render
// const selectedDateStr = selectedDate.toISOString().split('T')[0]
// const todayStr = new Date().toISOString().split('T')[0]

// // Debug: Track showFaceCheckIn state changes
// useEffect(() => {
//   console.log('showFaceCheckIn state changed to:', showFaceCheckIn);
// }, [showFaceCheckIn]);

// const isEmployee = currentUser?.role?.toLowerCase() === 'employee'
// const isAdminOrHR = ['admin', 'hr'].includes(currentUser?.role?.toLowerCase())

// // Get current month name
// const currentMonth = selectedDate.toLocaleString('en-US', { month: 'short' })

// // Close date picker when clicking outside
// useEffect(() => {
//   const handleClickOutside = (event) => {
//     if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
//       setShowDatePicker(false)
//     }
//   }
//   document.addEventListener('mousedown', handleClickOutside)
//   return () => document.removeEventListener('mousedown', handleClickOutside)
// }, [])

// // Fetch attendance data when date changes
// useEffect(() => {
//   loadAttendance()
// }, [selectedDate, currentUser])

// // Log todayStatus changes for debugging
// useEffect(() => {
//   console.log('todayStatus updated:', {
//     check_in: todayStatus?.check_in,
//     check_out: todayStatus?.check_out,
//     work_hours: todayStatus?.work_hours,
//     extra_hours: todayStatus?.extra_hours
//   })
// }, [todayStatus])

// // Load face enrollment status
// useEffect(() => {
//   loadFaceEnrollment()
//   if (isEmployee) {
//     loadLeaveAllocations()
//   }
// }, [currentUser])

// const loadFaceEnrollment = async () => {
//   try {
//     const result = await getMyEnrollment()
//     if (result.enrolled) {
//       setFaceEnrollment(result.enrollment)
//     }
//   } catch (error) {
//     console.error('Error loading face enrollment:', error)
//   }
// }

// const loadLeaveAllocations = async () => {
//   try {
//     const allocations = await listMyAllocations()
//     setLeaveAllocations(allocations)
//   } catch (error) {
//     console.error('Error loading leave allocations:', error)
//   }
// }

// const loadAttendance = async () => {
//   // Guard: if user context not ready yet, skip to avoid runtime errors
//   if (!currentUser) return
//   setLoading(true)
//   try {
//     // Use canonical selectedDateStr defined at top
    
//     if (isEmployee) {
//       // For employees: fetch their own attendance
//       const today = new Date().toISOString().split('T')[0]
      
//       // Get first and last day of selected month for summary stats
//       const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0]
//       const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0]
      
//       // Fetch month summary for stats
//       const monthResult = await getMyAttendance({ from: firstDayOfMonth, to: lastDayOfMonth })
//       setSummary(monthResult.summary || { present_days: 0, leave_days: 0, total_working_days: 0 })
      
//       // Reload leave allocations when month changes
//       await loadLeaveAllocations()
      
//       // Fetch SELECTED date's attendance for both table AND check-in/out buttons
//       const selectedDateResult = await getMyAttendance({ from: selectedDateStr, to: selectedDateStr })
//       const selectedDateRecord = selectedDateResult.days?.[0]
      
//       // Set both the table data and button status from the same query
//       setAttendanceData(selectedDateResult.days || [])
//       setTodayStatus(selectedDateRecord || null)
//     } else if (isAdminOrHR) {
//       // For admin/hr: fetch all employees' attendance for selected date
//       const result = await listAttendanceByDate({ date: selectedDateStr, page: 1, pageSize: 100 })
//       setAttendanceData(result.items || [])
      
//       // Calculate summary
//       const present = result.items.filter(r => r.status === 'present').length
//       const leave = result.items.filter(r => r.status === 'leave').length
//       setSummary({ 
//         present_days: present, 
//         leave_days: leave, 
//         total_working_days: present + leave 
//       })
//     }
//   } catch (err) {
//     console.error('Attendance load error:', err)
//     toast.error(err?.response?.data?.error || err?.message || 'Failed to load attendance')
//   } finally {
//     setLoading(false)
//   }
// }

// // Handle attendance toggle (check-in or check-out)
// const handleAttendanceToggle = async () => {
//   const now = Date.now()
  
//   // Prevent rapid clicking (debounce)
//   if (now - lastClickTime < 2000) {
//     console.log('⏳ Too soon after last click, ignoring')
//     return
//   }
  
//   // Prevent multiple clicks during processing
//   if (checkingIn || checkingOut || loading) {
//     console.log('⏳ Already processing, ignoring click')
//     return
//   }

//   setLastClickTime(now)
  
//   const isCurrentlyCheckedIn = Boolean(todayStatus?.check_in && !todayStatus?.check_out)
  
//   console.log('🔄 Button clicked - Current state:', {
//     todayStatus,
//     isCurrentlyCheckedIn,
//     check_in: todayStatus?.check_in,
//     check_out: todayStatus?.check_out,
//     selectedDateStr,
//     time: new Date().toLocaleTimeString()
//   })
  
//   if (isCurrentlyCheckedIn) {
//     // User is checked in, so check them out
//     console.log('� === CHECK-OUT STARTED ===')
//     setCheckingOut(true)
//     try {
//       const result = await checkOut(selectedDateStr)
//       console.log('✅ Check-out API result:', result)
      
//       toast.success('Checked out successfully')
      
//       // Reload attendance data to ensure consistency
//       await loadAttendance()
//       console.log('� === CHECK-OUT COMPLETED ===')
//     } catch (err) {
//       console.error('❌ Check-out error:', err)
//       toast.error(err.response?.data?.error || 'Failed to check out')
//     } finally {
//       setCheckingOut(false)
//     }
//   } else {
//     // User is not checked in, so check them in
//     console.log('� === CHECK-IN STARTED ===')
//     setCheckingIn(true)
//     try {
//       const result = await checkIn(selectedDateStr)
//       console.log('✅ Check-in API result:', result)
      
//       toast.success('Checked in successfully')
      
//       // Reload attendance data to ensure consistency
//       await loadAttendance()
//       console.log('� === CHECK-IN COMPLETED ===')
//     } catch (err) {
//       console.error('❌ Check-in error:', err)
//       toast.error(err.response?.data?.error || 'Failed to check in')
//     } finally {
//       setCheckingIn(false)
//     }
//   }
// }

// // Format time from ISO string
// const formatTime = (isoString) => {
//   if (!isoString) return '-'
//   const date = new Date(isoString)
//   return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
// }

// // Format date for display
// const formatDate = (date) => {
//   const day = date.getDate()
//   const month = date.toLocaleString('en-US', { month: 'long' })
//   const year = date.getFullYear()
//   return `${day},${month} ${year}`
// }

// // Navigate date
// const handlePrevDate = () => {
//   const newDate = new Date(selectedDate)
//   newDate.setDate(newDate.getDate() - 1)
//   setSelectedDate(newDate)
// }

// const handleNextDate = () => {
//   const newDate = new Date(selectedDate)
//   newDate.setDate(newDate.getDate() + 1)
//   setSelectedDate(newDate)
// }

// const handleDateSelect = (dateString) => {
//   setSelectedDate(new Date(dateString))
//   setShowDatePicker(false)
// }

// // Check if selected date is a weekday (Mon-Fri)
// const selectedDayOfWeek = selectedDate.getDay()
// const isWeekday = selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5

// // Check if employee has approved leave for selected date
// const hasLeave = todayStatus?.status === 'leave'

// // Can check in/out for any weekday (past, present, or future), but NOT if on approved leave
// const canCheckIn = isWeekday && !todayStatus?.check_in && !hasLeave
// const canCheckOut = isWeekday && todayStatus?.check_in && !todayStatus?.check_out && !hasLeave

// // Determine if button should show "Check Out" (user is already checked in)
// const isCheckedIn = Boolean(todayStatus?.check_in && !todayStatus?.check_out)

// // Filter data for admin view
// const filteredData = isEmployee ? attendanceData : attendanceData.filter(emp => {
//   const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase()
//   return name.includes(searchTerm.toLowerCase())
// })

// // Employee View - New Design
// if (isEmployee) {
//   // Determine user status for header based on today's attendance
//   const isToday = selectedDateStr === todayStr
//   let userStatus = null
  
//   if (isToday && todayStatus) {
//     if (todayStatus.status === 'leave') {
//       userStatus = 'on-leave'
//     } else if (todayStatus.check_in && todayStatus.check_out) {
//       userStatus = 'checked-out'
//     } else if (todayStatus.check_in) {
//       userStatus = 'checked-in'
//     }
//   }
  
//   return (
//     <>
//       <PageHeader
//         searchTerm={searchTerm}
//         onSearchChange={setSearchTerm}
//         showNewButton={false}
//         userStatus={userStatus}
//       />

//       <div className="p-8">
//         {/* Check In/Out Section */}
//         <Card className="mb-6">
//           <CardHeader>
//             <CardTitle>Mark Attendance - {formatDate(selectedDate)}</CardTitle>
//             {!isWeekday && (
//               <p className="text-sm text-muted-foreground text-red-500 mt-2">
//                 ⚠️ Weekends (Saturday/Sunday) are not working days
//               </p>
//             )}
//             {hasLeave && isWeekday && (
//               <p className="text-sm text-blue-600 mt-2">
//                 ℹ️ You have approved leave for this date
//               </p>
//             )}
//           </CardHeader>
//           <CardContent>
//             <div className="flex gap-4 items-center flex-wrap">
//               {/* Single Toggle Button for Check In/Out */}
//               <Button 
//                 onClick={handleAttendanceToggle}
//                 disabled={(!canCheckIn && !canCheckOut) || checkingIn || checkingOut || loading}
//                 className="flex items-center gap-2 min-w-[120px]"
//                 variant={isCheckedIn ? "outline" : "default"}
//               >
//                 <Clock size={18} />
//                 {checkingIn ? 'Checking In...' : 
//                   checkingOut ? 'Checking Out...' : 
//                   loading ? 'Loading...' :
//                   isCheckedIn ? 'Check Out' : 'Check In'}
//               </Button>

//               {/* Face Check-In Button (only show if enrolled and can check in) */}
//               {faceEnrollment && isEmployee && canCheckIn && (
//                 <Button
//                   onClick={() => setShowFaceCheckIn(true)}
//                   disabled={checkingIn}
//                   className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
//                 >
//                   <Scan size={18} />
//                   Face Check-In
//                 </Button>
//               )}
              
//               {/* Display Times and Work Hours */}
//               {todayStatus && isWeekday && (
//                 <div className="ml-auto flex gap-6 items-center">
//                   {hasLeave ? (
//                     <Badge variant="default" className="text-sm">On Leave</Badge>
//                   ) : (
//                     <>
//                       {todayStatus.check_in && (
//                         <div className="text-center">
//                           <p className="text-xs text-muted-foreground">Check In</p>
//                           <p className="text-lg font-semibold">{formatTime(todayStatus.check_in)}</p>
//                         </div>
//                       )}
//                       {todayStatus.check_out && (
//                         <div className="text-center">
//                           <p className="text-xs text-muted-foreground">Check Out</p>
//                           <p className="text-lg font-semibold">{formatTime(todayStatus.check_out)}</p>
//                         </div>
//                       )}
//                       {todayStatus.work_hours && (
//                         <div className="text-center">
//                           <p className="text-xs text-muted-foreground">Work Hours</p>
//                           <p className="text-lg font-semibold text-green-600">{Number(todayStatus.work_hours).toFixed(2)} hrs</p>
//                         </div>
//                       )}
//                       {todayStatus.extra_hours && Number(todayStatus.extra_hours) > 0 && (
//                         <div className="text-center">
//                           <p className="text-xs text-muted-foreground">Overtime</p>
//                           <p className="text-lg font-semibold text-blue-600">+{Number(todayStatus.extra_hours).toFixed(2)} hrs</p>
//                         </div>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-2">
//           <CardContent className="p-0">
//             {/* Top Controls */}
//             <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handlePrevDate}
//                 className="h-10 w-16"
//               >
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
              
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={handleNextDate}
//                 className="h-10 w-16"
//               >
//                 <ChevronRight className="h-4 w-4" />
//               </Button>

//               <div className="relative" ref={datePickerRef}>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   className="h-10 px-4 font-medium"
//                   onClick={() => setShowDatePicker(!showDatePicker)}
//                 >
//                   <Calendar className="h-4 w-4 mr-2" />
//                   {currentMonth} ∨
//                 </Button>

//                 {showDatePicker && (
//                   <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
//                     <input
//                       type="date"
//                       value={selectedDateStr}
//                       onChange={(e) => handleDateSelect(e.target.value)}
//                       className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div className="ml-4 flex gap-4">
//                 <div className="px-4 py-2 bg-muted rounded-md">
//                   <p className="text-xs text-muted-foreground">Count of days present</p>
//                   <p className="text-lg font-semibold">{summary.present_days}</p>
//                 </div>
//                 <div className="px-4 py-2 bg-muted rounded-md">
//                   <p className="text-xs text-muted-foreground">Leaves count</p>
//                   <p className="text-lg font-semibold">{summary.leave_days}</p>
//                 </div>
//                 <div className="px-4 py-2 bg-muted rounded-md">
//                   <p className="text-xs text-muted-foreground">Total working days</p>
//                   <p className="text-lg font-semibold">{summary.total_working_days}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Leave Allocations Section */}
//             {isEmployee && leaveAllocations.length > 0 && (
//               <div className="p-8 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 border-b border-gray-700">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg">
//                     <Calendar className="w-5 h-5 text-white" />
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-100">Leave Balance Overview</h3>
//                 </div>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {leaveAllocations.map((allocation, idx) => {
//                     const total = allocation.allocated_days || 0
//                     const used = allocation.used_days || 0
//                     const available = total - used
//                     const percentageAvailable = total > 0 ? ((available / total) * 100) : 0
                    
//                     return (
//                       <div key={idx} className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-5 hover:shadow-purple-500/20 hover:shadow-2xl hover:scale-105 hover:border-purple-500/30 transition-all duration-300">
//                         <div className="flex items-center justify-between mb-4">
//                           <h4 className="text-purple-400 font-bold text-base">{allocation.leave_type || 'Unknown'}</h4>
//                           <div className="px-3 py-1 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full border border-gray-600">
//                             <span className="text-xs font-medium text-gray-300">{total} total</span>
//                           </div>
//                         </div>
                        
//                         <div className="text-center mb-4">
//                           <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text mb-1">
//                             {available}
//                           </div>
//                           <p className="text-xs text-gray-400 font-medium">Days Available</p>
//                         </div>
                        
//                         <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
//                           <span className="px-2 py-1 bg-gray-700/70 rounded-md border border-gray-600">Used: {used}</span>
//                           <span className="px-2 py-1 bg-gray-700/70 rounded-md border border-gray-600">Remaining: {available}</span>
//                         </div>
                        
//                         <div className="space-y-2">
//                           <div className="flex justify-between text-xs font-medium text-gray-300">
//                             <span>Progress</span>
//                             <span>{percentageAvailable.toFixed(0)}% available</span>
//                           </div>
//                           <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden border border-gray-600">
//                             <div 
//                               className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30" 
//                               style={{ width: `${percentageAvailable}%` }}
//                             ></div>
//                           </div>
//                         </div>
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* Date Display */}
//             <div className="p-4 bg-background">
//               <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
//             </div>

//             {/* Attendance Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b bg-muted/50">
//                     <th className="text-left p-4 font-semibold text-sm">Date</th>
//                     <th className="text-left p-4 font-semibold text-sm">Status</th>
//                     <th className="text-left p-4 font-semibold text-sm">Check In</th>
//                     <th className="text-left p-4 font-semibold text-sm">Check Out</th>
//                     <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
//                     <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading ? (
//                     <tr>
//                       <td colSpan={6} className="text-center p-8 text-muted-foreground">
//                         Loading...
//                       </td>
//                     </tr>
//                   ) : filteredData.length === 0 ? (
//                     <tr>
//                       <td colSpan={6} className="text-center p-8 text-muted-foreground">
//                         No attendance records for this date
//                       </td>
//                     </tr>
//                   ) : (
//                     filteredData.map((record, idx) => (
//                       <tr key={record.attendance_id || idx} className="border-b hover:bg-muted/30">
//                         <td className="p-4 text-sm">
//                           {selectedDateStr}
//                         </td>
//                         <td className="p-4 text-sm">
//                           <Badge variant={
//                             record.status === 'present' ? 'success' : 
//                             record.status === 'leave' ? 'default' : 
//                             'destructive'
//                           }>
//                             {record.status === 'present' ? 'Present' : 
//                               record.status === 'leave' ? 'On Leave' : 
//                               'Absent'}
//                           </Badge>
//                         </td>
//                         <td className="p-4 text-sm">{record.status === 'leave' ? '-' : formatTime(record.check_in)}</td>
//                         <td className="p-4 text-sm">{record.status === 'leave' ? '-' : formatTime(record.check_out)}</td>
//                         <td className="p-4 text-sm">{record.status === 'leave' ? '-' : (record.work_hours ? Number(record.work_hours).toFixed(2) : '-')}</td>
//                         <td className="p-4 text-sm">{record.status === 'leave' ? '-' : (record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00')}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Face Check-In Modal */}
//       <FaceCheckInModal
//         isOpen={showFaceCheckIn}
//         onClose={() => setShowFaceCheckIn(false)}
//         onCheckInSuccess={(attendance) => {
//           setTodayStatus(attendance);
//           loadAttendance();
//           setShowFaceCheckIn(false);
//         }}
//         enrolledFaceUrl={faceEnrollment?.face_photo_url}
//         selectedDate={selectedDate}
//       />
//     </>
//   )
// }

// // Admin/Manager View - Traditional Design
// return (
//   <>
//     <PageHeader
//       searchTerm={searchTerm}
//       onSearchChange={setSearchTerm}
//       showNewButton={false}
//     />
//     <div className="p-8">
//       <Card className="border-2">
//         <CardContent className="p-0">
//           {/* Top Controls */}
//           <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={handlePrevDate}
//               className="h-10 w-16"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </Button>
            
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={handleNextDate}
//               className="h-10 w-16"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </Button>

//             <div className="relative" ref={datePickerRef}>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 className="h-10 px-4 font-medium"
//                 onClick={() => setShowDatePicker(!showDatePicker)}
//               >
//                 <Calendar className="h-4 w-4 mr-2" />
//                 {currentMonth} ∨
//               </Button>

//               {showDatePicker && (
//                 <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
//                   <input
//                     type="date"
//                     value={selectedDateStr}
//                     onChange={(e) => handleDateSelect(e.target.value)}
//                     className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
//                   />
//                 </div>
//               )}
//             </div>

//             <div className="ml-4 flex gap-4">
//               <div className="px-4 py-2 bg-muted rounded-md">
//                 <p className="text-xs text-muted-foreground">Count of days present</p>
//                 <p className="text-lg font-semibold">{summary.present_days}</p>
//               </div>
//               <div className="px-4 py-2 bg-muted rounded-md">
//                 <p className="text-xs text-muted-foreground">Leaves count</p>
//                 <p className="text-lg font-semibold">{summary.leave_days}</p>
//               </div>
//               <div className="px-4 py-2 bg-muted rounded-md">
//                 <p className="text-xs text-muted-foreground">Total working days</p>
//                 <p className="text-lg font-semibold">{summary.total_working_days}</p>
//               </div>
//             </div>
//           </div>

//           {/* Date Display */}
//           <div className="p-4 bg-background">
//             <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
//           </div>

//           {/* Attendance Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b bg-muted/50">
//                   <th className="text-left p-4 font-semibold text-sm">Employee</th>
//                   <th className="text-left p-4 font-semibold text-sm">Check In</th>
//                   <th className="text-left p-4 font-semibold text-sm">Check Out</th>
//                   <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
//                   <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
//                   <th className="text-left p-4 font-semibold text-sm">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan={6} className="text-center p-8 text-muted-foreground">
//                       Loading...
//                     </td>
//                   </tr>
//                 ) : filteredData.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="text-center p-8 text-muted-foreground">
//                       No employees found
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredData.map((record) => (
//                     <tr key={record.employee_id} className="border-b hover:bg-muted/30">
//                       <td className="p-4 text-sm font-medium">
//                         {`${record.first_name || ''} ${record.last_name || ''}`.trim() || '[Employee]'}
//                       </td>
//                       <td className="p-4 text-sm">{formatTime(record.check_in)}</td>
//                       <td className="p-4 text-sm">{formatTime(record.check_out)}</td>
//                       <td className="p-4 text-sm">{record.work_hours ? Number(record.work_hours).toFixed(2) : '-'}</td>
//                       <td className="p-4 text-sm">{record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00'}</td>
//                       <td className="p-4 text-sm">
//                         <Badge variant={record.status === 'present' ? 'success' : record.status === 'leave' ? 'default' : 'destructive'}>
//                           {record.status || 'Absent'}
//                         </Badge>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </CardContent>
//       </Card>
//     </div>

//     {/* Face Check-In Modal */}
//     {(() => {
//       console.log('=== MODAL RENDER CHECK ===', {
//         showFaceCheckIn,
//         type: typeof showFaceCheckIn,
//         strictEqual: showFaceCheckIn === true
//       });
//       return null;
//     })()}
    
//     {showFaceCheckIn === true && (
//       <FaceCheckInModal
//         isOpen={true}
//         onClose={() => {
//           console.log('Modal close clicked');
//           setShowFaceCheckIn(false);
//         }}
//         onCheckInSuccess={(attendance) => {
//           console.log('Check-in success callback');
//           setTodayStatus(attendance);
//           loadAttendance();
//           setShowFaceCheckIn(false);
//         }}
//         enrolledFaceUrl={faceEnrollment?.face_photo_url}
//         selectedDate={selectedDate}
//       />
//     )}
//   </>
// )
// }

import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ChevronLeft, ChevronRight, Clock, Calendar, Scan, Users, UserCheck, UserX, Plane } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/layout/PageHeader'
import FaceCheckInModal from '@/components/modals/FaceCheckInModal'
import { checkIn, checkOut, getMyAttendance, listAttendanceByDate, markAbsents } from '@/api/attendance'
import { getMyEnrollment } from '@/api/face'
import { listMyAllocations } from '@/api/leaves'
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus'
import { updateEmployeeStatus } from '@/redux/slices/attendanceSlice'
import { updateEmployee } from '@/redux/slices/employeesSlice'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const dispatch = useDispatch()
  const { currentUser } = useSelector((state) => state.user)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [attendanceData, setAttendanceData] = useState([])
  const [todayStatus, setTodayStatus] = useState(null)
  const [summary, setSummary] = useState({ present_days: 0, leave_days: 0, total_working_days: 0 })
  // Holds all days for the selected month (employee view) to compute dynamic counts
  const [monthDays, setMonthDays] = useState([])
  // Use the standardized employee status hook for consistent status across all modules
  const baseHeaderStatus = useEmployeeStatus(currentUser?.id)
  // Local status override for immediate UI feedback after check-in/out
  const [localStatusOverride, setLocalStatusOverride] = useState(null)
  // Use local override if available, otherwise use hook status
  const headerStatus = localStatusOverride || baseHeaderStatus
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFaceCheckIn, setShowFaceCheckIn] = useState(false)
  const [faceEnrollment, setFaceEnrollment] = useState(null)
  const [leaveAllocations, setLeaveAllocations] = useState([])
  const datePickerRef = useRef(null)

  // Debug: Track showFaceCheckIn state changes
  useEffect(() => {
    console.log('showFaceCheckIn state changed to:', showFaceCheckIn);
  }, [showFaceCheckIn]);

  const isEmployee = currentUser?.role?.toLowerCase() === 'employee'
  const isAdminOrHR = ['admin', 'hr', 'payroll'].includes(currentUser?.role?.toLowerCase())

  // Get current month name
  const currentMonth = selectedDate.toLocaleString('en-US', { month: 'short' })

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch attendance data when date changes
  useEffect(() => {
    loadAttendance()
  }, [selectedDate, currentUser])

  // Load face enrollment status
  useEffect(() => {
    loadFaceEnrollment()
    if (isEmployee) {
      loadLeaveAllocations()
    }
  }, [currentUser, isEmployee])

  const loadFaceEnrollment = async () => {
    try {
      const result = await getMyEnrollment()
      if (result.enrolled) {
        setFaceEnrollment(result.enrollment)
      }
    } catch (error) {
      console.error('Error loading face enrollment:', error)
    }
  }

  const loadLeaveAllocations = async () => {
    try {
      const allocations = await listMyAllocations()
      setLeaveAllocations(allocations)
    } catch (error) {
      console.error('Error loading leave allocations:', error)
    }
  }

  // Helper function to count total weekdays in a month
  const countWeekdaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    let count = 0
    
    for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
      const dayOfWeek = day.getDay()
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
        count++
      }
    }
    
    return count
  }

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0]
      
      if (isEmployee) {
        // For employees: fetch their own attendance
        const today = new Date().toISOString().split('T')[0]
        
        // Get first and last day of selected month for summary stats
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString().split('T')[0]
        const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).toISOString().split('T')[0]
        
        // Fetch month summary for stats
        const monthResult = await getMyAttendance({ from: firstDayOfMonth, to: lastDayOfMonth })
        // Save month days so counts remain dynamic (present/leaves)
        setMonthDays(monthResult.days || [])
        // Fallback to API-provided summary if available; will be recalculated by effect as well
        if (monthResult.summary) {
          setSummary(monthResult.summary)
        } else {
          setSummary({ present_days: 0, leave_days: 0, total_working_days: 0 })
        }
        
        // Fetch SELECTED date's attendance for both table AND check-in/out buttons
        const selectedDateResult = await getMyAttendance({ from: selectedDateStr, to: selectedDateStr })
        console.log('Selected date result from API:', selectedDateResult)
        const selectedDateRecord = selectedDateResult.days?.[0]
        console.log('Selected date attendance record:', selectedDateRecord)
        
        // Set both the table data and button status from the same query
        setAttendanceData(selectedDateResult.days || [])
        setTodayStatus(selectedDateRecord || null)
        
        // Reload leave allocations to ensure counts are up-to-date
        await loadLeaveAllocations()
      } else if (isAdminOrHR) {
        // For admin/hr: fetch all employees' attendance for selected date
        const result = await listAttendanceByDate({ date: selectedDateStr, page: 1, pageSize: 100 })
        setAttendanceData(result.items || [])
        
        // Calculate summary
        const present = result.items.filter(r => r.status === 'present').length
        const leave = result.items.filter(r => r.status === 'leave').length
        setSummary({ 
          present_days: present, 
          leave_days: leave, 
          total_working_days: present + leave 
        })
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  // Keep counts dynamic:
  // - Employee: compute from monthDays (entire selected month)
  // - Admin/HR: compute from filteredData (respects search and date)
  useEffect(() => {
    if (isEmployee) {
      // Filter to only weekdays (Mon-Fri) before counting
      const weekdaysOnly = (monthDays || []).filter(d => {
        const date = new Date(d.date)
        const dayOfWeek = date.getDay()
        return dayOfWeek >= 1 && dayOfWeek <= 5 // Monday=1 to Friday=5
      })
      
      const present = weekdaysOnly.filter(d => d.status === 'present').length
      const leave = weekdaysOnly.filter(d => d.status === 'leave').length
      
      // Calculate total weekdays in the selected month (not just days with records)
      const totalWeekdays = countWeekdaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth())
      
      setSummary({
        present_days: present,
        leave_days: leave,
        total_working_days: totalWeekdays,
      })
    }
    // For admin/HR we recompute below in another effect using filteredData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDays, isEmployee, selectedDate])

  // Handle check-in
  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      const result = await checkIn(selectedDateStr)
      console.log('Check-in result:', result)
      toast.success('Checked in successfully')
      setTodayStatus(result)
      // Immediately update header status for instant UI feedback
      setLocalStatusOverride('checked-in')
      // Dispatch to Redux for global real-time status update
      console.log('Dispatching Redux update for employee:', currentUser?.id, currentUser)
      if (currentUser?.id) {
        dispatch(updateEmployeeStatus({
          employeeId: currentUser.id,
          status: 'present',
          check_in: result.check_in,
          date: selectedDateStr,
          lastUpdated: new Date().toISOString()
        }))
        
        // SIMPLE FIX: Update employee directly in employees list
        dispatch(updateEmployee({
          id: currentUser.id,
          attendance_status: 'present',
          attendance: {
            status: 'present',
            check_in: result.check_in,
            date: selectedDateStr
          }
        }))
        
        console.log('Redux status dispatched:', {
          employeeId: currentUser.id,
          status: 'present',
          check_in: result.check_in,
          date: selectedDateStr
        })
      }
      loadAttendance()
      // Clear override after 5 minutes to let hook take over with fresh data
      setTimeout(() => setLocalStatusOverride(null), 5 * 60 * 1000) // 5 minutes
    } catch (err) {
      console.error('Check-in error:', err)
      toast.error(err.response?.data?.error || 'Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  // Handle check-out
  const handleCheckOut = async () => {
    setCheckingOut(true)
    try {
      const result = await checkOut(selectedDateStr)
      console.log('Check-out result:', result)
      toast.success('Checked out successfully')
      setTodayStatus(result)
      // Immediately update header status for instant UI feedback
      setLocalStatusOverride('checked-out')
      // Dispatch to Redux for global real-time status update
      if (currentUser?.id) {
        dispatch(updateEmployeeStatus({
          employeeId: currentUser.id,
          status: 'present',
          check_in: result.check_in,
          check_out: result.check_out,
          work_hours: result.work_hours,
          date: selectedDateStr,
          lastUpdated: new Date().toISOString()
        }))
        
        // SIMPLE FIX: Update employee directly in employees list
        dispatch(updateEmployee({
          id: currentUser.id,
          attendance_status: 'present',
          attendance: {
            status: 'present',
            check_in: result.check_in,
            check_out: result.check_out,
            work_hours: result.work_hours,
            date: selectedDateStr
          }
        }))
      }
      loadAttendance()
      // Clear override after 5 minutes to let hook take over with fresh data
      setTimeout(() => setLocalStatusOverride(null), 5 * 60 * 1000) // 5 minutes
    } catch (err) {
      console.error('Check-out error:', err)
      toast.error(err.response?.data?.error || 'Failed to check out')
    } finally {
      setCheckingOut(false)
    }
  }

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Format date for display
  const formatDate = (date) => {
    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()
    return `${day},${month} ${year}`
  }

  // Navigate date
  const handlePrevDate = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDate = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleDateSelect = (dateString) => {
    setSelectedDate(new Date(dateString))
    setShowDatePicker(false)
  }

  const selectedDateStr = selectedDate.toISOString().split('T')[0]
  const todayStr = new Date().toISOString().split('T')[0]
  
  // Check if selected date is a weekday (Mon-Fri)
  const selectedDayOfWeek = selectedDate.getDay()
  const isWeekday = selectedDayOfWeek >= 1 && selectedDayOfWeek <= 5
  
  // Check if employee has approved leave for selected date
  const hasLeave = todayStatus?.status === 'leave'
  
  // Can check in/out for any weekday (past, present, or future), but NOT if on approved leave
  const canCheckIn = isWeekday && !todayStatus?.check_in && !hasLeave
  const canCheckOut = isWeekday && todayStatus?.check_in && !todayStatus?.check_out && !hasLeave

  console.log('Button states:', {
    selectedDateStr,
    todayStr,
    selectedDayOfWeek,
    isWeekday,
    hasLeave,
    todayStatus,
    canCheckIn,
    canCheckOut
  })

  // Filter data for admin view
  const filteredData = isEmployee ? attendanceData : attendanceData.filter(emp => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase()
    return name.includes(searchTerm.toLowerCase())
  })

  // Admin/HR: recompute summary whenever data or search filter changes
  useEffect(() => {
    if (isAdminOrHR) {
      const present = filteredData.filter(r => r.status === 'present').length
      const leave = filteredData.filter(r => r.status === 'leave').length
      setSummary({
        present_days: present,
        leave_days: leave,
        total_working_days: present + leave,
      })
    }
  }, [filteredData, isAdminOrHR])

  // Employee View - New Design
  if (isEmployee) {
    return (
      <>
        <PageHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showNewButton={false}
          userStatus={headerStatus}
        />

        <div className="p-8">
          {/* Check In/Out Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Mark Attendance - {formatDate(selectedDate)}</CardTitle>
              {!isWeekday && (
                <p className="text-sm text-muted-foreground text-red-500 mt-2">
                  ⚠️ Weekends (Saturday/Sunday) are not working days
                </p>
              )}
              {hasLeave && isWeekday && (
                <p className="text-sm text-blue-600 mt-2">
                  ℹ️ You have approved leave for this date
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center flex-wrap">
                <Button 
                  onClick={handleCheckIn}
                  disabled={!canCheckIn || checkingIn}
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  {checkingIn ? 'Checking In...' : 'Check In'}
                </Button>

                {/* Face Check-In Button (only show if enrolled) */}
                {faceEnrollment && isEmployee && (
                  <Button
                    onClick={() => {
                      console.log('Face Check-In button clicked!');
                      console.log('faceEnrollment:', faceEnrollment);
                      console.log('selectedDate:', selectedDate);
                      console.log('BEFORE setShowFaceCheckIn - current value:', showFaceCheckIn);
                      setShowFaceCheckIn(true);
                      console.log('AFTER setShowFaceCheckIn called');
                      setTimeout(() => {
                        console.log('1 second later - showFaceCheckIn value:', showFaceCheckIn);
                      }, 1000);
                    }}
                    disabled={!canCheckIn || checkingIn}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Scan size={18} />
                    Face Check-In
                  </Button>
                )}
                
                <Button 
                  onClick={handleCheckOut}
                  disabled={!canCheckOut || checkingOut}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Clock size={18} />
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </Button>
                
                {todayStatus && isWeekday && (
                  <div className="ml-auto text-sm">
                    {hasLeave ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-sm">Leave</Badge>
                      </div>
                    ) : (
                      <>
                        {todayStatus.check_in && (
                          <p>Check-in: <span className="font-semibold">{formatTime(todayStatus.check_in)}</span></p>
                        )}
                        {todayStatus.check_out && (
                          <p>Check-out: <span className="font-semibold">{formatTime(todayStatus.check_out)}</span></p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-0">
              {/* Top Controls */}
              <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDate}
                  className="h-10 w-16"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDate}
                  className="h-10 w-16"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="relative" ref={datePickerRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 font-medium"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {currentMonth} ∨
                  </Button>

                  {showDatePicker && (
                    <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
                      <input
                        type="date"
                        value={selectedDateStr}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex gap-4">
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Count of days present</p>
                    <p className="text-lg font-semibold">{summary.present_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Leaves count</p>
                    <p className="text-lg font-semibold">{summary.leave_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Total working days</p>
                    <p className="text-lg font-semibold">{summary.total_working_days}</p>
                  </div>
                </div>
              </div>

              {/* Leave Allocations Section */}
              {isEmployee && leaveAllocations.length > 0 && (
                <div className="p-8 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 border-b border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">Leave Balance Overview</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaveAllocations.map((allocation, idx) => {
                      const total = allocation.allocated_days || 0
                      const used = allocation.used_days || 0
                      const available = total - used
                      const percentageAvailable = total > 0 ? ((available / total) * 100) : 0
                      
                      return (
                        <div key={idx} className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700/50 p-5 hover:shadow-purple-500/20 hover:shadow-2xl hover:scale-105 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-purple-400 font-bold text-base">{allocation.leave_type || 'Unknown'}</h4>
                            <div className="px-3 py-1 bg-gradient-to-r from-gray-700 to-gray-600 rounded-full border border-gray-600">
                              <span className="text-xs font-medium text-gray-300">{total} total</span>
                            </div>
                          </div>
                          
                          <div className="text-center mb-4">
                            <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text mb-1">
                              {available}
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Days Available</p>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                            <span className="px-2 py-1 bg-gray-700/70 rounded-md border border-gray-600">Used: {used}</span>
                            <span className="px-2 py-1 bg-gray-700/70 rounded-md border border-gray-600">Remaining: {available}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-gray-300">
                              <span>Progress</span>
                              <span>{percentageAvailable.toFixed(0)}% available</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden border border-gray-600">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full transition-all duration-700 ease-out shadow-lg shadow-emerald-500/30" 
                                style={{ width: `${percentageAvailable}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Date Display */}
              <div className="p-4 bg-background">
                <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-sm">Date</th>
                      <th className="text-left p-4 font-semibold text-sm">Status</th>
                      <th className="text-left p-4 font-semibold text-sm">Check In</th>
                      <th className="text-left p-4 font-semibold text-sm">Check Out</th>
                      <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
                      <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((record, idx) => {
                        // Check if the selected date is in the future or past
                        const isFutureDate = selectedDateStr > todayStr
                        const isPastDate = selectedDateStr < todayStr
                        
                        return (
                          <tr key={record.attendance_id || idx} className="border-b hover:bg-muted/30">
                            <td className="p-4 text-sm">
                              {selectedDateStr}
                            </td>
                            <td className="p-4 text-sm">
                              {isFutureDate && record.status !== 'leave' ? (
                                '-'
                              ) : (
                                <Badge variant={
                                  record.status === 'present' ? 'success' : 
                                  record.status === 'leave' ? 'default' : 
                                  'destructive'
                                }>
                                  {record.status === 'present' ? 'Present' : 
                                   record.status === 'leave' ? 'Leave' : 
                                   'Absent'}
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-sm">{record.status === 'leave' || isFutureDate ? '-' : formatTime(record.check_in)}</td>
                            <td className="p-4 text-sm">{record.status === 'leave' || isFutureDate ? '-' : formatTime(record.check_out)}</td>
                            <td className="p-4 text-sm">{record.status === 'leave' || isFutureDate ? '-' : (record.work_hours ? Number(record.work_hours).toFixed(2) : '-')}</td>
                            <td className="p-4 text-sm">{record.status === 'leave' || isFutureDate ? '-' : (record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00')}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Face Check-In Modal */}
        <FaceCheckInModal
          isOpen={showFaceCheckIn}
          onClose={() => setShowFaceCheckIn(false)}
          onCheckInSuccess={(attendance) => {
            setTodayStatus(attendance);
            // Immediately update header status for instant UI feedback
            setLocalStatusOverride('checked-in');
            // Dispatch to Redux for global real-time status update
            if (currentUser?.id) {
              dispatch(updateEmployeeStatus({
                employeeId: currentUser.id,
                status: 'present',
                check_in: attendance.check_in,
                date: selectedDateStr,
                lastUpdated: new Date().toISOString()
              }))
              
              // SIMPLE FIX: Update employee directly in employees list
              dispatch(updateEmployee({
                id: currentUser.id,
                attendance_status: 'present',
                attendance: {
                  status: 'present',
                  check_in: attendance.check_in,
                  date: selectedDateStr
                }
              }))
            }
            loadAttendance();
            // Clear override after 5 minutes to let hook take over with fresh data
            setTimeout(() => setLocalStatusOverride(null), 5 * 60 * 1000); // 5 minutes
            setShowFaceCheckIn(false);
          }}
          enrolledFaceUrl={faceEnrollment?.face_photo_url}
          selectedDate={selectedDate}
        />
      </>
    )
  }

  // Admin/Manager View - Traditional Design with Sidebar
  return (
    <>
      <PageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showNewButton={false}
        userStatus={headerStatus}
      />
      <div className="flex gap-6 p-8">
        {/* Main Content Area */}
        <div className="flex-1">
          <Card className="border-2">
            <CardContent className="p-0">
              {/* Top Controls */}
              <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevDate}
                  className="h-10 w-16"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDate}
                  className="h-10 w-16"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <div className="relative" ref={datePickerRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 font-medium"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {currentMonth} ∨
                  </Button>

                  {showDatePicker && (
                    <div className="absolute top-12 left-0 z-50 bg-background border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
                      <input
                        type="date"
                        value={selectedDateStr}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex gap-4">
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Count of days present</p>
                    <p className="text-lg font-semibold">{summary.present_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Leaves count</p>
                    <p className="text-lg font-semibold">{summary.leave_days}</p>
                  </div>
                  <div className="px-4 py-2 bg-muted rounded-md">
                    <p className="text-xs text-muted-foreground">Total working days</p>
                    <p className="text-lg font-semibold">{summary.total_working_days}</p>
                  </div>
                </div>
              </div>

              {/* Date Display */}
              <div className="p-4 bg-background">
                <h2 className="text-lg font-medium">{formatDate(selectedDate)}</h2>
              </div>

              {/* Attendance Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-sm">Employee</th>
                      <th className="text-left p-4 font-semibold text-sm">Check In</th>
                      <th className="text-left p-4 font-semibold text-sm">Check Out</th>
                      <th className="text-left p-4 font-semibold text-sm">Work Hours</th>
                      <th className="text-left p-4 font-semibold text-sm">Extra hours</th>
                      <th className="text-left p-4 font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          Loading...
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((record) => (
                        <tr key={record.employee_id} className="border-b hover:bg-muted/30">
                          <td className="p-4 text-sm font-medium">
                            {`${record.first_name || ''} ${record.last_name || ''}`.trim() || '[Employee]'}
                          </td>
                          <td className="p-4 text-sm">{formatTime(record.check_in)}</td>
                          <td className="p-4 text-sm">{formatTime(record.check_out)}</td>
                          <td className="p-4 text-sm">{record.work_hours ? Number(record.work_hours).toFixed(2) : '-'}</td>
                          <td className="p-4 text-sm">{record.extra_hours ? Number(record.extra_hours).toFixed(2) : '0.00'}</td>
                          <td className="p-4 text-sm">
                            <Badge variant={record.status === 'present' ? 'success' : record.status === 'leave' ? 'default' : 'destructive'}>
                              {record.status || 'Absent'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

              </div>

      {/* Face Check-In Modal */}
      {(() => {
        console.log('=== MODAL RENDER CHECK ===', {
          showFaceCheckIn,
          type: typeof showFaceCheckIn,
          strictEqual: showFaceCheckIn === true
        });
        return null;
      })()}
      
      {showFaceCheckIn === true && (
        <FaceCheckInModal
          isOpen={true}
          onClose={() => {
            console.log('Modal close clicked');
            setShowFaceCheckIn(false);
          }}
          onCheckInSuccess={(attendance) => {
            console.log('Check-in success callback');
            setTodayStatus(attendance);
            // Immediately update header status for instant UI feedback
            setLocalStatusOverride('checked-in');
            // Dispatch to Redux for global real-time status update
            if (currentUser?.id) {
              dispatch(updateEmployeeStatus({
                employeeId: currentUser.id,
                status: 'present',
                check_in: attendance.check_in,
                date: selectedDateStr,
                lastUpdated: new Date().toISOString()
              }))
              
              // SIMPLE FIX: Update employee directly in employees list
              dispatch(updateEmployee({
                id: currentUser.id,
                attendance_status: 'present',
                attendance: {
                  status: 'present',
                  check_in: attendance.check_in,
                  date: selectedDateStr
                }
              }))
            }
            loadAttendance();
            // Clear override after 5 minutes to let hook take over with fresh data
            setTimeout(() => setLocalStatusOverride(null), 5 * 60 * 1000); // 5 minutes
            setShowFaceCheckIn(false);
          }}
          enrolledFaceUrl={faceEnrollment?.face_photo_url}
          selectedDate={selectedDate}
        />
      )}
    </>
  )
}
