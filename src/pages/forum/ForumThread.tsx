import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, User, Shield, Quote, Send, Lock, Clock, Edit2, Pin, Unlock, Trash2, Mail, Flag } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import UserAvatar from '@/components/forum/UserAvatar';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { getRelativeTime } from '@/lib/timeUtils';

// Character limits
const CHAR_LIMITS = {
  reply: 10000,
  quote: 500
};

interface Post {
  id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
  quoted_post_id: string | null;
  quoted_post?: {
    id: string;
    content: string;
    created_at: string;
    author?: { username: string; avatar_url: string | null };
  };
  author: {
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    signature: string | null;
    post_count: number;
    is_verified: boolean;
    membership_tier?: string | null;
    xp?: number;
  };
  is_staff?: boolean;
}

interface Thread {
  id: string;
  title: string;
  is_locked: boolean;
  is_pinned: boolean;
  is_deleted?: boolean;
  view_count: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, forumUser, isAdmin, emailVerified } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
    emailVerified: boolean | null;
  }>();

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const replyRemaining = CHAR_LIMITS.reply - replyContent.length;
  const isReplyOverLimit = replyRemaining < 0;

  useEffect(() => {
    if (threadId) {
      fetchThread();
      incrementViewCount();
      if (forumUser) fetchBlockedUsers();
    }
  }, [threadId, forumUser]);

  const fetchThread = async () => {
    const { data: threadData } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadData) {
      const { data: categoryData } = await supabase
        .from('forum_categories')
        .select('id, name, slug')
        .eq('id', threadData.category_id)
        .single();

      setThread({ 
        ...threadData, 
        is_pinned: threadData.is_pinned ?? false,
        is_locked: threadData.is_locked ?? false,
        category: categoryData || { id: '', name: 'Unknown', slug: '' }
      } as Thread);
      await fetchPosts();
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
     .eq('is_deleted', false)
      .order('created_at');

    if (postsData) {
      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, user_id, username, avatar_url, signature, post_count, is_verified, membership_tier, xp')
            .eq('id', post.author_id)
            .single();
          
          // Check if author is staff via admin_accounts
          let isStaff = false;
          if (author?.id) {
            const { data: adminAccount } = await supabase
              .from('admin_accounts')
              .select('staff_role')
              .eq('forum_user_id', author.id)
              .eq('is_active', true)
              .maybeSingle();
            isStaff = !!adminAccount;
          }
          
          let quotedPost = undefined;
          if (post.quoted_post_id) {
            const { data: qp } = await supabase
              .from('forum_posts')
              .select('id, content, created_at, author_id')
              .eq('id', post.quoted_post_id)
              .single();
            if (qp) {
              const { data: qpAuthor } = await supabase
                .from('forum_users')
                .select('username, avatar_url')
                .eq('id', qp.author_id)
                .single();
              quotedPost = { ...qp, author: qpAuthor };
            }
          }

          return { ...post, author, quoted_post: quotedPost, is_staff: isStaff };
        })
      );
      setPosts(postsWithAuthors as unknown as Post[]);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_blocked_users')
      .select('blocked_id')
      .eq('blocker_id', forumUser.id);
    setBlockedUsers((data || []).map(b => b.blocked_id));
  };

  const incrementViewCount = async () => {
    try {
      const { data: currentThread } = await supabase
        .from('forum_threads')
        .select('view_count')
        .eq('id', threadId)
        .single();
      
      if (currentThread) {
        await supabase
          .from('forum_threads')
          .update({ view_count: (currentThread.view_count || 0) + 1 })
          .eq('id', threadId);
      }
    } catch (e) {
      // Ignore errors
    }
  };

  const handleQuote = (post: Post) => {
    setQuotedPost(post);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !forumUser || thread?.is_locked) return;
    
    // Client-side validation
    if (replyContent.length > CHAR_LIMITS.reply) {
      toast.error(`Reply exceeds ${CHAR_LIMITS.reply} character limit`);
      return;
    }
    
    // Validate quote length
    if (quotedPost && quotedPost.content.length > CHAR_LIMITS.quote) {
      toast.error(`Quoted content exceeds ${CHAR_LIMITS.quote} character limit. Please select a shorter quote.`);
      return;
    }

    setSubmitting(true);
   
   // Check rate limit
   const { data: canPost } = await supabase.rpc('check_content_rate_limit', {
     p_forum_user_id: forumUser.id,
     p_content_type: 'post'
   });
   
   if (!canPost) {
     toast.error('Please wait 30 seconds between posts.');
     setSubmitting(false);
     return;
   }
    
    const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
      body: { 
        content: replyContent,
        contentType: 'reply',
        quoteContent: quotedPost?.content || null
      }
    });

    if (profanityCheck.data?.limitExceeded) {
      toast.error(profanityCheck.data.message);
      setSubmitting(false);
      return;
    }

    if (profanityCheck.data?.hasProfanity) {
      toast.error('Your post contains inappropriate content. Please revise.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('forum_posts').insert({
      thread_id: threadId,
      author_id: forumUser.id,
      content: replyContent,
      quoted_post_id: quotedPost?.id || null
    });

    if (error) {
      if (error.message.includes('row-level security') || error.code === '42501') {
        toast.error('Please wait 30 seconds between posts.');
      } else {
        toast.error('Failed to post reply');
      }
    } else {
      toast.success('Reply posted!');
      setReplyContent('');
      setQuotedPost(null);
      fetchPosts();

      await supabase.from('forum_threads').update({
        reply_count: posts.length + 1,
        last_post_at: new Date().toISOString(),
        last_post_by: forumUser.id
      }).eq('id', threadId);

      await supabase.from('forum_users').update({
        post_count: forumUser.post_count + 1
      }).eq('id', forumUser.id);
    }

    setSubmitting(false);
  };

  const handleTogglePin = async () => {
    if (!thread || !isAdmin) return;
    const newPinned = !thread.is_pinned;
    
    const { error } = await supabase
      .from('forum_threads')
      .update({ is_pinned: newPinned })
      .eq('id', thread.id);
    
    if (error) {
      toast.error('Failed to update thread');
    } else {
      setThread({ ...thread, is_pinned: newPinned });
      toast.success(newPinned ? 'Thread pinned' : 'Thread unpinned');
    }
  };

  const handleToggleLock = async () => {
    if (!thread || !isAdmin) return;
    const newLocked = !thread.is_locked;
    
    const { error } = await supabase
      .from('forum_threads')
      .update({ is_locked: newLocked })
      .eq('id', thread.id);
    
    if (error) {
      toast.error('Failed to update thread');
    } else {
      setThread({ ...thread, is_locked: newLocked });
      toast.success(newLocked ? 'Thread locked' : 'Thread unlocked');
    }
  };

  const handleDeletePost = async (postId: string) => {
    setDeletingPost(postId);
    
    try {
      const { data, error } = await supabase.functions.invoke('forum-moderate-content', {
        body: {
          action: 'delete',
          targetType: 'post',
          targetId: postId,
          reason: deleteReason || 'Violation of community guidelines'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Post deleted');
      setShowDeleteModal(null);
      setDeleteReason('');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post');
    }
    
    setDeletingPost(null);
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('forum-moderate-content', {
        body: {
          action: 'delete',
          targetType: 'thread',
          targetId: thread.id,
          reason: deleteReason || 'Violation of community guidelines'
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Thread deleted');
      window.location.href = `/category/${thread.category.slug}`;
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete thread');
    }
  };

  const getLevel = (xp: number = 0) => Math.floor(xp / 100) + 1;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[hsl(var(--bc-bg-card))] rounded w-1/2 border border-[hsl(var(--bc-border))]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))]" />
        ))}
      </div>
    );
  }

  if (!thread) {
    return <div className="text-center text-[hsl(var(--bc-text-muted))]">Thread not found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div />
        <div className="flex items-center gap-2">
          {(!thread.is_locked || isAdmin) && forumUser && (
            <a
              href="#reply-form"
              className="px-4 py-2 bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90 text-white rounded-lg font-medium transition"
            >
              Reply
            </a>
          )}
          {thread.is_locked && !isAdmin && (
            <button disabled className="px-4 py-2 bg-[hsl(var(--bc-text-muted))] text-white rounded-lg cursor-not-allowed">
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Deleted Alert */}
      {thread.is_deleted && (
        <div className="bg-[hsl(var(--bc-accent))] text-white text-center py-2 px-4 rounded-lg">
          This thread is deleted.
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm flex-wrap">
        <Link to="/" className="text-[hsl(var(--bc-primary))] hover:underline">Forum</Link>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
        <Link to={`/category/${thread.category.slug}`} className="text-[hsl(var(--bc-primary))] hover:underline">{thread.category.name}</Link>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
        <span className="text-[hsl(var(--bc-text))] truncate">{thread.title}</span>
      </nav>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTogglePin}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition ${
              thread.is_pinned 
                ? 'bg-[hsl(var(--bc-accent))] text-white' 
                : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleLock}
            className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition ${
              thread.is_locked 
                ? 'bg-[hsl(var(--bc-accent))] text-white' 
                : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
            }`}
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteModal('thread')}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
        <div className="divide-y divide-[hsl(var(--bc-border))]">
          {posts.map((post, index) => {
            const isBlocked = blockedUsers.includes(post.author.id);
            const isFirstPost = index === 0;
            
            return (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={isBlocked ? 'opacity-50' : ''}
              >
                {isBlocked ? (
                  <div className="p-4 text-sm text-[hsl(var(--bc-text-muted))]">
                    This user is blocked. Content hidden.
                  </div>
                ) : (
                  <div className="p-4">
                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 mb-2">
                      {forumUser && !thread.is_locked && (
                        <button
                          onClick={() => handleQuote(post)}
                          className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
                          title="Quote"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                      )}
                      {forumUser && post.author.id !== forumUser.id && !post.is_staff && (
                        <button className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition" title="Report">
                          <Flag className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Author Sidebar */}
                      <div className="md:w-40 flex-shrink-0 text-center">
                        {/* Online indicator + username */}
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className={`w-2 h-2 rounded-full ${post.is_staff ? 'bg-[hsl(var(--bc-accent))]' : 'bg-[hsl(var(--bc-text-muted))]'}`} />
                          <Link 
                            to={`/id/${post.author.username}/profile`}
                            className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] transition truncate"
                          >
                            {post.author.username}
                          </Link>
                          <VerificationBadge size="sm" forumUserId={post.author.id} isVerified={post.author.is_verified} />
                        </div>

                        {/* Avatar */}
                        <Link to={`/id/${post.author.username}/profile`} className="block mb-2">
                          <UserAvatar 
                            avatarUrl={post.author.avatar_url} 
                            username={post.author.username} 
                            size="xl"
                            className="mx-auto"
                          />
                        </Link>

                        {/* Staff/Membership Badge */}
                        {post.is_staff && (
                          <div className="inline-block bg-[hsl(var(--bc-accent))] text-white text-xs font-bold px-3 py-1 rounded mb-2">
                            Admin
                          </div>
                        )}
                        {!post.is_staff && post.author.membership_tier && (
                          <div className="mb-2">
                            <MembershipBadge tier={post.author.membership_tier as any} size="sm" />
                          </div>
                        )}

                        {/* Stats */}
                        <div className="text-xs text-[hsl(var(--bc-text-muted))] space-y-1 mt-2">
                          <div className="flex justify-between">
                            <span className="font-semibold">Level:</span>
                            <span>{getLevel(post.author.xp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold">Posts:</span>
                            <span>{post.author.post_count.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="flex-1 min-w-0">
                        {/* Timestamp */}
                        <div className="text-sm text-[hsl(var(--bc-text-muted))] mb-3 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Posted {getRelativeTime(post.created_at)}
                          {post.is_edited && (
                            <span className="italic"> (edited)</span>
                          )}
                        </div>

                        {/* Quoted Post */}
                        {post.quoted_post && (
                          <div className="bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 mb-3">
                            <div className="flex items-start gap-2">
                              {post.quoted_post.author?.avatar_url && (
                                <img src={post.quoted_post.author.avatar_url} alt="" className="w-8 h-8 rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                                  {getRelativeTime(post.quoted_post.created_at)}, <Link to={`/id/${post.quoted_post.author?.username}/profile`} className="text-[hsl(var(--bc-primary))]">{post.quoted_post.author?.username}</Link> wrote:
                                </div>
                                <div className="text-[hsl(var(--bc-text))] italic text-sm mt-1 line-clamp-3">
                                  {post.quoted_post.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="text-[hsl(var(--bc-text))] whitespace-pre-wrap">
                          {post.content}
                        </div>

                        {/* Signature */}
                        {post.author.signature && (
                          <>
                            <hr className="my-4 border-[hsl(var(--bc-border))]" />
                            <div className="text-sm text-[hsl(var(--bc-text-muted))] italic">
                              {post.author.signature}
                            </div>
                          </>
                        )}

                        {/* Admin Actions */}
                        {isAdmin && (
                          <>
                            <hr className="my-3 border-[hsl(var(--bc-border))]" />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowDeleteModal(post.id)}
                                className="p-1.5 bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-accent))] rounded transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] rounded transition">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply Form */}
      <div id="reply-form">
        {forumUser && !thread.is_locked && emailVerified ? (
          <form onSubmit={handleSubmitReply} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4">
            <h3 className="text-lg font-medium text-[hsl(var(--bc-text))] mb-3">Reply to this thread</h3>
            
            {quotedPost && (
              <div className="bg-[hsl(var(--bc-bg-light))] border-l-4 border-[hsl(var(--bc-primary))] p-3 mb-3 rounded flex items-start justify-between">
                <div>
                  <div className="text-xs text-[hsl(var(--bc-text-muted))] mb-1">
                    Quoting {quotedPost.author.username}:
                  </div>
                  <div className="text-[hsl(var(--bc-text))] text-sm line-clamp-2">
                    {quotedPost.content}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotedPost(null)}
                  className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] text-xl"
                >
                  ×
                </button>
              </div>
            )}

            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className={`w-full bg-[hsl(var(--bc-bg-light))] border rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent ${
                isReplyOverLimit ? 'border-red-500' : 'border-[hsl(var(--bc-border))]'
              }`}
              rows={4}
              required
              maxLength={CHAR_LIMITS.reply}
            />
            <div className={`text-xs mt-1 text-right ${isReplyOverLimit ? 'text-red-500 font-medium' : 'text-[hsl(var(--bc-text-muted))]'}`}>
              {replyContent.length}/{CHAR_LIMITS.reply}
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="submit"
                disabled={submitting || !replyContent.trim() || isReplyOverLimit}
                className="flex items-center gap-2 bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90 disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition font-medium"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        ) : forumUser && !thread.is_locked && emailVerified === false ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <Mail className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-amber-700 font-medium">Verify your email to reply</p>
            <p className="text-amber-600 text-sm mt-1">Check the banner above to send a verification email.</p>
          </div>
        ) : thread.is_locked ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <Lock className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">This thread is locked and cannot receive new replies.</p>
          </div>
        ) : user ? (
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4 text-center">
            <p className="text-[hsl(var(--bc-text-muted))]">
              You're signed in, but you need a forum profile to reply.
            </p>
            <div className="mt-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Create forum profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4 text-center">
            <p className="text-[hsl(var(--bc-text-muted))]">
              <Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">Login</Link>
              {' '}or{' '}
              <Link to="/register" className="text-[hsl(var(--bc-primary))] hover:underline">register</Link>
              {' '}to reply.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-[hsl(var(--bc-text))] mb-4">
              Delete {showDeleteModal === 'thread' ? 'Thread' : 'Post'}?
            </h3>
            <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
              This will soft-delete the content and notify the author via email.
            </p>
            <div className="mb-4">
              <label className="block text-sm text-[hsl(var(--bc-text-muted))] mb-2">Reason (optional)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Violation of community guidelines"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-3 py-2 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(null); setDeleteReason(''); }}
                className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => showDeleteModal === 'thread' ? handleDeleteThread() : handleDeletePost(showDeleteModal)}
                disabled={deletingPost !== null}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                {deletingPost ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
