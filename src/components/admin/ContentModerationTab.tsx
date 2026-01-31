import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RotateCcw, Search, RefreshCw, Eye, MessageSquare, FileText, Clock, User } from 'lucide-react';
import { toast } from 'sonner';

interface DeletedPost {
  id: string;
  content: string;
  deleted_at: string;
  deletion_reason: string;
  thread_id: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
}

interface DeletedThread {
  id: string;
  title: string;
  deleted_at: string;
  deletion_reason: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
  category: {
    name: string;
  };
}

interface ContentModerationTabProps {
  darkMode: boolean;
}

export default function ContentModerationTab({ darkMode }: ContentModerationTabProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'logs'>('posts');
  const [deletedPosts, setDeletedPosts] = useState<DeletedPost[]>([]);
  const [deletedThreads, setDeletedThreads] = useState<DeletedThread[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    
    if (activeTab === 'posts') {
      const { data } = await supabase
        .from('forum_posts')
        .select('id, content, deleted_at, deletion_reason, thread_id, author:author_id (username, avatar_url)')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });
      
      setDeletedPosts((data || []) as unknown as DeletedPost[]);
    } else if (activeTab === 'threads') {
      const { data } = await supabase
        .from('forum_threads')
        .select('id, title, deleted_at, deletion_reason, author:author_id (username, avatar_url), category:category_id (name)')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });
      
      setDeletedThreads((data || []) as unknown as DeletedThread[]);
    } else if (activeTab === 'logs') {
      const { data } = await supabase
        .from('forum_moderation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      setModerationLogs(data || []);
    }
    
    setLoading(false);
  };

  const handleRestore = async (targetType: 'post' | 'thread', targetId: string) => {
    setProcessing(targetId);
    
    try {
      const { data, error } = await supabase.functions.invoke('forum-moderate-content', {
        body: { action: 'restore', targetType, targetId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`${targetType === 'post' ? 'Post' : 'Thread'} restored successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore content');
    }
    
    setProcessing(null);
  };

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${textClass}`}>Content Moderation</h2>
        <div className="flex items-center gap-3">
          {activeTab !== 'logs' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className={`pl-9 pr-4 py-2 w-64 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
              />
            </div>
          )}
          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'posts'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Deleted Posts
          {deletedPosts.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {deletedPosts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('threads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'threads'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Deleted Threads
          {deletedThreads.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {deletedThreads.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Moderation Log
        </button>
      </div>

      {/* Deleted Posts */}
      {activeTab === 'posts' && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loading ? (
            <div className={`p-8 text-center ${mutedClass}`}>Loading...</div>
          ) : deletedPosts.length === 0 ? (
            <div className={`p-8 text-center ${mutedClass}`}>No deleted posts</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {deletedPosts
                .filter(post => !search || post.content.toLowerCase().includes(search.toLowerCase()) || post.author?.username?.toLowerCase().includes(search.toLowerCase()))
                .map(post => (
                  <div key={post.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className={`font-medium ${textClass}`}>{post.author?.username}</span>
                          <span className={`text-xs ${mutedClass}`}>
                            • Deleted {new Date(post.deleted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm ${mutedClass} line-clamp-2`}>{post.content}</p>
                        <p className="text-xs text-red-400 mt-1">Reason: {post.deletion_reason}</p>
                      </div>
                      <button
                        onClick={() => handleRestore('post', post.id)}
                        disabled={processing === post.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Deleted Threads */}
      {activeTab === 'threads' && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loading ? (
            <div className={`p-8 text-center ${mutedClass}`}>Loading...</div>
          ) : deletedThreads.length === 0 ? (
            <div className={`p-8 text-center ${mutedClass}`}>No deleted threads</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {deletedThreads
                .filter(thread => !search || thread.title.toLowerCase().includes(search.toLowerCase()) || thread.author?.username?.toLowerCase().includes(search.toLowerCase()))
                .map(thread => (
                  <div key={thread.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${textClass}`}>{thread.title}</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">{thread.category?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {thread.author?.avatar_url ? (
                            <img src={thread.author.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          <span className={`text-sm ${mutedClass}`}>{thread.author?.username}</span>
                          <span className={`text-xs ${mutedClass}`}>
                            • Deleted {new Date(thread.deleted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-red-400 mt-1">Reason: {thread.deletion_reason}</p>
                      </div>
                      <button
                        onClick={() => handleRestore('thread', thread.id)}
                        disabled={processing === thread.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Moderation Logs */}
      {activeTab === 'logs' && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loading ? (
            <div className={`p-8 text-center ${mutedClass}`}>Loading...</div>
          ) : moderationLogs.length === 0 ? (
            <div className={`p-8 text-center ${mutedClass}`}>No moderation actions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${mutedClass}`}>Action</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${mutedClass}`}>Type</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${mutedClass}`}>Reason</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${mutedClass}`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationLogs.map(log => (
                    <tr key={log.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          log.action === 'delete' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {log.action === 'delete' ? <Trash2 className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
                          {log.action}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-sm ${textClass}`}>{log.target_type}</td>
                      <td className={`px-6 py-3 text-sm ${mutedClass}`}>{log.reason || '-'}</td>
                      <td className={`px-6 py-3 text-sm ${mutedClass}`}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
