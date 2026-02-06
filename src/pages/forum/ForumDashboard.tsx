import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, Clock } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import WelcomeDialog from '@/components/forum/WelcomeDialog';

interface FriendStatus {
  id: string;
  username: string;
  avatar_url: string | null;
  status_text: string;
  status_updated_at: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  url: string;
}

export default function ForumDashboard() {
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { user, forumUser } = context || {};

  const [loading, setLoading] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<FriendStatus[]>([]);
  const [statusText, setStatusText] = useState('');
  const [postingStatus, setPostingStatus] = useState(false);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (forumUser) {
      fetchDashboardData();
      setStatusText(forumUser.status_text || '');
    }
  }, [forumUser]);

  const fetchDashboardData = async () => {
    if (!forumUser) return;
    
    setLoading(true);

    // Fetch friends with statuses (feed)
    const { data: friendships } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${forumUser.id},user_2_id.eq.${forumUser.id}`);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => 
        f.user_1_id === forumUser.id ? f.user_2_id : f.user_1_id
      );

      const { data: friends } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, status_text, status_updated_at')
        .in('id', friendIds)
        .not('status_text', 'is', null)
        .order('status_updated_at', { ascending: false });

      if (friends) {
        setFriendStatuses(friends as FriendStatus[]);
      }
    }

    // Mock blog posts (in a real app, fetch from API)
    setBlogPosts([
      { id: '1', title: 'BLOX City Update 2.0', excerpt: 'Exciting new features...', url: '#' },
      { id: '2', title: 'Community Spotlight', excerpt: 'Meet our top creators...', url: '#' },
    ]);

    setLoading(false);
  };

  const handlePostStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumUser || !statusText.trim()) return;
    
    setPostingStatus(true);
    try {
      const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
        body: { content: statusText }
      });

      if (profanityCheck.data?.hasProfanity) {
        toast.error('Your status contains inappropriate content. Please revise.');
        setPostingStatus(false);
        return;
      }

      const { error } = await supabase
        .from('forum_users')
        .update({ 
          status_text: statusText.trim(),
          status_updated_at: new Date().toISOString()
        })
        .eq('id', forumUser.id);

      if (error) {
        toast.error('Failed to post status');
      } else {
        toast.success('Status updated!');
      }
    } catch {
      toast.error('Failed to post status');
    }
    setPostingStatus(false);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // Not logged in - show public dashboard
  if (!user) {
    return (
      <div className="dashboard-page">
        <WelcomeDialog isLoggedIn={false} />
        
        <div className="container" style={{ textAlign: 'center', padding: '50px 25px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 500, marginBottom: '15px', color: '#333' }}>
            Welcome to BLOX City
          </h1>
          <p style={{ color: '#666', marginBottom: '25px' }}>
            Join our community to connect with friends, earn coins, and redeem exclusive memberships!
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <Link to="/login" className="button button-blue">Log In</Link>
            <Link to="/register" className="button button-gray">Sign Up</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0288d1' }} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Grid Layout - matching reference exactly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px' }}>
        
        {/* Left Column - Avatar + Blog */}
        <div>
          {/* Avatar Container */}
          <div className="container dashboard-avatar-container mb-25" style={{ marginBottom: '25px', textAlign: 'center' }}>
            {forumUser?.avatar_url ? (
              <img 
                src={forumUser.avatar_url} 
                alt={forumUser.username}
                className="dashboard-avatar"
                style={{ width: '100%', borderRadius: '4px' }}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                paddingBottom: '100%', 
                background: '#eee', 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <User style={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  width: '40%',
                  height: '40%',
                  color: '#aaa'
                }} />
              </div>
            )}
          </div>

          {/* Blog Section */}
          <div className="dashboard-header" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '10px' }}>
            Blog
          </div>
          <div className="container dashboard-blog-container">
            {blogPosts.length > 0 ? (
              blogPosts.map(post => (
                <div key={post.id} className="dashboard-blog-post" style={{ marginBottom: '25px' }}>
                  <a 
                    href={post.url} 
                    className="blog-post-title"
                    style={{ 
                      color: '#444', 
                      fontSize: '16px', 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block'
                    }}
                  >
                    {post.title}
                  </a>
                  <div 
                    className="blog-post-body"
                    style={{ color: '#666', fontSize: '12px' }}
                  >
                    {post.excerpt.length > 25 ? post.excerpt.substring(0, 25) + '...' : post.excerpt}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#666' }}>No updates found.</p>
            )}
          </div>
        </div>

        {/* Right Column - Status + Feed */}
        <div>
          {/* Status Form */}
          <div className="container mb-25" style={{ marginBottom: '25px' }}>
            <form onSubmit={handlePostStatus}>
              <input
                type="text"
                name="content"
                className="form-input"
                placeholder="What's up?"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                disabled={postingStatus}
                style={{ width: '100%' }}
              />
            </form>
          </div>

          {/* Feed Header */}
          <div className="dashboard-header" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '10px' }}>
            Feed
          </div>

          {/* Feed Container */}
          <div className="container dashboard-feed-container">
            {friendStatuses.length > 0 ? (
              friendStatuses.map(status => (
                <div key={status.id} className="dashboard-status" style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '15px' }}>
                    {/* Avatar Column */}
                    <div style={{ textAlign: 'center' }}>
                      <div 
                        className="dashboard-status-creator-avatar"
                        style={{
                          border: '1px solid #eee',
                          borderRadius: '50%',
                          width: '60px',
                          height: '60px',
                          overflow: 'hidden',
                          margin: '0 auto 5px'
                        }}
                      >
                        <Link to={`/user/${status.username}`}>
                          {status.avatar_url ? (
                            <img 
                              src={status.avatar_url} 
                              alt={status.username}
                              className="dashboard-status-creator-avatar-image"
                              style={{ width: '100%' }}
                            />
                          ) : (
                            <div style={{ 
                              width: '100%', 
                              height: '100%', 
                              background: '#eee',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <User style={{ width: '30px', height: '30px', color: '#aaa' }} />
                            </div>
                          )}
                        </Link>
                      </div>
                      <Link 
                        to={`/user/${status.username}`}
                        className="dashboard-status-creator"
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                          color: '#039be5',
                          fontSize: '14px'
                        }}
                      >
                        {status.username}
                      </Link>
                    </div>

                    {/* Content Column */}
                    <div>
                      <div 
                        className="dashboard-status-content"
                        style={{ wordWrap: 'break-word', marginTop: '5px', color: '#333' }}
                      >
                        {status.status_text}
                      </div>
                      <div 
                        className="dashboard-status-time"
                        style={{ color: '#777', fontSize: '14px', marginTop: '8px' }}
                      >
                        <Clock style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        {formatTimeAgo(status.status_updated_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div 
                  className="feed-no-notifications"
                  style={{ color: '#444', fontSize: '20px', marginBottom: '10px' }}
                >
                  You have no notifications.
                </div>
                <div 
                  className="feed-why-not"
                  style={{ color: '#666', fontSize: '15px' }}
                >
                  Why not try <Link to="/users" style={{ color: '#039be5' }}>searching for users</Link> or{' '}
                  <Link to="/forum" style={{ color: '#039be5' }}>chatting with users</Link> in our forum?
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
