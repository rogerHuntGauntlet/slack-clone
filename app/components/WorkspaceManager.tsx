import React, { useState, useEffect } from 'react'
import { PlusCircle } from 'lucide-react'
import { getWorkspaces, createWorkspace, joinWorkspace } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Workspace {
  id: string
  name: string
  role: string
  isFavorite: boolean
}

interface WorkspaceManagerProps {
  activeWorkspace: string
  onWorkspaceSelect: (workspaceId: string) => void
}

export default function WorkspaceManager({ activeWorkspace, onWorkspaceSelect }: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [joinWorkspaceId, setJoinWorkspaceId] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchWorkspaces()
    }
  }, [user])

  const fetchWorkspaces = async () => {
    if (user) {
      const fetchedWorkspaces = await getWorkspaces(user.id)
      setWorkspaces(fetchedWorkspaces.map(workspace => ({
        ...workspace,
        isFavorite: false
      })))
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newWorkspaceName && user) {
      const createdWorkspace = await createWorkspace(newWorkspaceName, user.id)
      if (createdWorkspace) {
        setWorkspaces([...workspaces, {
          id: createdWorkspace.workspace.id,
          name: createdWorkspace.workspace.name,
          role: 'admin',
          isFavorite: false
        }])
        setNewWorkspaceName('')
      }
    }
  }

  const handleJoinWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinWorkspaceId && user) {
      await joinWorkspace(joinWorkspaceId, user.id)
      await fetchWorkspaces()
      setJoinWorkspaceId('')
    }
  }

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Workspaces</h2>
      <ul className="mb-4">
        {workspaces.map((workspace) => (
          <li key={workspace.id} className="mb-2">
            <button
              className={`w-full text-left p-2 rounded ${
                activeWorkspace === workspace.id ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              onClick={() => onWorkspaceSelect(workspace.id)}
            >
              {workspace.name} ({workspace.role})
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateWorkspace} className="mb-4">
        <input
          type="text"
          value={newWorkspaceName}
          onChange={(e) => setNewWorkspaceName(e.target.value)}
          placeholder="New workspace name"
          className="w-full bg-gray-700 text-white placeholder-gray-400 px-2 py-1 rounded mb-2"
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded flex items-center justify-center">
          <PlusCircle size={20} className="mr-2" />
          Create Workspace
        </button>
      </form>
      <form onSubmit={handleJoinWorkspace}>
        <input
          type="text"
          value={joinWorkspaceId}
          onChange={(e) => setJoinWorkspaceId(e.target.value)}
          placeholder="Workspace ID to join"
          className="w-full bg-gray-700 text-white placeholder-gray-400 px-2 py-1 rounded mb-2"
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Join Workspace
        </button>
      </form>
    </div>
  )
}

