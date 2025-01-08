import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  user: { id: string; email: string } | null
}

const AuthContext = createContext<AuthContextType>({ user: null })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: null }}>
      {children}
    </AuthContext.Provider>
  )
} 