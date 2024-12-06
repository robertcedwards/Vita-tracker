import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { Navigation } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { SupplementList } from './components/SupplementList'
import { Scanner } from './components/Scanner'
import { Settings } from './components/Settings'
import { TestIcon } from './components/TestIcon'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto p-4 pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/supplements" element={<SupplementList />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/test" element={<TestIcon />} />
          </Routes>
        </div>
        <Navigation />
        <Toaster position="bottom-center" />
      </div>
    </Router>
  )
}

export default App
