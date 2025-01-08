'use client'

import { useEffect, useState } from 'react'
import { Twitter, ChevronRight, ChevronLeft } from 'lucide-react'

export default function TwitterFeed() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const placeholderTweet = {
    id: '1',
    text: 'Coming Soon',
    created_at: new Date().toISOString(),
    author: {
      name: 'Twitter Feed',
      username: 'twitterfeed',
      profile_image_url: '/placeholder.svg'
    }
  }

  return (
    <div className={`
      transition-all duration-300 ease-in-out h-full
      bg-gray-900/50 backdrop-blur-sm border-l border-white/10
      ${isCollapsed ? 'w-12' : 'w-80'}
    `}>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Twitter size={20} className="text-blue-400 flex-shrink-0" />
          {!isCollapsed && (
            <h2 className="text-white/90 font-medium whitespace-nowrap">Twitter Feed</h2>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white/70 hover:text-white/90 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="overflow-y-auto h-[calc(100%-60px)] custom-scrollbar">
          <div className="space-y-4 p-4">
            <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={placeholderTweet.author.profile_image_url}
                  alt={placeholderTweet.author.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="text-white/90 font-medium text-sm">
                    {placeholderTweet.author.name}
                  </div>
                  <div className="text-white/50 text-xs">
                    @{placeholderTweet.author.username}
                  </div>
                </div>
              </div>
              <p className="text-white/80 text-sm">{placeholderTweet.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 