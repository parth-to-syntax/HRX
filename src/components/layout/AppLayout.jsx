import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarOpen ? '256px' : '80px',
        }}
      >
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
