import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatHeaderProps {
  channelName: string;
  isDM: boolean;
  onSearchResult: (result: SearchResult) => void;
  userWorkspaces: string[];
}

interface SearchResult {
  channelId: string;
  messageId: string;
  content: string;
  sender: string;
  timestamp: string;
  channelName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ channelName, isDM, onSearchResult, userWorkspaces }) => {
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
        sender: item.user.username,
        timestamp: new Date(item.created_at).toLocaleString(),
        channelName: item.channels.name,
      }));

      results.forEach(result => onSearchResult(result));
    } catch (error) {
      console.error('Error searching messages:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        {isDM ? `Chat with ${channelName}` : `#${channelName}`}
      </h2>
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </form>
    </div>
  );
};

export default ChatHeader;

