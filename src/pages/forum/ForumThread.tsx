import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { getRelativeTime } from '@/lib/timeUtils';
import { format } from 'date-fns';

interface Post {
  id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  quoted_post_id: string | null;
  quoted_post?: {
    id: string;
    content: string;
    created_at: string;
    author_username: string;
    author_id: string;
  };
  author_id: string;
  author_username: string;
  author_avatar: string | null;
  author_post_count: number;
  author_joined: string;
  author_signature: string | null;
  author_is_online: boolean;
  is_staff: boolean;
}

interface Thread {
  id: string;
  title: string;
  is_locked: boolean;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  author_id: string;
  author_username: string;
  author_avatar: string | null;
  author_post_count: number;
  author_joined: string;
  author_signature: string | null;
  author_is_online: boolean;
  is_staff: boolean;
  first_post_content: string;
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
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
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const isLoggedIn = !!forumUser;

  useEffect(() => {
    if (threadId) {
      fetchThread();
      incrementViewCount();
    }
  }, [threadId]);

  const fetchThread = async () => {
    const { data: threadData } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (!threadData) {
      navigate('/forum');
      return;
    }

    // Get category
    const { data: cat } = await supabase
      .from('forum_categories')
      .select('id, name, slug')
      .eq('id', threadData.category_id)
      .single();

    // Get author
    const { data: author } = await supabase
      .from('forum_users')
      .select('id, username, avatar_url, post_count, created_at, signature, user_id')
      .eq('id', threadData.author_id)
      .single();

    // Check if author is staff
    let isStaff = false;
    if (author?.user_id) {
      const { data: role } = await supabase.rpc('get_staff_role', { _user_id: author.user_id });
      isStaff = !!role;
    }

    // Get first post content
    const { data: firstPost } = await supabase
      .from('forum_posts')
      .select('content')
      .eq('thread_id', threadData.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    setThread({
      id: threadData.id,
      title: threadData.title,
      is_locked: threadData.is_locked ?? false,
      is_pinned: threadData.is_pinned ?? false,
      is_deleted: threadData.is_deleted ?? false,
      created_at: threadData.created_at,
      category_id: cat?.id || '',
      category_name: cat?.name || 'Unknown',
      category_slug: cat?.slug || '',
      author_id: author?.id || '',
      author_username: author?.username || 'Unknown',
      author_avatar: author?.avatar_url || null,
      author_post_count: author?.post_count || 0,
      author_joined: author?.created_at || '',
      author_signature: author?.signature || null,
      author_is_online: false,
      is_staff: isStaff,
      first_post_content: firstPost?.content || '',
    });

    await fetchPosts();
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at');

    if (postsData) {
      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, username, avatar_url, post_count, created_at, signature, user_id')
            .eq('id', post.author_id)
            .single();

          let isStaff = false;
          if (author?.user_id) {
            const { data: role } = await supabase.rpc('get_staff_role', { _user_id: author.user_id });
            isStaff = !!role;
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
                .select('id, username')
                .eq('id', qp.author_id)
                .single();
              quotedPost = {
                id: qp.id,
                content: qp.content,
                created_at: qp.created_at,
                author_username: qpAuthor?.username || 'Unknown',
                author_id: qpAuthor?.id || '',
              };
            }
          }

          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            is_deleted: post.is_deleted ?? false,
            quoted_post_id: post.quoted_post_id,
            quoted_post: quotedPost,
            author_id: author?.id || '',
            author_username: author?.username || 'Unknown',
            author_avatar: author?.avatar_url || null,
            author_post_count: author?.post_count || 0,
            author_joined: author?.created_at || '',
            author_signature: author?.signature || null,
            author_is_online: false,
            is_staff: isStaff,
          };
        })
      );
      setPosts(postsWithAuthors);
    }
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
    } catch (e) {}
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !forumUser || thread?.is_locked) return;

    setSubmitting(true);

    const { error } = await supabase.from('forum_posts').insert({
      thread_id: threadId,
      author_id: forumUser.id,
      content: replyContent,
    });

    if (error) {
      toast.error('Failed to post reply');
    } else {
      toast.success('Reply posted!');
      setReplyContent('');
      fetchPosts();
    }

    setSubmitting(false);
  };

  const handleModAction = async (action: string, targetType: string, targetId: string) => {
    // Mod actions: switch_delete, switch_lock, switch_pin, scrub_title, scrub_body
    const { data, error } = await supabase.functions.invoke('forum-moderate-content', {
      body: { action, targetType, targetId },
    });
    if (error) {
      toast.error('Action failed');
    } else {
      toast.success('Action completed');
      fetchThread();
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white border border-[#ccc] rounded w-1/2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white border border-[#ccc] rounded" />
        ))}
      </div>
    );
  }

  if (!thread) {
    return <div className="text-center text-[#777]">Thread not found</div>;
  }

  const renderPost = (post: { 
    id: string; 
    content: string; 
    created_at: string; 
    is_deleted?: boolean;
    quoted_post?: Post['quoted_post'];
    author_id: string;
    author_username: string;
    author_avatar: string | null;
    author_post_count: number;
    author_joined: string;
    author_signature: string | null;
    author_is_online: boolean;
    is_staff: boolean;
  }, isThread: boolean) => (
    <div className={`forum-container forum-post-container ${post.is_deleted ? 'is-deleted' : ''}`} id={isThread ? undefined : `reply_${post.id}`}>
      <div className="grid-x grid-margin-x">
        {/* Author Sidebar */}
        <div className="cell small-4 medium-3 text-center">
          <div className="forum-thread-creator-username">
            <div 
              className={`forum-thread-status ${post.author_is_online ? 'status-online' : 'status-offline'}`} 
              title={`${post.author_username} is ${post.author_is_online ? 'online' : 'offline'}`}
            />
            <Link to={`/user/${post.author_username}`}>{post.author_username}</Link>
          </div>
          <Link to={`/user/${post.author_username}`}>
            <img 
              className="forum-thread-creator-avatar" 
              style={{ marginTop: 10, marginBottom: 10 }} 
              src={post.author_avatar || '/placeholder.svg'} 
              alt=""
            />
          </Link>
          <div className="forum-thread-stats">
            <div className="grid-x grid-margin-x">
              <div className="cell small-6 medium-3 medium-offset-3">
                <strong>Posts</strong>
              </div>
              <div className="cell small-6 medium-3">
                {post.author_post_count.toLocaleString()}
              </div>
            </div>
            <div className="grid-x grid-margin-x">
              <div className="cell small-6 medium-3 medium-offset-3">
                <strong>Joined</strong>
              </div>
              <div className="cell small-6 medium-3">
                {post.author_joined ? format(new Date(post.author_joined), 'MM/dd/yy') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="cell small-8 medium-9">
          <div className="forum-thread-time-posted">
            <i className="icon icon-time-ago"></i> Posted {getRelativeTime(post.created_at)}
          </div>

          {/* Actions (Report, Quote) */}
          {isLoggedIn && (
            <div style={{ float: 'right' }}>
              {!isThread && (
                <Link to={`/forum/quote/${post.id}`} className="forum-thread-quote">
                  <i className="icon icon-quote"></i>
                </Link>
              )}
            </div>
          )}

          {/* Quoted Post */}
          {post.quoted_post && (
            <div className="forum-quote">
              <div className="forum-quote-body">{post.quoted_post.content}</div>
              <div className="forum-quote-footer">
                <Link to={`/user/${post.quoted_post.author_username}`}>{post.quoted_post.author_username}</Link>
                , {format(new Date(post.quoted_post.created_at), 'MM-dd yyyy hh:mm a')}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="forum-thread-body" style={{ whiteSpace: 'pre-wrap' }}>
            {post.content}
          </div>

          {/* Signature */}
          {post.author_signature && (
            <div className="forum-signature">{post.author_signature}</div>
          )}

          {/* Mod Tools */}
          {isAdmin && (
            <div className="forum-mod-tools">
              {isThread ? (
                <>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('switch_delete', 'thread', post.id); }}>
                      {thread?.is_deleted ? 'Undelete' : 'Delete'}
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('scrub_title', 'thread', post.id); }}>
                      Scrub Title
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('scrub_body', 'thread', post.id); }}>
                      Scrub Body
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <Link to={`/forum/edit/thread/${post.id}`}>Edit Post</Link>
                  </div>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('switch_lock', 'thread', post.id); }}>
                      {thread?.is_locked ? 'Unlock' : 'Lock'}
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('switch_pin', 'thread', post.id); }}>
                      {thread?.is_pinned ? 'Unpin' : 'Pin'}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('switch_delete', 'reply', post.id); }}>
                      {post.is_deleted ? 'Undelete' : 'Delete'}
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleModAction('scrub', 'reply', post.id); }}>
                      Scrub
                    </a>
                  </div>
                  <div className="forum-mod-tool">
                    <Link to={`/forum/edit/reply/${post.id}`}>Edit Post</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Deleted Alert */}
      {thread.is_deleted && (
        <div className="alert alert-error" style={{ marginBottom: 15 }}>
          <div className="grid-x grid-margin-x align-middle">
            <div className="cell shrink left">
              <i className="icon icon-error"></i>
            </div>
            <div className="cell auto text-center">
              This thread is deleted.
              {isAdmin && (
                <>
                  &nbsp;&nbsp;
                  <a 
                    href="#" 
                    className="button button-green" 
                    style={{ fontSize: 11 }}
                    onClick={(e) => { e.preventDefault(); handleModAction('switch_delete', 'thread', thread.id); }}
                  >
                    Undelete
                  </a>
                </>
              )}
            </div>
            <div className="cell shrink right">
              <i className="icon icon-error"></i>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Buttons */}
      {isLoggedIn && (
        <div className="show-for-small-only text-center mb-4">
          <Link to="/forum/my-threads" className="button button-blue">My Threads</Link>
          <Link to="/forum/search" className="button button-red">Search Forum</Link>
        </div>
      )}

      {/* Navigation Row */}
      <div className="grid-x grid-margin-x mb-4">
        <div className="cell small-12 medium-6">
          <div className="forum-navigation">
            <div className="forum-navigation-item">
              <Link to="/forum">Forum</Link>
            </div>
            <div className="forum-navigation-item">
              <Link to="/forum">BLOX City</Link>
            </div>
            <div className="forum-navigation-item">
              <Link to={`/category/${thread.category_slug}`}>{thread.category_name}</Link>
            </div>
          </div>
        </div>
        {isLoggedIn && (
          <div className="cell small-12 medium-6 text-right hide-for-small-only">
            <div className="forum-auth-navigation">
              <div className="forum-auth-navigation-item">
                <Link to="/forum/my-threads">My Threads</Link>
              </div>
              <div className="forum-auth-navigation-item">
                <Link to="/forum/search">Search Forum</Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thread Title Header */}
      <div className="forum-header forum-thread-header">
        {thread.title}
      </div>

      {/* Thread as First Post + Replies */}
      <div className="container">
        {/* Thread as first post on first page */}
        {currentPage === 1 && renderPost({
          id: thread.id,
          content: thread.first_post_content,
          created_at: thread.created_at,
          is_deleted: thread.is_deleted,
          author_id: thread.author_id,
          author_username: thread.author_username,
          author_avatar: thread.author_avatar,
          author_post_count: thread.author_post_count,
          author_joined: thread.author_joined,
          author_signature: thread.author_signature,
          author_is_online: thread.author_is_online,
          is_staff: thread.is_staff,
        }, true)}

        {/* Replies */}
        {posts.map((post) => renderPost(post, false))}
      </div>

      {/* Reply Button */}
      {isLoggedIn && (!thread.is_locked || isAdmin) && (
        <>
          <div className="push-15"></div>
          <div className="text-center">
            <a href="#reply-form" className="forum-button">Reply</a>
          </div>
        </>
      )}

      {/* Reply Form */}
      {isLoggedIn && !thread.is_locked && (
        <>
          <div className="push-15"></div>
          <div className="forum-header forum-thread-header">Reply to "{thread.title}"</div>
          <div className="container forum-container" id="reply-form">
            <form onSubmit={handleSubmitReply}>
              <textarea 
                className="form-input" 
                name="body" 
                placeholder="Write your post here." 
                rows={5}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
              <button className="forum-button" type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
