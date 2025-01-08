'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface DemoModeContextType {
  isDemoMode: boolean
  toggleDemoMode: () => void
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined)

export const useDemoMode = () => {
  const context = useContext(DemoModeContext)
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider')
  }
  return context
}

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false)

  const toggleDemoMode = () => {
    setIsDemoMode(prev => !prev)
  }

  return (
    <DemoModeContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  )
}

