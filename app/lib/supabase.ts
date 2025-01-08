import { createClient } from '@supabase/supabase-js'

export interface FileAttachment {
  id: string;          // Unique identifier for the file
  file_name: string;   // Name of the file
  file_type: string;   // MIME type of the file
  file_url: string;    // URL to access the file
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rlaxacnkrfohotpyvnam.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYXhhY25rcmZvaG90cHl2bmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxOTk3NjcsImV4cCI6MjA1MTc3NTc2N30.djQ3ExBd5Y2wb2sUOZCs5g72U2EgdYte7NqFiLesE9Y"

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name), role')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching workspaces:', error)
    return []
  }

  return data.map((item: any) => ({
    id: item.workspaces.id,
    name: item.workspaces.name,
    role: item.role,
  }))
}

export async function createWorkspace(name: string, userId: string) {
  try {
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({ name, created_by: userId })
      .select()
      .single()

    if (workspaceError) throw workspaceError

    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspace.id, user_id: userId, role: 'admin' })

    if (memberError) throw memberError

    const { data, error: channelError } = await createChannel('general', workspace.id, userId)

    if (channelError) throw channelError

    return { workspace, channel: data.channel, firstMessage: data.firstMessage }
  } catch (error) {
    console.error('Error in createWorkspace:', error)
    throw error
  }
}

export async function joinWorkspace(workspaceId: string, userId: string) {
  const { error } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspaceId, user_id: userId, role: 'member' })

  if (error) {
    console.error('Error joining workspace:', error)
    throw error
  }
}

export async function getWorkspaceUsers(workspaceId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('users(id, username, email, avatar_url, status)')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching workspace users:', error)
    return []
  }

  return data.map((item: any) => item.users)
}

export async function updateUserStatus(userId: string, status: 'online' | 'offline' | 'away') {
  const { data, error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user status:', error)
    return null
  }

  return data
}

export async function getChannels(workspaceId: string) {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.error('Error fetching channels:', error)
    return []
  }

  return data
}

export const getMessages = async (channelId: string) => {
  // First, get all top-level messages (messages that are not replies)
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      user:users!messages_user_id_fkey(id, username, avatar_url),
      replies:messages(
        *,
        user:users!messages_user_id_fkey(id, username, avatar_url)
      )
    `)
    .eq('channel', channelId)
    .is('parent_id', null) // Only get messages that are not replies
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw error
  }

  return messages || []
}

export const sendReply = async (
  channelId: string,
  userId: string,
  parentId: string,
  content: string
) => {
  try {
    // First get the user data
    const { data: userData } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel: channelId,
        user_id: userId,
        content,
        parent_id: parentId
      })
      .select(`
        *,
        user:users!messages_user_id_fkey(
          id,
          username,
          avatar_url,
          email
        )
      `)
      .single()

    if (error) throw error

    // Return with guaranteed user data
    return {
      ...data,
      user: data.user || userData || {
        id: userId,
        username: 'Unknown User',
        avatar_url: null
      }
    }
  } catch (error) {
    console.error('Error sending reply:', error)
    throw error
  }
}

export const sendMessage = async (
  channelId: string,
  userId: string,
  content: string,
  attachments: FileAttachment[]
) => {
  try {
    // First get the user data
    const { data: userData } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .eq('id', userId)
      .single()

    const { data, error } = await supabase
      .from('messages')
      .insert({
        channel: channelId,
        user_id: userId,
        content: content,
        has_attachment: attachments.length > 0,
        file_attachments: attachments
      })
      .select(`
        *,
        user:users!messages_user_id_fkey(
          id,
          username,
          avatar_url,
          email
        )
      `)
      .single()

    if (error) throw error

    // Return with guaranteed user data
    return {
      ...data,
      user: data.user || userData || {
        id: userId,
        username: 'Unknown User',
        avatar_url: null
      }
    }
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user:', error)
    throw error
  }

  return data
}

export async function getDirectMessages(userId: string, otherUserId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      user_id,
      receiver_id,
      sender:users!messages_user_id_fkey(id, username, avatar_url),
      receiver:users!messages_receiver_id_fkey(id, username, avatar_url)
    `)
    .or(`and(user_id.eq.${userId},receiver_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .eq('is_direct_message', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching direct messages:', error)
    return []
  }

  return data
}

export async function sendDirectMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: senderId,
      receiver_id: receiverId,
      content,
      is_direct_message: true
    })
    .select(`
      id,
      content,
      created_at,
      user_id,
      receiver_id,
      sender:users!messages_user_id_fkey(id, username, avatar_url),
      receiver:users!messages_receiver_id_fkey(id, username, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error sending direct message:', error)
    throw error
  }

  return data
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, avatar_url, phone, bio, employer, status')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function getUserCount() {
  if (!supabase) {
    console.error('Supabase client is not initialized')
    return 0
  }
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('Error fetching user count:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return 0
  }
}

export async function createChannel(name: string, workspaceId: string, creatorId: string) {
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .insert({ name, workspace_id: workspaceId, created_by: creatorId })
    .select()
    .single()

  if (channelError) {
    console.error('Error creating channel:', channelError)
    return { error: channelError }
  }

  // Create the first message in the channel
  const firstMessageContent = `Welcome to the #${name} channel!`
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      channel: channel.id,
      user_id: creatorId,
      content: firstMessageContent,
      is_direct_message: false
    })
    .select()
    .single()

  if (messageError) {
    console.error('Error creating first message:', messageError)
    return { error: messageError }
  }

  return { data: { channel, firstMessage: message } }
}

export async function createUserProfile(email: string) {
  try {
    const username = email.split('@')[0]; // Extract username from email
    const { data, error } = await supabase
      .from('users')
      .insert({ email, username })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    throw error
  }
}

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('Supabase connection successful')
    return true
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return false
  }
}

