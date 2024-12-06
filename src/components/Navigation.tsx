import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Pill, Scan, Settings } from 'lucide-react'

export function Navigation() {
  const navigationItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/supplements", icon: Pill, label: "Supplements" },
    { to: "/scan", icon: Scan, label: "Scan" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around">
          {navigationItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 text-sm ${
                  isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="mt-1 text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
