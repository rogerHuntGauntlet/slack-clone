import { FC, useState } from 'react'
import { Smile, ChevronDown, ChevronUp, MessageSquare, Reply, Download, Image, FileText, Film, Music } from 'lucide-react'
import EmojiReactions from './EmojiReactions'
import ReplyComponent from './Reply'
import DOMPurify from 'isomorphic-dompurify'

interface MessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    reactions?: { [key: string]: string[] };
    user?: {
      username: string;
      avatar_url: string;
    };
    replies?: MessageProps['message'][];
    file_attachments?: {
      id: string;
      file_name: string;
      file_type: string;
      file_url: string;
    }[];
  }
  currentUser: {
    id: string;
    email: string;
  }
  onReply: (parentId: string, content: string) => Promise<void>;
}

const Message: FC<MessageProps> = ({ message, currentUser, onReply }) => {
  const [showEmojiSelector, setShowEmojiSelector] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const emojiOptions = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉']

  const isCurrentUserMessage = message.user_id === currentUser.id

  const handleReply = async () => {
    if (replyContent.trim()) {
      await onReply(message.id, replyContent.trim())
      setReplyContent('')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image size={24} />;
    if (fileType === 'application/pdf' || fileType === 'text/plain') return <FileText size={24} />;
    if (fileType.startsWith('video/')) return <Film size={24} />;
    if (fileType.startsWith('audio/')) return <Music size={24} />;
    return <Download size={24} />;
  }

  const renderAttachment = (attachment: NonNullable<typeof message.file_attachments>[number]) => {
    const fileExtension = attachment.file_name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');

    if (isImage) {
      return (
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-w-full h-auto rounded-lg shadow-md mt-2"
        />
      )
    } else {
      return (
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mt-2">
          {getFileIcon(attachment.file_type)}
          <a
            href={attachment.file_url}
            download
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {attachment.file_name}
          </a>
        </div>
      )
    }
  }

  return (
    <div
      id={`message-${message.id}`}
      className="group relative mb-3 hover:z-10 transition-all duration-200"
    >
      <div className={`
        flex items-start gap-3 px-4 py-2.5 rounded-lg
        ${isCurrentUserMessage 
          ? 'bg-gradient-to-r from-blue-500/20 via-blue-600/15 to-blue-500/10' 
          : 'bg-gradient-to-r from-purple-500/20 via-purple-600/15 to-purple-500/10'
        } 
        backdrop-blur-sm hover:backdrop-blur-md
        transition-all duration-300
        hover:shadow-lg hover:shadow-black/5
        hover:translate-x-0.5
      `}>
        <div className="relative flex-shrink-0">
          <img
            src={message.user?.avatar_url || '/placeholder.svg?height=40&width=40'}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 
                       transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex-grow min-w-0 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">
                {message.user?.username || (isCurrentUserMessage ? 'You' : 'User')}
              </span>
              <span className="text-[11px] text-white/50">
                {new Date(message.created_at).toLocaleString([], { 
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="text-white/90 text-sm break-words leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }} 
          />
          
          {message.file_attachments?.map((attachment, index) => (
            <div key={index} className="inline-block hover:scale-[1.02] transition-transform duration-200">
              {renderAttachment(attachment)}
            </div>
          ))}

          <div className="flex items-center gap-2 mt-1.5 ml-auto">
            <EmojiReactions
              messageId={message.id}
              currentUserId={currentUser.id}
              initialReactions={message.reactions || {}}
            />
            
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full
                         bg-white/5 hover:bg-white/10 
                         transition-all duration-200
                         text-white/70 hover:text-white/90"
            >
              <MessageSquare size={13} />
              {message.replies && message.replies.length > 0 && (
                <span className="text-xs font-medium">{message.replies.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showReplies && (
        <div className="mt-2 mr-4 ml-auto space-y-2 animate-slideDown max-w-[75%]">
          {message.replies?.map((reply) => (
            <ReplyComponent key={reply.id} reply={reply} currentUser={currentUser} />
          ))}
          
          <div className="flex items-center gap-2 mt-3 group/reply">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Reply to thread..."
              className="flex-grow px-4 py-2 text-sm bg-white/5 rounded-full
                         border border-white/10 
                         focus:border-white/20 focus:bg-white/10
                         focus:outline-none focus:ring-1 focus:ring-white/20
                         placeholder:text-gray-400
                         transition-all duration-200"
            />
            <button
              onClick={handleReply}
              disabled={!replyContent.trim()}
              className="p-2 rounded-full
                         bg-blue-500/80 hover:bg-blue-500
                         disabled:opacity-50 disabled:hover:bg-blue-500/80
                         transition-all duration-200
                         transform hover:scale-105 active:scale-95"
            >
              <Reply size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Message

