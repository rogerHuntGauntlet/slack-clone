'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Mail, X } from "lucide-react"
import Lottie from 'react-lottie-player'
import loadingAnimation from '@/public/lottie-animation.json'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [joiningWorkspaceName, setJoiningWorkspaceName] = useState<string | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const workspaceId = params.get('workspaceId')
    console.log('Detected workspaceId:', workspaceId)
    if (workspaceId) {
      fetchWorkspaceName(workspaceId).then(name => {
        console.log('Fetched workspace name:', name)
        if (name) setJoiningWorkspaceName(name)
      })
    }
  }, [])

  const fetchWorkspaceName = async (workspaceId: string): Promise<string | null> => {
    try {
      console.log('Fetching workspace name for ID:', workspaceId)
      const { data, error } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()

      if (error) {
        console.error('Error fetching workspace name:', error)
        throw error
      }
      console.log('Workspace name fetched:', data?.name)
      return data?.name || null
    } catch (error) {
      console.error('Error in fetchWorkspaceName:', error)
      return null
    }
  }

  const joinWorkspace = async (workspaceId: string, userId: string) => {
    try {
      setMessage('Joining workspace...')
      const { error } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: userId })
      
      if (error) throw error
      return true
    } catch (error) {
      console.error('Error joining workspace:', error)
      return false
    }
  }

  const fetchUserProfile = async (email: string) => {
    try {
      setMessage('Fetching user profile...')
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code === 'PGRST116') {
        setMessage('Creating new user profile...')
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ email })
          .select()
          .single()

        if (createError) throw createError
        data = newUser
      } else if (error) {
        throw error
      }

      if (data) {
        const params = new URLSearchParams(window.location.search)
        const workspaceId = params.get('workspaceId')
        
        if (workspaceId) {
          setMessage('Adding you to the workspace...')
          const joined = await joinWorkspace(workspaceId, data.id)
          if (joined) {
            setMessage('Successfully joined workspace. Redirecting...')
            setTimeout(() => router.push(`/platform/workspace/${workspaceId}`), 2000)
            return
          }
        }

        setMessage('User profile fetched successfully. Redirecting...')
        setTimeout(() => router.push('/platform'), 2000)
      } else {
        throw new Error('Failed to fetch or create user profile')
      }
    } catch (error) {
      console.error('Error fetching/creating user profile:', error)
      setError('Failed to fetch or create user profile. Please try logging in again.')
      setIsAuthenticating(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      console.log('Starting sign in process...')
      setMessage('Signing in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      console.log('Sign in successful:', signInData)

      // Get user profile
      console.log('Fetching user profile for:', email)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      
      if (userError) {
        console.error('Error fetching user profile:', userError)
        throw userError
      }
      console.log('User profile found:', userData)

      // Get workspaceId from URL if present
      const params = new URLSearchParams(window.location.search)
      const workspaceId = params.get('workspaceId')
      console.log('Workspace ID from URL:', workspaceId)

      if (workspaceId && userData) {
        console.log('Attempting to join workspace...')
        try {
          // First check if the user is already a member
          const { data: existingMember, error: checkError } = await supabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('user_id', userData.id)
            .single()

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
            console.error('Error checking existing membership:', checkError)
            throw checkError
          }

          if (existingMember) {
            console.log('User is already a member of this workspace')
          } else {
            console.log('Adding user to workspace...')
            const { error: joinError } = await supabase
              .from('workspace_members')
              .insert([{ 
                workspace_id: workspaceId, 
                user_id: userData.id,
                role: 'member'
              }])
            
            if (joinError) {
              console.error('Error joining workspace:', joinError)
              throw joinError
            }
            console.log('Successfully joined workspace')
          }

          setMessage('Successfully joined workspace. Redirecting...')
          // Use the correct platform route
          router.push('/platform')
        } catch (joinError: any) {
          console.error('Failed to join workspace:', joinError)
          setError(`Failed to join workspace: ${joinError.message}`)
          setLoading(false)
          return
        }
      } else {
        console.log('No workspace to join, redirecting to platform')
        setMessage('Sign in successful. Redirecting...')
        router.push('/platform')
      }

      sessionStorage.setItem('userEmail', email)
    } catch (error: any) {
      console.error('Error in sign in process:', error)
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      setMessage('Signing up...')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      setMessage('Sign up successful. Please check your email for confirmation.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (isAuthenticating) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-b from-violet-100 to-violet-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center py-8">
            <Lottie
              loop
              animationData={loadingAnimation}
              play
              style={{ width: 200, height: 200 }}
            />
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">Welcome aboard! 🚀</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Setting up your workspace...
              </p>
              {message && (
                <p className="text-sm text-violet-600 dark:text-violet-400">
                  {message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-violet-100 to-violet-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Welcome to ChatGenius</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {joiningWorkspaceName && (
            <Alert>
              <div className="flex items-center justify-between">
                <AlertDescription>
                  Joining workspace: {joiningWorkspaceName}
                </AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setJoiningWorkspaceName(null)
                    const url = new URL(window.location.href)
                    url.searchParams.delete('workspaceId')
                    window.history.replaceState({}, '', url)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <Button
              onClick={handleSignUp}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}