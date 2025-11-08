# Leave & Attendance Integration Guide

## 🎯 Overview

The leave system is now fully integrated with the attendance system. Here's how they work together:

## 📋 Leave Types

Three leave types are configured:
- **Sick Leave** (Paid) - 12 days/year
- **Casual Leave** (Paid) - 15 days/year
- **Unpaid Leave** (Unpaid) - 30 days/year

## 🔄 Complete Workflow

### 1. **Leave Allocation (HR/Admin)**
- HR/Admin allocates leave days to employees for each leave type
- Valid period: Jan 1 - Dec 31 of current year
- Employees can see their allocations in the Time Off page

### 2. **Leave Request (Employee)**
- Employee requests leave for specific dates
- Must have sufficient allocated days
- Request enters "Pending" status

### 3. **Leave Approval (HR/Admin/Payroll)**
- Approver reviews and approves/rejects leave requests
- **On Approval:**
  - Leave status changes to "Approved"
  - Used days are incremented in allocation
  - **Attendance records are automatically created** with `status='leave'` for all dates in the leave period

### 4. **Attendance Integration**

#### Status Hierarchy:
1. **Present** - Employee checked in
2. **Leave** - Employee has approved leave (auto-created by system)
3. **Absent** - No check-in and no approved leave

#### Rules:
- ✅ **Weekdays Only** (Mon-Fri) - Weekends are automatically excluded
- ✅ **Check-in Blocked** - Cannot check in on days with approved leave
- ✅ **Check-out Blocked** - Cannot check out on days with approved leave
- ✅ **Visual Indicators** - Leave days show "On Leave" badge in attendance page
- ✅ **Auto-marking** - Days without check-in or leave are marked as "Absent"

## 🖥️ Frontend Features

### Time Off Page
- **Employee View:**
  - Shows all allocated leave types with available/used days
  - Can request new leave
  - Can view their own leave requests and status
  
- **HR/Admin View:**
  - Can create leave allocations for employees
  - Can approve/reject leave requests
  - Can view all leave requests across the company

### Attendance Page
- **Employee View:**
  - Shows **Status** column (Present/On Leave/Absent)
  - Blue info message when viewing a date with approved leave
  - "On Leave" badge displayed when on leave
  - Check-in/out buttons disabled on leave days
  - Summary stats show: Present days, Leave days, Total working days

- **Admin/HR View:**
  - Shows all employees' attendance for selected date
  - Status badges: Green (Present), Blue (Leave), Red (Absent)
  - Can see who is on leave vs who is absent

## 🔧 Technical Implementation

### Backend (`backend/controllers/leaveController.js`)
```javascript
// When leave is approved:
approveLeaveRequest() {
  // 1. Update leave request status to 'approved'
  // 2. Increment used_days in allocation
  // 3. Call upsertAttendanceLeaveForRange()
  //    - Creates attendance records with status='leave'
  //    - For each day in [start_date, end_date]
}
```

### Backend (`backend/controllers/attendanceController.js`)
```javascript
// Check-in validation:
checkInMe() {
  // 1. Validate weekday (Mon-Fri)
  // 2. Check if employee has approved leave for date
  // 3. Reject if status='leave'
  // 4. Otherwise create/update attendance with status='present'
}

// Attendance retrieval:
getMyAttendance() {
  // 1. Fetch attendance records from database
  // 2. Generate all weekdays in date range
  // 3. Mark missing weekdays as 'absent'
  // 4. Keep 'leave' status from database
  // 5. Calculate summary stats
}
```

### Frontend (`frontend/src/pages/AttendancePage.jsx`)
- Added **Status** column to employee table view
- Check `status === 'leave'` to determine if employee has approved leave
- Disable check-in/out buttons when `hasLeave === true`
- Show visual indicators (badge, info message)
- Display '-' for check-in/out times on leave days

### Frontend (`frontend/src/pages/LeavePage.jsx`)
- Dynamic leave types loaded from backend
- Dynamic allocations display (no hardcoded types)
- Shows available/used days for each leave type

## 📊 Database Schema

### `leave_types` table
- `id` (UUID)
- `name` (VARCHAR) - e.g., "Sick Leave"
- `is_paid` (BOOLEAN)

### `leave_allocations` table
- `employee_id` (UUID)
- `leave_type_id` (UUID)
- `allocated_days` (INT)
- `used_days` (INT)
- `valid_from` (DATE)
- `valid_to` (DATE)

### `leave_requests` table
- `employee_id` (UUID)
- `leave_type_id` (UUID)
- `start_date` (DATE)
- `end_date` (DATE)
- `status` (VARCHAR) - 'pending', 'approved', 'rejected'

### `attendance` table
- `employee_id` (UUID)
- `date` (DATE)
- `check_in` (TIMESTAMPTZ)
- `check_out` (TIMESTAMPTZ)
- `status` (VARCHAR) - 'present', 'leave', 'absent'
- `work_hours` (NUMERIC)
- `extra_hours` (NUMERIC)

## 🚀 Seed Scripts

### `seedLeaveTypes.js`
Creates the 3 leave types in the database.
```bash
node backend/scripts/seedLeaveTypes.js
```

### `seedLeaveAllocations.js`
Allocates leaves to one random employee.
```bash
node backend/scripts/seedLeaveAllocations.js
```

### `seedLeaveAllocationsForAll.js`
Allocates leaves to ALL employees.
```bash
node backend/scripts/seedLeaveAllocationsForAll.js
```

## ✅ Testing Checklist

1. ✅ Create leave types (run seed script)
2. ✅ Allocate leaves to employees
3. ✅ Employee requests leave
4. ✅ HR/Admin approves leave
5. ✅ Verify attendance records created with status='leave'
6. ✅ Verify employee cannot check-in on leave days
7. ✅ Verify attendance page shows "On Leave" status
8. ✅ Verify absent days show "Absent" status
9. ✅ Verify summary stats are correct (present/leave/total)
10. ✅ Verify weekends are excluded from working days

## 🎨 UI States

### Leave Day (Approved Leave)
- **Status Badge**: Blue "On Leave"
- **Check-in**: Disabled + Error message
- **Check-out**: Disabled + Error message
- **Times**: Show '-' instead of timestamps
- **Info Message**: "ℹ️ You have approved leave for this date"

### Present Day (Checked In)
- **Status Badge**: Green "Present"
- **Check-in**: Shows timestamp
- **Check-out**: Shows timestamp (or button if not checked out)
- **Work Hours**: Calculated hours displayed

### Absent Day (No Check-in, No Leave)
- **Status Badge**: Red "Absent"
- **Check-in**: Shows '-'
- **Check-out**: Shows '-'
- **Work Hours**: Shows '-'

### Weekend Day
- **Warning**: "⚠️ Weekends (Saturday/Sunday) are not working days"
- **Check-in/out**: Disabled
- **Not counted** in summary stats

## 📝 Business Rules Summary

1. **Weekdays Only**: Mon-Fri are working days, Sat-Sun excluded
2. **Leave Priority**: Approved leave takes precedence over check-in
3. **Auto-marking**: System automatically creates leave attendance records on approval
4. **Absence Logic**: No check-in + No leave = Absent
5. **Used Days**: Incremented automatically when leave is approved
6. **Date Range**: Leave can span multiple consecutive days
7. **Validation**: Cannot approve leave if insufficient allocation

## 🔐 Permissions

- **Admin/HR**: 
  - Create leave types
  - Create leave allocations
  - Approve/reject leave requests
  - View all attendance

- **Payroll**:
  - Approve/reject leave requests
  - View all attendance

- **Employee**:
  - Request leave (from their allocations)
  - View their own leave requests
  - Check-in/out (except on leave days)
  - View their own attendance
