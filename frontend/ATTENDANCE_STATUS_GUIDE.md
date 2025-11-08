# Employee Status Indicator - Implementation Guide

## Overview
The employee cards now display dynamic status indicators that reflect real-time attendance and leave status.

## Status Types

### 1. **Green Dot** - Employee is Present
- Shows when employee has checked in for the day
- Remains green even after check-out (completed day)
- Indicates: "Present"

### 2. **Yellow Dot** - Employee Not Checked In
- Shows when employee hasn't checked in yet today
- Default status at the start of each day
- Indicates: "Not Checked In"

### 3. **Purple Airplane Icon** - Employee on Leave
- Shows when employee has approved leave for today
- Cannot check in/out when on leave
- Indicates: "On Leave"

## How It Works

### Status Determination Logic
1. **First Check**: Is employee on approved leave today?
   - Yes → Show airplane icon (purple)
   - No → Continue to check attendance

2. **Attendance Check**: Has employee checked in today?
   - Checked in + Checked out → Green dot (completed)
   - Checked in only → Green dot (currently present)
   - Not checked in → Yellow dot (absent)

### Interactive Features

#### Click on Status Button
When you click the status indicator circle:
- **On Leave**: No action (can't check in/out)
- **Not Checked In**: Opens modal to check in
- **Checked In**: Opens modal to check out
- **Checked Out**: Opens modal showing day completed

#### Check-in/Check-out Modal
The modal displays:
- Employee name
- Current date and time
- Previous check-in/check-out times (if any)
- Appropriate action button:
  - "Check In" button (green) - if not checked in
  - "Check Out" button (blue) - if checked in but not checked out
  - "Day completed" message - if both check-in and check-out done

## Data Sources

### Attendance Records (`attendance.records`)
```javascript
{
  id: "ATT1234567890",
  employeeId: "uuid-here",
  employeeName: "John Doe",
  date: "2024-01-15",
  checkIn: "09:00",
  checkOut: "17:30",
  status: "Present"
}
```

### Leave Requests (`leave.requests`)
```javascript
{
  id: "LEAVE001",
  employeeId: "uuid-here",
  startDate: "2024-01-15",
  endDate: "2024-01-17",
  status: "Approved"
}
```

## Technical Implementation

### Key Functions

#### `getEmployeeStatus(employeeId)`
Determines the current status of an employee:
- Checks if employee is on approved leave
- Checks today's attendance record
- Returns: `'on-leave'`, `'checked-in'`, `'checked-out'`, or `'not-checked-in'`

#### `handleStatusClick(e, employee)`
Handles click on status indicator:
- Prevents event bubbling (doesn't trigger card click)
- Opens attendance modal for check-in/out
- Disabled when employee is on leave

#### `handleCheckIn()`
Records employee check-in:
- Gets current time
- Dispatches `markAttendance` with check-in time
- Updates Redux state immediately

#### `handleCheckOut()`
Records employee check-out:
- Gets current time
- Updates existing attendance record with check-out time
- Dispatches to Redux state

## User Experience

### For Employees
1. See their own status on the employee directory
2. Click status button to check in when arriving
3. Click status button to check out when leaving
4. View their check-in/out times in the modal

### For HR/Admin
1. See all employees' status at a glance
2. Identify who is present (green), absent (yellow), or on leave (airplane)
3. Can check in/out on behalf of employees if needed

## Visual Design

### Status Button
- Circle container: 32px × 32px
- Border: 2px, muted foreground with 30% opacity
- Hover effect: Scale up 10%
- Transition: Smooth transform animation

### Status Indicators
- **Green dot**: 8px × 8px, green-500
- **Yellow dot**: 8px × 8px, yellow-500
- **Airplane icon**: 12px × 12px, purple-500

### Modal
- Centered on screen with backdrop
- Displays current time and date
- Shows previous check-in/out times with color coding
- Action buttons with appropriate colors (teal for check-in, blue for check-out)

## Future Enhancements
- Add late arrival indicators
- Track total hours worked
- Show week/month attendance summary
- Add overtime tracking
- Implement geo-fencing for location-based check-in
- Add face recognition for check-in verification
