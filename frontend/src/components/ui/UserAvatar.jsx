import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * UserAvatar - Reusable component for consistent user avatar display
 * 
 * Shows profile photo if available, otherwise shows initials with colored background
 * Supports different sizes and handles image loading errors gracefully
 * 
 * @param {Object} user - User object with avatar_url, name, first_name, or login_id
 * @param {string} size - Size variant: xs, sm, md, lg, xl, 2xl, 3xl
 * @param {string} className - Additional CSS classes
 * @param {Function} onClick - Optional click handler
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

  const getUserName = () => {
    if (user?.name) return user.name
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user?.first_name) return user.first_name
    if (user?.login_id) return user.login_id
    return 'User'
  }

  const getAvatarUrl = useMemo(() => {
    const name = getUserName()
    
    // Priority 1: Uploaded avatar from database
    if (user?.avatar_url) {
      // If avatar_url starts with http, use as-is (external URL)
      if (user.avatar_url.startsWith('http')) {
        return user.avatar_url
      }
      // Otherwise, it's a relative path from our backend
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      return `${baseUrl}${user.avatar_url}`
    }

    // Priority 2: UI Avatars API (fallback with initials)
    const initials = getInitials(name)
    const bgColor = user?.id 
      ? Math.abs(user.id.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 360)
      : Math.floor(Math.random() * 360)
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor < 100 ? 'ec4899' : bgColor.toString(16)}&color=fff&size=128&bold=true`
  }, [user])

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-full overflow-hidden flex-shrink-0 bg-gray-200',
        sizes[size],
        onClick && 'cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-primary transition-all',
        className
      )}
      title={getUserName()}
    >
      <img
        src={getAvatarUrl}
        alt={`${getUserName()} avatar`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          // Fallback to initials if image fails to load
          const name = getUserName()
          const initials = getInitials(name)
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=ec4899&color=fff&size=128&bold=true`
        }}
      />
    </div>
  )
}
