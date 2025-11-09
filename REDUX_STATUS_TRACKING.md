# Redux Real-Time Employee Status Tracking

## Overview
Implemented a Redux-based real-time employee status tracking system that provides instant UI updates across all components when employees check in or check out, eliminating the need to wait for API refetches.

## Architecture

### 1. Redux State Structure
**File:** `frontend/src/redux/slices/attendanceSlice.js`

Added `employeeStatusMap` to the attendance slice:

```javascript
const initialState = {
  records: [],
  todayStatus: null,
  employeeStatusMap: {}, // NEW: Real-time status map
}
```

**Structure of employeeStatusMap:**
```javascript
{
  [employeeId]: {
    status: 'present' | 'leave' | 'absent',
    check_in: '2024-01-15T09:00:00Z',
    check_out: '2024-01-15T17:30:00Z', // optional
    work_hours: 8.5, // optional
    date: '2024-01-15',
    lastUpdated: '2024-01-15T17:30:00Z'
  }
}
```

### 2. Redux Actions

#### `updateEmployeeStatus`
Updates or adds a single employee's status in the map.

```javascript
dispatch(updateEmployeeStatus({
  employeeId: 123,
  status: 'present',
  check_in: '2024-01-15T09:00:00Z',
  date: '2024-01-15',
  lastUpdated: new Date().toISOString()
}))
```

#### `setEmployeeStatuses`
Batch loads multiple employee statuses (useful for initial load).

```javascript
dispatch(setEmployeeStatuses({
  123: { status: 'present', check_in: '...', date: '...' },
  124: { status: 'leave', date: '...' }
}))
```

#### `clearEmployeeStatus`
Removes a specific employee from the status map.

```javascript
dispatch(clearEmployeeStatus(employeeId))
```

#### `clearAllStatuses`
Clears the entire status map (useful for date changes or logout).

```javascript
dispatch(clearAllStatuses())
```

### 3. Implementation Points

#### AttendancePage.jsx
Updates Redux immediately when check-in/check-out occurs:

```javascript
const handleCheckIn = async () => {
  const result = await checkIn(selectedDateStr)
  
  // Dispatch to Redux for global real-time status update
  if (currentUser?.id) {
    dispatch(updateEmployeeStatus({
      employeeId: currentUser.id,
      status: 'present',
      check_in: result.check_in,
      date: selectedDateStr,
      lastUpdated: new Date().toISOString()
    }))
  }
  
  // Also uses local override for immediate UI feedback
  setLocalStatusOverride('checked-in')
  
  // Clear override after 5 minutes to let Redux/API data take over
  setTimeout(() => setLocalStatusOverride(null), 5 * 60 * 1000)
}
```

**Integration Points:**
- ✅ Regular check-in button
- ✅ Check-out button
- ✅ Face recognition check-in (both employee and admin views)

#### useEmployeeStatus Hook
**File:** `frontend/src/hooks/useEmployeeStatus.js`

Updated with priority-based status resolution:

**Priority Order:**
1. **Redux employeeStatusMap** - Highest priority for instant updates
2. **API fetch** - Real-time data from backend
3. **Backend attendance_status** - From currentUser object
4. **Redux attendance records** - Historical data
5. **Leave requests** - Approved leave status
6. **Weekend/Absent fallback**

```javascript
// PRIORITY 1: Check Redux first
const reduxStatus = employeeStatusMap[employeeId]
if (reduxStatus && reduxStatus.date === today) {
  if (reduxStatus.status === 'present') {
    if (reduxStatus.check_in && reduxStatus.check_out) return 'checked-out'
    if (reduxStatus.check_in) return 'checked-in'
  }
}

// Then fall back to API, backend status, etc.
```

#### EmployeeDirectory.jsx
Updated to prioritize Redux status map for real-time updates:

```javascript
const employeeStatusMap = useSelector((state) => state.attendance?.employeeStatusMap || {})

// In employee status display:
const reduxStatus = employeeStatusMap[employee.id]
if (reduxStatus && reduxStatus.date === today) {
  // Show real-time Redux status
  if (reduxStatus.status === 'present') {
    return <span className="text-green-600">Present</span>
  }
}

// Fall back to backend attendance data
const status = employee.attendance_status
// ... display backend status
```

## Benefits

### 1. Instant UI Updates
- Status changes reflect **immediately** across all components
- **Persists for 5 minutes** before refreshing from API
- No waiting for API refetch or polling
- Single source of truth for real-time status

### 2. Cross-Component Consistency
When an employee checks in, the status updates instantly in:
- ✅ Attendance page header
- ✅ Employee directory cards
- ✅ Dashboard widgets
- ✅ Any other component using `useEmployeeStatus` hook

### 3. Performance
- Reduces unnecessary API calls
- Local state updates are instant
- Background API syncs ensure data consistency

### 4. User Experience
- Immediate visual feedback
- No loading states or delays
- Consistent status across entire app

## Data Flow

```
User Action (Check-In/Out)
    ↓
API Call to Backend
    ↓
Success Response
    ↓
Dispatch updateEmployeeStatus → Redux Store
    ↓
All Components Using Hook Re-render
    ↓
Instant UI Update Across App
```

## Usage Examples

### Example 1: Check-In Flow
```javascript
// User clicks check-in button
handleCheckIn()
  → API: POST /attendance/check-in
  → Success: { check_in: '09:00:00', status: 'present' }
  → dispatch(updateEmployeeStatus({ employeeId, status: 'present', check_in, ... }))
  → Redux updates employeeStatusMap[employeeId]
  → useEmployeeStatus hook sees Redux update
  → All components re-render with new status
  → User sees "Present" badge instantly
```

### Example 2: Admin View
```javascript
// Admin viewing employee directory
employeeStatusMap[123] = { status: 'present', check_in: '09:00' }
  ↓
Employee card shows green "Present" badge with work hours
  ↓
When employee checks out:
  ↓
employeeStatusMap[123] updated with check_out and work_hours
  ↓
Card automatically updates to show "Present • 8.5h"
```

## Testing Checklist

- [ ] Employee checks in → Status updates in header immediately
- [ ] Employee checks in → Status updates in directory immediately
- [ ] Face recognition check-in → Status updates across app
- [ ] Check-out → Work hours display updates
- [ ] Multiple employees → Each status updates independently
- [ ] Page refresh → Status persists from API
- [ ] Date change → Status map cleared appropriately

## Future Enhancements

1. **WebSocket Integration**
   - Real-time updates from other users' actions
   - Admin sees instant status changes from all employees

2. **Offline Support**
   - Queue status updates when offline
   - Sync when connection restored

3. **Status History**
   - Track status changes throughout the day
   - Display timeline of check-ins/outs

4. **Notification System**
   - Toast notifications for status changes
   - Admin alerts for late check-ins

## Troubleshooting

### Status Not Updating
1. Check Redux DevTools - is employeeStatusMap being updated?
2. Verify dispatch is being called with correct employeeId
3. Check date matches today's date in ISO format

### Stale Status After Refresh
1. Redux state is not persisted by default
2. API fetch should populate initial status
3. Consider adding Redux persist if needed

### Multiple Status Sources Conflict
Priority order ensures Redux takes precedence:
1. Redux (most recent)
2. API (reliable)
3. Backend (cached)
4. Redux records (historical)

## Migration Guide

If updating from old status system:

1. **Add Redux imports** to components using status
2. **Update status display logic** to check Redux first
3. **Add dispatch calls** to all check-in/out handlers
4. **Test thoroughly** with multiple users

## Related Files

- `frontend/src/redux/slices/attendanceSlice.js` - Redux state
- `frontend/src/hooks/useEmployeeStatus.js` - Status resolution hook
- `frontend/src/pages/AttendancePage.jsx` - Check-in/out actions
- `frontend/src/pages/EmployeeDirectory.jsx` - Status display
