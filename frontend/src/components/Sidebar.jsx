import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Zap,
  MessageSquare,
  History,
  ChevronRight,
  Scale,
} from 'lucide-react'

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation()

    const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analyze', icon: FileText, label: 'Analyzer' },
    { path: '/graph', icon: Zap, label: 'Graph View' },
    { path: '/simulation', icon: Zap, label: 'Simulation' },
    { path: '/precedents', icon: Scale, label: 'Precedents' },
    { path: '/courtroom', icon: MessageSquare, label: 'Courtroom' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chatbot' },
    { path: '/history', icon: History, label: 'History' },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-legal-blue dark:bg-slate-800 text-white transition-transform duration-300 ease-in-out z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
    >
      <div className="p-6 border-b border-white border-opacity-10">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          ⚖️ VerdictAI
        </h2>
        <p className="text-sm text-blue-100 mt-1">Document Analysis Platform</p>
      </div>

      <nav className="p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => toggleSidebar()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 ${isActive
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
                }`}
            >
              <Icon size={20} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={18} />}
            </NavLink>
          )
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6 p-4 bg-blue-600 rounded-lg text-sm">
        <p className="font-medium mb-2">Need Help?</p>
        <p className="text-blue-100 text-xs">
          Check the documentation or contact support
        </p>
      </div>
    </aside>
  )
}
