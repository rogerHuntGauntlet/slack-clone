'use client'

import React from 'react'
import { useDemoMode } from '../contexts/DemoModeContext'

const DemoModeToggle: React.FC = () => {
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  return (
    <button
      onClick={toggleDemoMode}
      className={`px-4 py-2 rounded-full font-bold text-white ${
        isDemoMode ? 'bg-green-500' : 'bg-red-500'
      }`}
    >
      {isDemoMode ? 'DEMO MODE ON' : 'DEMO MODE OFF'}
    </button>
  )
}

export default DemoModeToggle

