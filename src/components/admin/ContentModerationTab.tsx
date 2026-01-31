import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RotateCcw, Search, RefreshCw, MessageSquare, FileText, Clock, User, Image, Check, X, Loader2 } from 'lucide-react';
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

interface GroupMediaRequest {
  id: string;
  group_id: string;
  media_type: 'icon' | 'cover';
  image_url: string;
  status: string;
  created_at: string;
  group: {
    name: string;
    slug: string;
  };
}

interface ContentModerationTabProps {
  darkMode: boolean;
}

export default function ContentModerationTab({ darkMode }: ContentModerationTabProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'group-media' | 'logs'>('posts');
  const [deletedPosts, setDeletedPosts] = useState<DeletedPost[]>([]);
  const [deletedThreads, setDeletedThreads] = useState<DeletedThread[]>([]);
  const [groupMediaRequests, setGroupMediaRequests] = useState<GroupMediaRequest[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null);

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
    } else if (activeTab === 'group-media') {
      const { data } = await supabase
        .from('forum_group_media_requests')
        .select('*, group:group_id (name, slug)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setGroupMediaRequests((data || []) as unknown as GroupMediaRequest[]);
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

  const handleApproveGroupMedia = async (request: GroupMediaRequest) => {
    setProcessing(request.id);
    
    try {
      // Update the group with the new image
      const updateField = request.media_type === 'icon' ? 'icon_url' : 'cover_url';
      const { error: updateError } = await supabase
        .from('forum_groups')
        .update({ [updateField]: request.image_url })
        .eq('id', request.group_id);

      if (updateError) throw updateError;

      // Mark request as approved
      const { error: requestError } = await supabase
        .from('forum_group_media_requests')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      toast.success(`Group ${request.media_type} approved!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    }
    
    setProcessing(null);
  };

  const handleDenyGroupMedia = async (requestId: string) => {
    if (!denialReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    setProcessing(requestId);
    
    try {
      const { error } = await supabase
        .from('forum_group_media_requests')
        .update({ 
          status: 'denied',
          denial_reason: denialReason.trim(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request denied');
      setShowDenyModal(null);
      setDenialReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deny');
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
          {activeTab !== 'logs' && activeTab !== 'group-media' && (
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
      <div className="flex gap-2 flex-wrap">
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
        </button>
        <button
          onClick={() => setActiveTab('group-media')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'group-media'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Image className="w-4 h-4" />
          Group Media
          {groupMediaRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {groupMediaRequests.length}
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

      {/* Group Media Requests */}
      {activeTab === 'group-media' && (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loading ? (
            <div className={`p-8 text-center ${mutedClass}`}>Loading...</div>
          ) : groupMediaRequests.length === 0 ? (
            <div className={`p-8 text-center ${mutedClass}`}>
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending group media requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {groupMediaRequests.map(request => (
                <div key={request.id} className={`border rounded-xl overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="relative">
                    <img 
                      src={request.image_url} 
                      alt={`${request.group?.name} ${request.media_type}`}
                      className={`w-full object-cover ${request.media_type === 'icon' ? 'h-32' : 'h-40'}`}
                    />
                    <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                      request.media_type === 'icon' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-purple-600 text-white'
                    }`}>
                      {request.media_type === 'icon' ? 'Icon' : 'Cover'}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className={`font-medium ${textClass} truncate`}>{request.group?.name}</h4>
                    <p className={`text-xs ${mutedClass}`}>
                      Submitted {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApproveGroupMedia(request)}
                        disabled={processing === request.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        {processing === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => setShowDenyModal(request.id)}
                        disabled={processing === request.id}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                      >
                        <X className="w-4 h-4" />
                        Deny
                      </button>
                    </div>
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

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} border rounded-xl p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-4`}>Deny Request</h3>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial..."
              className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowDenyModal(null); setDenialReason(''); }}
                className={`flex-1 px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyGroupMedia(showDenyModal)}
                disabled={processing === showDenyModal}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {processing === showDenyModal && <Loader2 className="w-4 h-4 animate-spin" />}
                Deny
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}