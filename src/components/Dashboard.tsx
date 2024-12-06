import { useEffect, useState } from 'react'
import { BarChart, Activity, TrendingUp, Calendar, Pill } from 'lucide-react'
import { DashboardStats } from '../types'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSupplements: 0,
    takenToday: 0,
    streak: 0,
    compliance: 0,
  })

  useEffect(() => {
    const supplements = JSON.parse(localStorage.getItem('supplements') || '[]')
    const today = new Date().toISOString().split('T')[0]
    
    setStats({
      totalSupplements: supplements.length,
      takenToday: supplements.filter(s => s.lastTaken?.startsWith(today)).length,
      streak: calculateStreak(supplements),
      compliance: calculateCompliance(supplements),
    })
  }, [])

  const mockChartData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 3 },
    { name: 'Wed', count: 5 },
    { name: 'Thu', count: 2 },
    { name: 'Fri', count: 4 },
    { name: 'Sat', count: 3 },
    { name: 'Sun', count: 4 },
  ]

  return (
    <div>
      <header className="text-center my-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Pill className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalSupplements}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Taken Today</span>
          </div>
          <p className="text-2xl font-bold">{stats.takenToday}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold">{stats.streak} days</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Compliance</span>
          </div>
          <p className="text-2xl font-bold">{stats.compliance}%</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
        <h3 className="text-lg font-medium mb-4">Weekly Activity</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={mockChartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function calculateStreak(supplements) {
  // Simplified streak calculation
  return 3
}

function calculateCompliance(supplements) {
  // Simplified compliance calculation
  return 85
}
