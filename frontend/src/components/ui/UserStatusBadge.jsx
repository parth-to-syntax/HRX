import React from 'react'

export default function UserStatusBadge({ status }) {
  if (!status) return null
  const map = {
    'on-leave': { color: 'bg-purple-500', label: 'On Leave' },
    'checked-in': { color: 'bg-green-500', label: 'Present' },
    'checked-out': { color: 'bg-amber-500', label: 'Worked' },
    'not-checked-in': { color: 'bg-red-500', label: 'Absent' },
    'weekend': { color: 'bg-blue-500', label: 'Holiday' },
  }
  const meta = map[status] || { color: 'bg-gray-400', label: status }
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/30">
      <span className={`w-2.5 h-2.5 rounded-full ${meta.color}`} />
      <span className="text-xs font-medium">{meta.label}</span>
    </div>
  )
}
