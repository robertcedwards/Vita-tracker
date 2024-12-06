import { Pill } from 'lucide-react'

export function TestIcon() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Pill className="w-12 h-12 text-blue-500 mx-auto" />
        <p className="mt-2 text-gray-600">This is a test Lucide icon</p>
      </div>
    </div>
  )
}
