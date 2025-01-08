'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useDemoMode } from './DemoModeContext'

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: number;
}

interface WebSocketContextType {
  sendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  messages: Message[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const { user } = useAuth()
  const { isDemoMode } = useDemoMode()

  useEffect(() => {
    if (isDemoMode) {
      setMessages([
        { id: '1', content: 'Welcome to the demo chat!', sender: 'System', timestamp: Date.now() - 1000000 },
        { id: '2', content: 'This is a sample message.', sender: 'Alice', timestamp: Date.now() - 500000 },
        { id: '3', content: 'Here\'s a reply to the sample message!', sender: 'Bob', timestamp: Date.now() - 250000 },
      ])
    }
  }, [isDemoMode])

  const sendMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }
    setMessages((prevMessages) => [...prevMessages, newMessage])
  }

  return (
    <WebSocketContext.Provider value={{ sendMessage, messages }}>
      {children}
    </WebSocketContext.Provider>
  )
}

