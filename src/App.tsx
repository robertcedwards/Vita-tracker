import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import { Toaster } from 'react-hot-toast'
import { Navigation } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { SupplementList } from './components/SupplementList'
import { Scanner } from './components/Scanner'
import { Settings } from './components/Settings'
import { TestIcon } from './components/TestIcon'
import { useState } from 'react'
import { Supplement, ScanResult } from './types'
import { supplementStorage } from './utils/supplementStorage'

function App() {
  const [supplements, setSupplements] = useState<Supplement[]>(supplementStorage.getAll())

  const handleTakeSupplement = (id: string) => {
    supplementStorage.logIntake(id, { taken: true })
    setSupplements(supplementStorage.getAll())
  }

  const handleAddSupplement = async (supplement: Omit<Supplement, 'id'>) => {
    await supplementStorage.add(supplement)
    setSupplements(supplementStorage.getAll())
  }

  const handleScanComplete = (result: ScanResult) => {
    // Handle scan result
    console.log('Scan complete:', result)
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto p-4 pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route 
              path="/supplements" 
              element={
                <SupplementList 
                  supplements={supplements}
                  onTakeSupplement={handleTakeSupplement}
                  onAddClick={() => {}} // Add modal open handler
                />
              } 
            />
            <Route 
              path="/scan" 
              element={<Scanner onScanComplete={handleScanComplete} />} 
            />
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
