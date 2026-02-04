import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Settings, Shield, User, Coins, Menu, DollarSign, Bell, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';
import { VerificationBadge } from './VerifiedBadge';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

// Inline NotificationBell component
function NotificationBellInline({ forumUserId }: { forumUserId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_notifications',
          filter: `recipient_id=eq.${forumUserId}`
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forumUserId]);

  const fetchNotifications = async () => {
    const { data, count } = await supabase
      .from('forum_notifications')
      .select('*, actor:actor_id(username, avatar_url)', { count: 'exact' })
      .eq('recipient_id', forumUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications(data || []);
    
    // Count unread
    const { count: unread } = await supabase
      .from('forum_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', forumUserId)
      .eq('is_read', false);
    
    setUnreadCount(unread || 0);
  };

  const markAllRead = async () => {
    await supabase
      .from('forum_notifications')
      .update({ is_read: true })
      .eq('recipient_id', forumUserId)
      .eq('is_read', false);
    
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getNotificationLink = (n: any) => {
    if (n.type === 'message') return '/messages';
    if (n.type === 'friend_request') return '/friends';
    if (n.type === 'follow') return `/user/${n.actor?.username}`;
    if (n.type === 'reply' && n.reference_id) return `/thread/${n.reference_id}`;
    if (n.type === 'trade') return '/trading';
    return '/';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
              <span className="font-semibold text-[hsl(var(--bc-text))]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[hsl(var(--bc-primary))] hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-[hsl(var(--bc-text-muted))]">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={getNotificationLink(n)}
                    onClick={() => setShowDropdown(false)}
                    className={`flex items-start gap-3 p-3 hover:bg-[hsl(var(--bc-bg-light))] transition ${!n.is_read ? 'bg-[hsla(var(--bc-primary),0.05)]' : ''}`}
                  >
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[hsl(var(--bc-text))]">{n.title}</p>
                      {n.content && <p className="text-xs text-[hsl(var(--bc-text-muted))] truncate">{n.content}</p>}
                      <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-[hsl(var(--bc-primary))]" />}
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Inline UnreadBadge component
function UnreadBadgeInline({ forumUserId }: { forumUserId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnread();
    
    const channel = supabase
      .channel('dm-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_direct_messages',
          filter: `recipient_id=eq.${forumUserId}`
        },
        () => {
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forumUserId]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('forum_direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', forumUserId)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  return (
    <Link 
      to="/messages"
      className="relative flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
    >
      <Mail className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

interface ForumHeaderProps {
  user: any;
  forumUser: ForumUser | null;
  isAdmin: boolean;
  isModerator?: boolean;
}

export default function ForumHeader({ user, forumUser, isAdmin, isModerator }: ForumHeaderProps) {
  const navigate = useNavigate();
  const [cash, setCash] = useState(0);

  useEffect(() => {
    if (forumUser) {
      fetchCash();
    }
  }, [forumUser]);

  const fetchCash = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_users')
      .select('cash')
      .eq('id', forumUser.id)
      .single();
    if (data) {
      setCash((data as any).cash || 0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))] sticky top-0 z-50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side: Sidebar trigger + Logo */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] transition">
            <Menu className="w-5 h-5" />
          </SidebarTrigger>
          
          <Link to="/" className="flex items-center gap-2">
            <img src={bloxcityLogo} alt="BLOX City" className="h-8 w-8 rounded-lg" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[hsl(var(--bc-text))] leading-tight">BLOX City</h1>
              <p className="text-xs text-[hsl(var(--bc-text-muted))] leading-tight">Community</p>
            </div>
          </Link>
        </div>

        {/* Right side: User actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {/* Currency (only when logged in) */}
              {forumUser && (
                <>
                  <Link 
                    to="/convert"
                    className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] px-2 sm:px-3 py-1.5 rounded-lg transition"
                  >
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium text-sm">{forumUser.coins?.toLocaleString() || 0}</span>
                  </Link>
                  
                  <Link 
                    to="/convert"
                    className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] px-2 sm:px-3 py-1.5 rounded-lg transition"
                  >
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">{cash}</span>
                  </Link>
                </>
              )}

              {forumUser && (
                <>
                  <NotificationBellInline forumUserId={forumUser.id} />
                  <UnreadBadgeInline forumUserId={forumUser.id} />
                </>
              )}
              
              {(isAdmin || isModerator) && (
                <Link 
                  to="/admin"
                  className={`flex items-center gap-2 hover:opacity-80 transition p-2 ${
                    isAdmin ? 'text-[hsl(var(--bc-accent))]' : 'text-blue-500'
                  }`}
                  title={isAdmin ? "Admin Panel" : "Moderator Panel"}
                >
                  <Shield className="w-5 h-5" />
                </Link>
              )}
              
              <Link 
                to={`/user/${forumUser?.username}`}
                className="flex items-center gap-2"
              >
                {forumUser?.avatar_url ? (
                  <img 
                    src={forumUser.avatar_url} 
                    alt={forumUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-[hsl(var(--bc-text))] font-medium hidden md:flex items-center gap-1">
                  {forumUser?.username || 'User'}
                  <VerificationBadge size="md" forumUserId={forumUser?.id} isVerified={forumUser?.is_verified} />
                  {isAdmin && <Shield className="w-3 h-3 text-[hsl(var(--bc-accent))]" />}
                </span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-secondary))] transition p-2"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition px-3 py-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link 
                to="/register"
                className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-3 sm:px-4 py-2 rounded-lg transition font-medium text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
