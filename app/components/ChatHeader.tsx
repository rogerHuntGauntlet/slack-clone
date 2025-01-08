import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatHeaderProps {
  channelName: string;
  isDM: boolean;
  onSearchResult: (result: SearchResult) => void;
  userWorkspaces: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface SearchResult {
  channelId: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: string;
  channelName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ channelName, isDM, onSearchResult, userWorkspaces, isCollapsed, onToggleCollapse }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          channel,
          user:users!messages_user_id_fkey (username),
          channels!inner (id, name, workspace_id)
        `)
        .textSearch('content', searchQuery)
        .filter('channels.workspace_id', 'in', `(${userWorkspaces.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const results: SearchResult[] = data.map(item => ({
        channelId: item.channel,
        messageId: item.id,
        content: item.content,
        sender: item.user.length > 0 ? item.user[0].username : 'Unknown User',
        timestamp: new Date(item.created_at).toLocaleString(),
        channelName: item.channels.length > 0 ? item.channels[0].name : 'Unknown Channel',
      }));

      results.forEach(result => onSearchResult(result));
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  return (
    <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
        <h2 className="text-xl font-semibold text-white dark:text-white">
          {isDM ? `Chat with ${channelName}` : `#${channelName}`}
        </h2>
      </div>
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-700 dark:bg-gray-700 text-white dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </form>
    </div>
  );
};

export default ChatHeader;

