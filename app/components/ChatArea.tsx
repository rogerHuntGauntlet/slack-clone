'use client'

import { FC, useState, useEffect, useRef, ChangeEvent } from 'react'
import { Send, Paperclip, Smile, X, Music, Film, FileText, Image } from 'lucide-react'
import Message from './Message'
import EmojiPicker from 'emoji-picker-react'
import ScrollToTopButton from './ScrollToTopButton'
import { supabase } from '../lib/supabase'
import { getMessages, sendMessage, sendReply } from '../lib/supabase'
import ChatHeader from './ChatHeader'
import { useDropzone } from 'react-dropzone'
import debounce from 'lodash/debounce'
import TwitterFeed from './TwitterFeed'

interface ChatAreaProps {
  activeWorkspace: string;
  activeChannel: string;
  currentUser: { id: string; email: string };
  onSwitchChannel: (channelId: string) => void;
  userWorkspaces: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  typingUsers: TypingStatus[];
  onlineUsers: UserStatus[];
  updateTypingStatus: (isTyping: boolean) => Promise<void>;
}

interface MessageType {
  id: string;
  user_id: string;
  channel: string;
  content: string;
  created_at: string;
  reactions?: { [key: string]: string[] };
  user: {
    id: string;
    username: string;
    avatar_url: string;
  };
  replies?: MessageType[];
  has_attachment?: boolean;
  file_attachments?: {
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
  }[];
}

interface SearchResult {
  channelId: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface FileAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
}

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

const ALLOWED_FILE_TYPES = ['image/*', 'application/pdf', 'text/plain', 'video/*', 'audio/*'];

const ChatArea: FC<ChatAreaProps> = ({ activeWorkspace, activeChannel, currentUser, onSwitchChannel, userWorkspaces, isCollapsed, onToggleCollapse }) => {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channelName, setChannelName] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  //const textAreaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchMessages()
    fetchChannelName()
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async payload => {
        const newMessage = payload.new as MessageType
        if (newMessage.channel === activeChannel) {
          // Fetch the complete message with user data
          const { data: messageWithUser } = await supabase
            .from('messages')
            .select(`
              *,
              user:users!messages_user_id_fkey(
                id,
                username,
                avatar_url,
                email
              )
            `)
            .eq('id', newMessage.id)
            .single()

          if (messageWithUser) {
            setMessages(prevMessages => [...prevMessages, messageWithUser])
          }
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [activeChannel])

  useEffect(() => {
    const savedDraft = localStorage.getItem(`draft_${activeChannel}`)
    if (savedDraft) {
      setNewMessage(savedDraft)
    }
  }, [activeChannel])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await getMessages(activeChannel)
      setMessages(fetchedMessages)
      setError(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages. Please try again.')
    }
  }

  const fetchChannelName = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('name')
        .eq('id', activeChannel)
        .single()

      if (error) throw error;
      setChannelName(data.name)
    } catch (err) {
      console.error('Error fetching channel name:', err)
      setError('Failed to load channel name. Please try again.')
    }
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((newMessage.trim() || selectedFiles.length > 0) && currentUser) {
      try {
        let attachments: FileAttachment[] = []

        // Upload files if any
        if (selectedFiles.length > 0) {
          const uploadedUrls = await Promise.all(selectedFiles.map(file => uploadFile(file)));
          attachments = uploadedUrls.map((url, index) => ({
            id: `${Date.now()}-${index}`,
            file_name: selectedFiles[index].name,
            file_type: selectedFiles[index].type,
            file_url: url
          }));
        }

        // Send message with attachments
        const sentMessage = await sendMessage(
          activeChannel,
          currentUser.id,
          newMessage.trim(),
          attachments
        )

        // Update messages state with the new message
        setMessages(prevMessages => [...prevMessages, {
          ...sentMessage,
          channel: activeChannel,
          user: {
            id: currentUser.id,
            username: currentUser.email,
            avatar_url: ''
          },
          file_attachments: attachments
        } as MessageType])

        // Clear form
        setNewMessage('')
        setSelectedFiles([])
        setError(null)
        localStorage.removeItem(`draft_${activeChannel}`)
      } catch (err) {
        console.error('Error sending message:', err)
        setError('Failed to send message. Please try again.')
      }
    }
  }

  const handleReply = async (parentId: string, content: string) => {
    if (content && currentUser) {
      try {
        const sentReply = await sendReply(activeChannel, currentUser.id, parentId, content)
        setMessages(prevMessages => prevMessages.map(message =>
          message.id === parentId
            ? {
              ...message, replies: [...(message.replies || []), {
                ...sentReply,
                channel: activeChannel,
                user: {
                  id: currentUser.id,
                  username: currentUser.email,
                  avatar_url: ''
                }
              }]
            }
            : message
        ))
        setError(null)
      } catch (err) {
        console.error('Error sending reply:', err)
        setError('Failed to send reply. Please try again.')
      }
    }
  }

  const handleSearchResult = (result: SearchResult) => {
    setSearchResults(prevResults => [...prevResults, result]);
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.channelId !== activeChannel) {
      onSwitchChannel(result.channelId);
    }

    setTimeout(() => {
      const messageElement = document.getElementById(`message-${result.messageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
        }, 3000);
      }
    }, 100);

    setSearchResults([]);
  };

  const onDrop = (acceptedFiles: File[]) => {
    console.log('onDrop triggered with files:', acceptedFiles);

    const validFiles = acceptedFiles
    /** 
    .filter(file =>
      ALLOWED_FILE_TYPES.some(type => file.type.match(type))
    );
    */
    console.log('Valid files:', validFiles);

    setSelectedFiles(prevFiles => {
      console.log('Setting selected files:', [...prevFiles, ...validFiles]);
      return [...prevFiles, ...validFiles];
    });

    const invalidFiles: File[] = []
    /** 
    .filter(file =>
      !ALLOWED_FILE_TYPES.some(type => file.type.match(type))
    );
    */
    if (invalidFiles.length > 0) {
      console.log('Invalid files:', invalidFiles);
      setError(`Some files were not added due to size or type restrictions: ${invalidFiles.map(f => f.name).join(', ')}`);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const uploadFile = async (file: File) => {
    console.log('Starting file upload for:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    try {
      if (file.size > 4 * 1024 * 1024 * 1024) {
        console.log('File too large:', file.size);
        throw new Error('File size exceeds 4GB limit');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}${Math.random()}.${fileExt}`;
      console.log('Generated filename:', fileName);

      console.log('Attempting Supabase upload...');
      const { data, error } = await supabase.storage
        .from('message_attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      console.log('Upload response:', { data, error });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Getting public URL...');
      const { data: publicUrlData } = supabase.storage
        .from('message_attachments')
        .getPublicUrl(fileName);

      console.log('Public URL data:', publicUrlData);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setError(errorMessage);
      throw error;
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNewMessage(value)
    setIsTyping(true)
    debouncedSaveDraft(value)
    debouncedStopTyping()

  }

  const debouncedSaveDraft = debounce((value: string) => {
    localStorage.setItem(`draft_${activeChannel}`, value)
  }, 500)

  const debouncedStopTyping = debounce(() => {
    setIsTyping(false)
  }, 2500)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType === 'application/pdf' || fileType === 'text/plain') return <FileText size={24} />;
    if (fileType.startsWith('video/')) return <Film size={24} />;
    if (fileType.startsWith('audio/')) return <Music size={24} />;
    return <Paperclip size={24} />;
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-800">
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatHeader
          channelName={channelName}
          isDM={false}
          onSearchResult={handleSearchResult}
          userWorkspaces={userWorkspaces}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
        {error && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Upload Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error.includes('size')
                      ? 'File is too large. Maximum size is 4GB.'
                      : error.includes('type')
                        ? 'Invalid file type. Supported types: images, PDFs, text, video, and audio files.'
                        : error
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="bg-gray-800 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
            <ul className="flex-grow overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
              {searchResults.map((result, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectSearchResult(result)}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                >
                  <p className="font-semibold">{result.sender} in #{channelName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{result.content}</p>
                  <p className="text-xs text-gray-500">{result.timestamp}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              currentUser={currentUser}
              onReply={handleReply}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div
          style={{
            transition: 'max-height 0.3s ease, opacity 0.3s ease',
            maxHeight: (isTyping || selectedFiles.length > 0) ? '150px' : '0',
            opacity: (isTyping || selectedFiles.length > 0) ? 1 : 0,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            padding: (isTyping || selectedFiles.length > 0) ? '8px' : '0',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          {isTyping && (
            <div
              style={{
                padding: '8px',
                fontSize: '0.875rem',
                color: '#6b7280',
              }}
            >
              Someone is typing...
            </div>
          )}
          
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                  {getFileIcon(file.type)}
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 bg-gray-100 dark:bg-gray-800 flex items-start space-x-2">
          <div
            {...getRootProps()}
            className={`
              w-10 h-10 flex items-center justify-center rounded-lg
              transition-all duration-200 ease-in-out
              ${isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95'
              }
            `}
          >
            <input {...getInputProps()} />
            <Paperclip className={`
              transform transition-all duration-200
              ${isDragActive
                ? 'text-blue-500 scale-110'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }
            `} />
          </div>
          <textarea
            value={newMessage}
            onChange={(e) => handleTextAreaChange(e)}
            placeholder="Type your message..."
            className="flex-1 p-2 mx-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 dark:bg-gray-700 text-white dark:text-white resize-none"
            rows={3}
          />
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={24} />
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
            >
              <Send size={24} />
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute bottom-20 right-8 z-10">
              <EmojiPicker
                onEmojiClick={(emojiObject) => {
                  setNewMessage(newMessage + emojiObject.emoji)
                  setShowEmojiPicker(false)
                }}
              />
            </div>
          )}
        </form>

        <ScrollToTopButton />
      </div>

      <TwitterFeed />
    </div>
  )
}

export default ChatArea

