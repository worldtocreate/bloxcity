import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, RotateCcw, Search, RefreshCw, MessageSquare, FileText, Clock, User, Image, Check, X, Loader2, Mail, BadgeCheck, Send, Gamepad2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeletedPost {
  id: string;
  content: string;
  deleted_at: string;
  deletion_reason: string;
  thread_id: string;
  author: { username: string; avatar_url: string | null };
}

interface DeletedThread {
  id: string;
  title: string;
  deleted_at: string;
  deletion_reason: string;
  author: { username: string; avatar_url: string | null };
  category: { name: string };
}

interface GroupMediaRequest {
  id: string;
  group_id: string;
  media_type: 'icon' | 'cover';
  image_url: string;
  status: string;
  created_at: string;
  group: { name: string; slug: string };
}

interface GameThumbnailRequest {
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_status: string;
  thumbnail_denial_reason: string | null;
  is_under_review: boolean;
  creator: { username: string; avatar_url: string | null };
}

interface AffiliateRequest {
  id: string;
  status: string;
  admin_approved: boolean;
  email_sent_at: string | null;
  user_accepted: boolean;
  created_at: string;
  gold_user: { username: string; avatar_url: string | null };
  affiliate_user: { username: string; avatar_url: string | null };
}

export default function ContentModerationTab() {
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'group-media' | 'game-thumbnails' | 'affiliates' | 'logs'>('posts');
  const [deletedPosts, setDeletedPosts] = useState<DeletedPost[]>([]);
  const [deletedThreads, setDeletedThreads] = useState<DeletedThread[]>([]);
  const [groupMediaRequests, setGroupMediaRequests] = useState<GroupMediaRequest[]>([]);
  const [gameThumbnailRequests, setGameThumbnailRequests] = useState<GameThumbnailRequest[]>([]);
  const [affiliateRequests, setAffiliateRequests] = useState<AffiliateRequest[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'posts') {
      const { data } = await supabase.from('forum_posts').select('id, content, deleted_at, deletion_reason, thread_id, author:author_id (username, avatar_url)').eq('is_deleted', true).order('deleted_at', { ascending: false });
      setDeletedPosts((data || []) as unknown as DeletedPost[]);
    } else if (activeTab === 'threads') {
      const { data } = await supabase.from('forum_threads').select('id, title, deleted_at, deletion_reason, author:author_id (username, avatar_url), category:category_id (name)').eq('is_deleted', true).order('deleted_at', { ascending: false });
      setDeletedThreads((data || []) as unknown as DeletedThread[]);
    } else if (activeTab === 'group-media') {
      const { data } = await supabase.from('forum_group_media_requests').select('*, group:group_id (name, slug)').eq('status', 'pending').order('created_at', { ascending: false });
      setGroupMediaRequests((data || []) as unknown as GroupMediaRequest[]);
    } else if (activeTab === 'game-thumbnails') {
      const { data } = await supabase.from('forum_games').select('id, title, thumbnail_url, thumbnail_status, thumbnail_denial_reason, is_under_review, creator:creator_id (username, avatar_url)').or('thumbnail_status.eq.pending,is_under_review.eq.true').order('created_at', { ascending: false });
      setGameThumbnailRequests((data || []) as unknown as GameThumbnailRequest[]);
    } else if (activeTab === 'affiliates') {
      const { data } = await supabase.from('forum_affiliate_requests').select('id, status, admin_approved, email_sent_at, user_accepted, created_at, gold_user:gold_user_id (username, avatar_url), affiliate_user:affiliate_user_id (username, avatar_url)').order('created_at', { ascending: false });
      setAffiliateRequests((data || []) as unknown as AffiliateRequest[]);
    } else if (activeTab === 'logs') {
      const { data } = await supabase.from('forum_moderation_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setModerationLogs(data || []);
    }
    setLoading(false);
  };

  const handleApproveAffiliate = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase.from('forum_affiliate_requests').update({ admin_approved: true, admin_approved_at: new Date().toISOString() }).eq('id', requestId);
      if (error) throw error;
      toast.success('Request approved!');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to approve'); }
    setProcessing(null);
  };

  const handleSendAffiliateEmail = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-users', { body: { action: 'send_affiliate_email', requestId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Email sent!');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to send email'); }
    setProcessing(null);
  };

  const handleDenyAffiliate = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase.from('forum_affiliate_requests').update({ status: 'denied' }).eq('id', requestId);
      if (error) throw error;
      toast.success('Request denied');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to deny'); }
    setProcessing(null);
  };

  const handleRestore = async (targetType: 'post' | 'thread', targetId: string) => {
    setProcessing(targetId);
    try {
      const { data, error } = await supabase.functions.invoke('forum-moderate-content', { body: { action: 'restore', targetType, targetId } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success(`${targetType === 'post' ? 'Post' : 'Thread'} restored`);
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to restore'); }
    setProcessing(null);
  };

  const handleApproveGroupMedia = async (request: GroupMediaRequest) => {
    setProcessing(request.id);
    try {
      const updateField = request.media_type === 'icon' ? 'icon_url' : 'cover_url';
      const { error: updateError } = await supabase.from('forum_groups').update({ [updateField]: request.image_url }).eq('id', request.group_id);
      if (updateError) throw updateError;
      const { error: requestError } = await supabase.from('forum_group_media_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', request.id);
      if (requestError) throw requestError;
      toast.success(`Group ${request.media_type} approved!`);
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to approve'); }
    setProcessing(null);
  };

  const handleDenyGroupMedia = async (requestId: string) => {
    if (!denialReason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessing(requestId);
    try {
      const { error } = await supabase.from('forum_group_media_requests').update({ status: 'denied', denial_reason: denialReason.trim(), reviewed_at: new Date().toISOString() }).eq('id', requestId);
      if (error) throw error;
      toast.success('Request denied');
      setShowDenyModal(null);
      setDenialReason('');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to deny'); }
    setProcessing(null);
  };

  const handleApproveGameThumbnail = async (gameId: string) => {
    setProcessing(gameId);
    try {
      const { error } = await supabase.from('forum_games').update({ thumbnail_status: 'approved', thumbnail_denial_reason: null }).eq('id', gameId);
      if (error) throw error;
      toast.success('Thumbnail approved!');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to approve'); }
    setProcessing(null);
  };

  const handleDenyGameThumbnail = async (gameId: string) => {
    if (!denialReason.trim()) { toast.error('Please provide a reason'); return; }
    setProcessing(gameId);
    try {
      const { error } = await supabase.from('forum_games').update({ thumbnail_status: 'denied', thumbnail_denial_reason: denialReason.trim(), thumbnail_url: null }).eq('id', gameId);
      if (error) throw error;
      toast.success('Thumbnail denied');
      setShowDenyModal(null);
      setDenialReason('');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to deny'); }
    setProcessing(null);
  };

  const handleToggleGameReview = async (gameId: string, currentStatus: boolean) => {
    setProcessing(gameId);
    try {
      const { error } = await supabase.from('forum_games').update({ is_under_review: !currentStatus }).eq('id', gameId);
      if (error) throw error;
      toast.success(currentStatus ? 'Game removed from review' : 'Game placed under review');
      fetchData();
    } catch (err: any) { toast.error(err.message || 'Failed to update'); }
    setProcessing(null);
  };

  const tabs: { key: typeof activeTab; label: string; icon: any; badge?: number }[] = [
    { key: 'posts', label: 'Deleted Posts', icon: MessageSquare },
    { key: 'threads', label: 'Deleted Threads', icon: FileText },
    { key: 'group-media', label: 'Group Media', icon: Image, badge: groupMediaRequests.length },
    { key: 'game-thumbnails', label: 'Game Thumbnails', icon: Gamepad2, badge: gameThumbnailRequests.length },
    { key: 'affiliates', label: 'Affiliates', icon: BadgeCheck, badge: affiliateRequests.filter(r => r.status === 'pending').length },
    { key: 'logs', label: 'Moderation Log', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Content Moderation</h2>
        <div className="flex items-center gap-3">
          {activeTab !== 'logs' && activeTab !== 'group-media' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-10 pr-4 py-2.5 w-64 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50" />
            </div>
          )}
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f18] border border-white/5 hover:border-white/10 text-gray-300 rounded-xl transition text-sm font-medium">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.key ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-[#0f0f18] border border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && tab.badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
        ) : (
          <>
            {/* Deleted Posts */}
            {activeTab === 'posts' && (
              deletedPosts.length === 0 ? <div className="text-center py-12 text-gray-500">No deleted posts</div> : (
                <div className="divide-y divide-white/5">
                  {deletedPosts.filter(p => !search || p.content.toLowerCase().includes(search.toLowerCase()) || p.author?.username?.toLowerCase().includes(search.toLowerCase())).map(post => (
                    <div key={post.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>}
                          <span className="font-medium text-white">{post.author?.username}</span>
                          <span className="text-xs text-gray-500">{new Date(post.deleted_at).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2">{post.content}</p>
                        {post.deletion_reason && <p className="text-xs text-red-400 mt-1">Reason: {post.deletion_reason}</p>}
                      </div>
                      <button onClick={() => handleRestore('post', post.id)} disabled={processing === post.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                        {processing === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}Restore
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Deleted Threads */}
            {activeTab === 'threads' && (
              deletedThreads.length === 0 ? <div className="text-center py-12 text-gray-500">No deleted threads</div> : (
                <div className="divide-y divide-white/5">
                  {deletedThreads.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.author?.username?.toLowerCase().includes(search.toLowerCase())).map(thread => (
                    <div key={thread.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{thread.title}</span>
                          <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-xs rounded-full">{thread.category?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>by {thread.author?.username}</span>
                          <span>{new Date(thread.deleted_at).toLocaleString()}</span>
                        </div>
                        {thread.deletion_reason && <p className="text-xs text-red-400 mt-1">Reason: {thread.deletion_reason}</p>}
                      </div>
                      <button onClick={() => handleRestore('thread', thread.id)} disabled={processing === thread.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                        {processing === thread.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}Restore
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Group Media */}
            {activeTab === 'group-media' && (
              groupMediaRequests.length === 0 ? <div className="text-center py-12 text-gray-500">No pending group media requests</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                  {groupMediaRequests.map(request => (
                    <div key={request.id} className="bg-white/5 rounded-xl overflow-hidden">
                      <img src={request.image_url} alt="" className={`w-full ${request.media_type === 'icon' ? 'aspect-square' : 'h-24'} object-cover`} />
                      <div className="p-3 space-y-2">
                        <div className="text-sm text-white font-medium">{request.group?.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{request.media_type}</div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveGroupMedia(request)} disabled={processing === request.id} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                            {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setShowDenyModal(request.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Game Thumbnails */}
            {activeTab === 'game-thumbnails' && (
              gameThumbnailRequests.length === 0 ? <div className="text-center py-12 text-gray-500">No pending game thumbnails</div> : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                  {gameThumbnailRequests.map(game => (
                    <div key={game.id} className="bg-white/5 rounded-xl overflow-hidden">
                      {game.thumbnail_url ? <img src={game.thumbnail_url} alt="" className="w-full aspect-video object-cover" /> : <div className="w-full aspect-video bg-white/5 flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-gray-600" /></div>}
                      <div className="p-3 space-y-2">
                        <div className="text-sm text-white font-medium truncate">{game.title}</div>
                        <div className="text-xs text-gray-500">by {game.creator?.username}</div>
                        {game.is_under_review && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full"><AlertTriangle className="w-3 h-3" />Under Review</span>}
                        <div className="flex gap-2">
                          {game.thumbnail_status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveGameThumbnail(game.id)} disabled={processing === game.id} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                                {processing === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button onClick={() => setShowDenyModal(game.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => handleToggleGameReview(game.id, game.is_under_review)} disabled={processing === game.id} className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-sm ${game.is_under_review ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'}`}>
                            {game.is_under_review ? 'Clear' : 'Flag'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Affiliates */}
            {activeTab === 'affiliates' && (
              affiliateRequests.length === 0 ? <div className="text-center py-12 text-gray-500">No affiliate requests</div> : (
                <div className="divide-y divide-white/5">
                  {affiliateRequests.map(request => (
                    <div key={request.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {request.gold_user?.avatar_url ? <img src={request.gold_user.avatar_url} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"><User className="w-4 h-4 text-amber-400" /></div>}
                          <span className="text-white font-medium">{request.gold_user?.username}</span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex items-center gap-2">
                          {request.affiliate_user?.avatar_url ? <img src={request.affiliate_user.avatar_url} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center"><User className="w-4 h-4 text-blue-400" /></div>}
                          <span className="text-white">{request.affiliate_user?.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && !request.admin_approved && (
                          <>
                            <button onClick={() => handleApproveAffiliate(request.id)} disabled={processing === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                              {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Approve
                            </button>
                            <button onClick={() => handleDenyAffiliate(request.id)} disabled={processing === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" />Deny</button>
                          </>
                        )}
                        {request.admin_approved && !request.email_sent_at && (
                          <button onClick={() => handleSendAffiliateEmail(request.id)} disabled={processing === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                            {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send Email
                          </button>
                        )}
                        {request.email_sent_at && <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Email Sent</span>}
                        {request.status === 'denied' && <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded-full">Denied</span>}
                        {request.user_accepted && <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Accepted</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Moderation Logs */}
            {activeTab === 'logs' && (
              moderationLogs.length === 0 ? <div className="text-center py-12 text-gray-500">No moderation logs</div> : (
                <div className="divide-y divide-white/5">
                  {moderationLogs.map((log, i) => (
                    <div key={i} className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{log.action}</span>
                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      {log.details && <p className="text-sm text-gray-400">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</p>}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Deny Request</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Reason</label><textarea value={denialReason} onChange={(e) => setDenialReason(e.target.value)} placeholder="Reason for denial..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDenyModal(null); setDenialReason(''); }} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => { if (activeTab === 'group-media') handleDenyGroupMedia(showDenyModal); else if (activeTab === 'game-thumbnails') handleDenyGameThumbnail(showDenyModal); }} disabled={processing === showDenyModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">
                {processing === showDenyModal && <Loader2 className="w-4 h-4 animate-spin" />}Deny
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
