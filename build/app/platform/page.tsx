'use client'

import { useState, useEffect } from 'react'
import { getWorkspaces, createWorkspace, joinWorkspace, getUserByEmail, createUserProfile, getChannels, supabase, getUserCount, testSupabaseConnection } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import ChatArea from '../../components/ChatArea'
import Header from '../../components/Header'
import WorkspaceList from '../../components/WorkspaceList'
import ProfileModal from '../../components/ProfileModal'
import { useRouter, useSearchParams } from 'next/navigation'
import CollapsibleDMList from '../../components/CollapsibleDMList'
import DirectMessageArea from '../../components/DirectMessageArea'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Workspace {
  id: string;
  name: string;
  role: string;
  isFavorite: boolean;
}

// Add new interfaces for typing status
interface TypingStatus {
  userId: string;
  channelId: string;
  isTyping: boolean;
}

interface UserStatus {
  id: string;
  online: boolean;
  last_seen: string;
}

export default function Platform() {
  const [user, setUser] = useState<{ id: string; email: string; username?: string } | null>(null)
  const [activeWorkspace, setActiveWorkspace] = useState('')
  const [activeChannel, setActiveChannel] = useState('')
  const [activeDM, setActiveDM] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; role: string; isFavorite: boolean }[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [joiningWorkspaceName, setJoiningWorkspaceName] = useState<string | null>(null)
  const [showWorkspaceSelection, setShowWorkspaceSelection] = useState(false)
  const [userWorkspaceIds, setUserWorkspaceIds] = useState<string[]>([])
  const [userCount, setUserCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('') // Added state variable
  const MAX_USERS = 40
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingStatus[]>([])
  const [onlineUsers, setOnlineUsers] = useState<UserStatus[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session && session.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata.username
          })
          console.log("session: ", session)
          const userData = await getUserByEmail(session.user.email || '')
            if (userData) {
              setUser(userData)
              await fetchUserData(userData.id, userData.email)
            } else {
              throw new Error('User data not found')
            }
       
        } else {
          const storedEmail = sessionStorage.getItem('userEmail')
          if (storedEmail) {
            const userData = await getUserByEmail(storedEmail)
            if (userData) {
              setUser(userData)
              await fetchUserData(userData.id, userData.email)
            } else {
              throw new Error('User data not found')
            }
          } else {
            throw new Error('No user session or stored email')
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase.auth])

  const fetchUserData = async (userId: string, email: string) => {
    try {
      const [userWorkspaces, userProfile] = await Promise.all([
        getWorkspaces(userId),
        getUserByEmail(email)
      ])

      if (userProfile) {
        setUser(prevUser => ({
          ...prevUser,
          ...userProfile,
        }))
      }

      const updatedWorkspaces = userWorkspaces.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        role: workspace.role,
        isFavorite: false,
      }))

      setWorkspaces(updatedWorkspaces)
      setUserWorkspaceIds(updatedWorkspaces.map(workspace => workspace.id))
      
      if (updatedWorkspaces.length > 0) {
       // setActiveWorkspace(userWorkspaces[0].id)
       // const channels = await getChannels(userWorkspaces[0].id)
       // if (channels.length > 0) {
       //   setActiveChannel(channels[0].id)
       // }
       setShowWorkspaceSelection(true)
      } else {
        setShowWorkspaceSelection(true)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to fetch user data. Please try logging in again.')
    }
  }

  useEffect(() => {
    document.documentElement.classList.add('dark')
    const workspaceId = searchParams.get('workspaceId')
    if (workspaceId) {
      fetchWorkspaceName(workspaceId).then(name => {
        if (name) setJoiningWorkspaceName(name)
      })
    }
    testSupabaseConnection().then(isConnected => {
      if (isConnected) {
        fetchUserCount()
      } else {
        setError('Failed to connect to the database. Please try again later.')
      }
    })
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const fetchWorkspaces = async (userId: string) => {
    try {
      const userWorkspaces = await getWorkspaces(userId)
      const updatedWorkspaces = userWorkspaces.map(workspace => ({
        ...workspace,
        isFavorite: false,
      }))
      setWorkspaces(updatedWorkspaces)
      return updatedWorkspaces
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      setError('Failed to fetch workspaces. Please try again.')
      return []
    }
  }

  const fetchChannels = async (workspaceId: string) => {
    try {
      const channels = await getChannels(workspaceId)
      if (channels.length > 0) {
        setActiveChannel(channels[0].id)
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
      setError('Failed to fetch channels. Please try again.')
    }
  }

  const fetchUserCount = async () => {
    try {
      const count = await getUserCount()
      setUserCount(count)
    } catch (error) {
      console.error('Error fetching user count:', error)
      setError('Failed to fetch user count. Please try again.')
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (userCount >= MAX_USERS) {
        setError("We've reached our user limit. Please check back later.")
        return
      }

      let userData = await getUserByEmail(email)
      if (!userData) {
        if (userCount >= MAX_USERS) {
          setError("We've reached our user limit. Please check back later.")
          return
        }
        userData = await createUserProfile(email)
        if (!userData) {
          throw new Error('Failed to create user profile')
        }
        setUserCount(prevCount => prevCount + 1)
      }
      if (userData) {
        setUser({ id: userData.id, email: userData.email, username: userData.username })
        const userWorkspaces = await fetchWorkspaces(userData.id)
        setUserWorkspaceIds(userWorkspaces.map(workspace => workspace.id))
        const workspaceId = searchParams.get('workspaceId')
        if (workspaceId) {
          await handleJoinWorkspace(workspaceId, userData.id)
        } else if (userWorkspaces.length > 0) {
          setShowWorkspaceSelection(true)
        } else {
          // No workspaces, show create workspace form
          setShowWorkspaceSelection(true)
        }
      } else {
        throw new Error('Failed to get or create user')
      }
    } catch (error: any) {
      console.error('Error during email submission:', error)
      setError(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (user && newWorkspaceName) {
      try {
        const result = await createWorkspace(newWorkspaceName, user.id)
        if (result) {
          const { workspace, channel } = result;
          setWorkspaces(prevWorkspaces => [...prevWorkspaces, { ...workspace, role: 'admin' }])
          setActiveWorkspace(workspace.id)
          setActiveChannel(channel.id)
          setNewWorkspaceName('')
          setShowWorkspaceSelection(false)
        } else {
          throw new Error('Failed to create workspace')
        }
      } catch (error) {
        console.error('Error creating workspace:', error)
        setError('Failed to create workspace. Please try again.')
      }
    }
  }

  const handleJoinWorkspace = async (workspaceId: string, userId: string) => {
    try {
      await joinWorkspace(workspaceId, userId)
      const updatedWorkspaces = await fetchWorkspaces(userId)
      setWorkspaces(updatedWorkspaces.map(workspace => ({
        ...workspace,
        isFavorite: false
      })))
      setUserWorkspaceIds(updatedWorkspaces.map(workspace => workspace.id))
      setActiveWorkspace(workspaceId)
      await fetchChannels(workspaceId)
      setShowWorkspaceSelection(false)
      setJoiningWorkspaceName(null)
    } catch (error) {
      console.error('Error joining workspace:', error)
      setError('Failed to join workspace. Please try again.')
    }
  }

  const handleWorkspaceSelect = async (workspaceId: string) => {
    try {
      console.log("handleWorkspaceSelect: ", workspaceId)
      // Set the active workspace
      setActiveWorkspace(workspaceId);
      
      // Fetch channels for the new workspace
      const channels = await getChannels(workspaceId);
      console.log("channels: ", channels);
      
      // Set the first channel as active (usually 'general')
      if (channels && channels.length > 0) {
        setActiveChannel(channels[0].id); // Set the first channel as active
      } else {
        setActiveChannel(''); // Clear active channel if none exist
      }
      
      // Clear any active DM when switching workspaces
      setActiveDM(null);
      
      // Close the workspace selection view
      setShowWorkspaceSelection(false);
    } catch (error) {
      console.error('Error switching workspace:', error);
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleSelectDM = (userId: string) => {
    setActiveDM(userId)
    setActiveChannel('')
  }

  const handleSwitchChannel = (channelId: string) => {
    setActiveChannel(channelId);
    setActiveDM(null);
  };

  const fetchWorkspaceName = async (workspaceId: string) => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspaceId)
        .single()

      if (error) throw error
      return data.name
    } catch (error) {
      console.error('Error fetching workspace name:', error)
      return null
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      sessionStorage.removeItem('userEmail')
      setUser(null)
      setActiveWorkspace('')
      setActiveChannel('')
      setActiveDM(null)
      setWorkspaces([])
      setNewWorkspaceName('')
      setError(null)
      setShowProfileModal(false)
      setJoiningWorkspaceName(null)
      setShowWorkspaceSelection(false)
      setUserWorkspaceIds([])
      router.push('/auth')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }

  const handleReturnToWorkspaceSelection = () => {
    setActiveWorkspace('')
    setActiveChannel('')
    setActiveDM(null)
    setShowWorkspaceSelection(true)
  }

  const onToggleFavorite = (workspaceId: string) => {
    setWorkspaces(prevWorkspaces => 
      prevWorkspaces.map(workspace => 
        workspace.id === workspaceId 
          ? { ...workspace, isFavorite: !workspace.isFavorite } 
          : workspace
      )
    );
  };

  // Add real-time subscriptions after user authentication
  useEffect(() => {
    if (!user?.id) return

    // Subscribe to user presence changes
    const presenceSubscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const presentUsers = Object.values(presenceSubscription.presenceState()) as unknown as UserStatus[];
        setOnlineUsers(presentUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceSubscription.track({
            id: user.id,
            online: true,
            last_seen: new Date().toISOString(),
          })
        }
      })

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel('typing-indicators')
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        setTypingUsers(current => {
          const filtered = current.filter(t => t.userId !== payload.userId)
          if (payload.isTyping) {
            return [...filtered, payload]
          }
          return filtered
        })
      })
      .subscribe()

    // Cleanup subscriptions
    return () => {
      presenceSubscription.unsubscribe()
      typingSubscription.unsubscribe()
    }
  }, [user?.id])

  // Add function to broadcast typing status
  const updateTypingStatus = async (isTyping: boolean) => {
    if (!user?.id || !activeChannel) return

    await supabase
      .channel('typing-indicators')
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: user.id,
          channelId: activeChannel,
          isTyping,
        },
      })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-300 to-blue-300 dark:from-pink-900 dark:to-blue-900">
        <div className="bg-gray-800 dark:bg-gray-800 p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Welcome to ChatGenius</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Current users: {userCount} / {MAX_USERS}
          </p>
          {joiningWorkspaceName && (
            <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                You're joining the workspace: <strong>{joiningWorkspaceName}</strong>
              </p>
            </div>
          )}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 dark:text-white dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-colors"
              disabled={userCount >= MAX_USERS}
            >
              {joiningWorkspaceName ? 'Join Workspace' : 'Continue'}
            </button>
          </form>
          {userCount >= MAX_USERS && (
            <p className="mt-4 text-center text-red-500">
              We've reached our user limit. Please check back later.
            </p>
          )}
        </div>
      </div>
    )
  }

  if (showWorkspaceSelection) {
    return (
      <WorkspaceList
        workspaces={workspaces}
        onSelectWorkspace={handleWorkspaceSelect}
        onCreateWorkspace={handleCreateWorkspace}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        onToggleFavorite={onToggleFavorite}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <Header
        currentUser={user}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onCreateWorkspace={() => setActiveWorkspace('')}
        onOpenProfile={() => setShowProfileModal(true)}
        onLogout={handleLogout}
        onReturnToWorkspaceSelection={handleReturnToWorkspaceSelection}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isCollapsed && (
          <>
            <CollapsibleDMList
              workspaceId={activeWorkspace}
              onSelectDM={handleSelectDM}
              activeUserId={activeDM}
              className="w-64"
            />
            <Sidebar
              activeWorkspace={activeWorkspace}
              setActiveWorkspace={setActiveWorkspace}
              activeChannel={activeChannel}
              setActiveChannel={(channel) => {
                setActiveChannel(channel)
                setActiveDM(null)
              }}
              currentUser={user}
              workspaces={workspaces}
            />
          </>
        )}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-800 border-2 border-white">
          {activeWorkspace && activeChannel && user && !activeDM && (
            <ChatArea
              activeWorkspace={activeWorkspace}
              activeChannel={activeChannel}
              currentUser={user}
              onSwitchChannel={handleSwitchChannel}
              userWorkspaces={userWorkspaceIds}
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
              typingUsers={typingUsers}
              onlineUsers={onlineUsers}
              updateTypingStatus={updateTypingStatus}
            />
          )}
          {activeWorkspace && activeDM && user && (
            <DirectMessageArea
              currentUser={user}
              otherUserId={activeDM}
            />
          )}
        </div>
      </div>
      {showProfileModal && (
        <ProfileModal
          currentUser={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  )
}

