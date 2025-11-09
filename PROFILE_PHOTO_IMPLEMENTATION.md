# Profile Photo Persistence - Implementation Guide

## 🎯 Problem
User uploads a profile photo, but it doesn't persist across:
- Navigation between pages
- Page refreshes
- Different modules showing initials

## ✅ Solution Architecture

### 1. **Backend Setup** (Store avatar in database)
### 2. **Frontend Redux** (Global state management)
### 3. **Reusable Avatar Component** (Consistent display)
### 4. **Cache Profile in Redux** (Persist on refresh)

---

## 📁 Files to Create/Update

### ✅ New Files
1. `frontend/src/components/ui/UserAvatar.jsx` - Reusable avatar component
2. `backend/routes/upload.js` - File upload endpoint
3. `PROFILE_PHOTO_GUIDE.md` - This guide

### ✅ Files to Update
1. `backend/controllers/employeesController.js` - Add avatar upload
2. `frontend/src/redux/slices/userSlice.js` - Add avatar to state
3. `frontend/src/pages/ProfilePage.jsx` - Connect upload to backend
4. `frontend/src/components/layout/Navbar.jsx` - Use UserAvatar component
5. All other components showing user profile

---

## 🚀 Step-by-Step Implementation

### Step 1: Backend - Avatar Upload Endpoint

**Install multer for file uploads:**
```bash
cd backend
npm install multer
```

**Create `backend/routes/upload.js`:**
```javascript
import express from 'express';
import multer from 'multer';
import path from 'path';
import { pool } from '../db.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/avatars/'); // Create this folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload avatar endpoint
router.post('/avatar', isAuthenticated, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;
    const avatarUrl = `/avatars/${req.file.filename}`;

    // Update employee avatar_url in database
    const result = await pool.query(
      'UPDATE employees SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url',
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({
      success: true,
      avatar_url: avatarUrl,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

// Delete avatar endpoint
router.delete('/avatar', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;

    // Remove avatar_url from database
    await pool.query(
      'UPDATE employees SET avatar_url = NULL WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    console.error('Avatar delete error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete avatar' });
  }
});

export default router;
```

**Update `backend/index.js`:**
```javascript
import uploadRoutes from './routes/upload.js';

// Add after other routes
app.use('/upload', uploadRoutes);

// Serve static files (avatars)
app.use('/avatars', express.static('public/avatars'));
```

---

### Step 2: Frontend - Reusable Avatar Component

**Create `frontend/src/components/ui/UserAvatar.jsx`:**
```jsx
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * UserAvatar - Reusable component for consistent user avatar display
 * 
 * Shows profile photo if available, otherwise shows initials
 * Supports different sizes and variants
 */
export default function UserAvatar({ 
  user, 
  size = 'md', 
  className,
  onClick
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-32 h-32 text-3xl'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarUrl = useMemo(() => {
    // Priority 1: Uploaded avatar
    if (user?.avatar_url) {
      // If avatar_url starts with http, use as-is
      if (user.avatar_url.startsWith('http')) {
        return user.avatar_url
      }
      // Otherwise, it's a relative path from our backend
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar_url}`
    }

    // Priority 2: UI Avatars API (fallback with initials)
    const name = user?.name || user?.first_name || user?.login_id || 'User'
    const initials = getInitials(name)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=ec4899&color=fff&size=128`
  }, [user])

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0',
        sizes[size],
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
    >
      <img
        src={getAvatarUrl}
        alt={user?.name || 'User avatar'}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to initials if image fails to load
          const name = user?.name || user?.first_name || user?.login_id || 'User'
          const initials = getInitials(name)
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=ec4899&color=fff&size=128`
        }}
      />
    </div>
  )
}
```

---

### Step 3: Redux - Update User Slice

**Update `frontend/src/redux/slices/userSlice.js`:**

Add new reducer for updating avatar:
```javascript
updateAvatar: (state, action) => {
  if (state.currentUser) {
    state.currentUser.avatar_url = action.payload
  }
},
```

Export the action:
```javascript
export const { login, logout, updateProfile, updateAvatar, toggleTheme } = userSlice.actions
```

---

### Step 4: Frontend - Profile Page Upload

**Create `frontend/src/api/upload.js`:**
```javascript
import { apiRequest } from './index'

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/upload/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload avatar')
  }

  return response.json()
}

export async function deleteAvatar() {
  return apiRequest('/upload/avatar', 'DELETE')
}
```

**Update `frontend/src/pages/ProfilePage.jsx`:**

Add imports:
```jsx
import { useDispatch } from 'react-redux'
import { updateAvatar } from '@/redux/slices/userSlice'
import { uploadAvatar, deleteAvatar } from '@/api/upload'
```

Update avatar change handler:
```jsx
const dispatch = useDispatch()

const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  try {
    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Upload to backend
    const result = await uploadAvatar(file)
    
    // Update Redux state (persists across all components)
    dispatch(updateAvatar(result.avatar_url))
    
    toast.success('Profile photo updated successfully!')
  } catch (error) {
    console.error('Avatar upload error:', error)
    toast.error(error.message || 'Failed to upload photo')
    setAvatarPreview(null)
  }
}

const handleRemoveAvatar = async () => {
  if (!confirm('Remove profile photo?')) return

  try {
    await deleteAvatar()
    dispatch(updateAvatar(null))
    setAvatarPreview(null)
    toast.success('Profile photo removed')
  } catch (error) {
    toast.error(error.message || 'Failed to remove photo')
  }
}
```

Update avatar display in ProfilePage:
```jsx
<UserAvatar 
  user={currentUser} 
  size="3xl" 
  className="border-4 border-white shadow-lg"
/>
```

---

### Step 5: Update All Components

**`frontend/src/components/layout/Navbar.jsx`:**
```jsx
import UserAvatar from '@/components/ui/UserAvatar'

// Replace the img tag with:
<UserAvatar 
  user={currentUser} 
  size="sm"
  onClick={() => setShowProfileMenu(!showProfileMenu)}
/>
```

**`frontend/src/pages/EmployeeDirectory.jsx`:**
```jsx
import UserAvatar from '@/components/ui/UserAvatar'

// In employee card:
<UserAvatar user={employee} size="lg" />

// In employee details modal:
<UserAvatar user={selectedEmployee} size="2xl" />
```

**`frontend/src/pages/UserProfile.jsx`:**
```jsx
import UserAvatar from '@/components/ui/UserAvatar'

<UserAvatar user={currentUser} size="xl" />
```

---

## 🎨 Usage Examples

### Basic Usage
```jsx
import UserAvatar from '@/components/ui/UserAvatar'

<UserAvatar user={currentUser} />
```

### Different Sizes
```jsx
<UserAvatar user={user} size="xs" />   // 24px
<UserAvatar user={user} size="sm" />   // 32px
<UserAvatar user={user} size="md" />   // 40px (default)
<UserAvatar user={user} size="lg" />   // 48px
<UserAvatar user={user} size="xl" />   // 64px
<UserAvatar user={user} size="2xl" />  // 96px
<UserAvatar user={user} size="3xl" />  // 128px
```

### Clickable Avatar
```jsx
<UserAvatar 
  user={currentUser} 
  size="lg"
  onClick={() => navigate('/profile')}
  className="cursor-pointer"
/>
```

### Custom Styling
```jsx
<UserAvatar 
  user={currentUser} 
  size="xl"
  className="border-4 border-primary shadow-xl"
/>
```

---

## 📋 Complete Implementation Checklist

### Backend
- [ ] Install multer: `npm install multer`
- [ ] Create `backend/public/avatars/` folder
- [ ] Create `backend/routes/upload.js`
- [ ] Update `backend/index.js` (register upload route + static files)

### Frontend
- [ ] Create `frontend/src/api/upload.js`
- [ ] Create `frontend/src/components/ui/UserAvatar.jsx`
- [ ] Update `frontend/src/redux/slices/userSlice.js` (add updateAvatar)
- [ ] Update `frontend/src/pages/ProfilePage.jsx` (upload handler)
- [ ] Update `frontend/src/components/layout/Navbar.jsx`
- [ ] Update `frontend/src/pages/EmployeeDirectory.jsx`
- [ ] Update all other components showing user avatar

### Testing
- [ ] Upload photo in ProfilePage
- [ ] Verify photo appears in Navbar immediately
- [ ] Navigate to different pages (photo persists)
- [ ] Refresh browser (photo persists via Redux restore)
- [ ] Check EmployeeDirectory shows photo
- [ ] Test photo removal

---

## 🔧 Troubleshooting

### Photo doesn't persist on refresh
**Solution:** Redux state is restored via `restoreSession` in userSlice.js
Ensure `avatar_url` is included in the session restore:
```javascript
avatar_url: profile?.avatar_url || null,
```

### Photo doesn't show after upload
**Solution:** Check Redux state update:
```javascript
dispatch(updateAvatar(result.avatar_url))
```

### Broken image icon appears
**Solution:** Check CORS and file path:
```javascript
// Backend index.js
app.use('/avatars', express.static('public/avatars'));

// Frontend UserAvatar.jsx
return `${import.meta.env.VITE_API_URL}${user.avatar_url}`
```

### Photo shows in some places but not others
**Solution:** Replace all hardcoded avatar displays with UserAvatar component

---

## 🎯 How It Works

1. **Upload**: User uploads photo in ProfilePage
2. **Backend**: multer saves file, returns URL
3. **Redux**: Dispatch `updateAvatar(url)` updates global state
4. **Persistence**: Redux state synced with backend on refresh
5. **Display**: UserAvatar component reads from Redux everywhere
6. **Fallback**: If no photo, shows initials via UI Avatars API

---

## 🚀 Performance

- Avatar cached in Redux (no re-fetching)
- UI Avatars API generates initials instantly
- File size limited to 5MB
- Images served as static files (fast)

---

## 🔐 Security

- Authentication required (`isAuthenticated` middleware)
- File type validation (images only)
- File size limit (5MB)
- Unique filenames prevent collisions
- User can only update their own avatar

---

**Ready to implement?** Start with backend setup, then frontend component, then connect everything! 🎨
