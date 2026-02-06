import { useState, useEffect } from 'react'; // v2
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';
import { useSidebar } from '@/components/ui/sidebar';

interface ForumHeaderProps {
  user: any;
  forumUser: ForumUser | null;
  isAdmin: boolean;
  isModerator?: boolean;
}

export default function ForumHeader({ user, forumUser, isAdmin, isModerator }: ForumHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const [cash, setCash] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (forumUser) {
      fetchCash();
      fetchUnreadMessages();
      fetchFriendRequests();
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

  const fetchUnreadMessages = async () => {
    if (!forumUser) return;
    const { count } = await supabase
      .from('forum_direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', forumUser.id)
      .eq('is_read', false);
    setUnreadMessages(count || 0);
  };

  const fetchFriendRequests = async () => {
    if (!forumUser) return;
    const { count } = await supabase
      .from('forum_friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', forumUser.id)
      .eq('status', 'pending');
    setFriendRequests(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleToggleSidebar = () => {
    setOpenMobile(true);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="topbar">
        {/* Mobile View - Only visible below 1024px */}
        <div className="topbar-mobile" style={{ display: 'none' }}>
          <button 
            onClick={handleToggleSidebar}
            className="topbar-sidebar-toggler"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to={user ? "/" : "/landing"} className="topbar-logo topbar-logo-mobile">
            <img src={bloxcityLogo} alt="BLOX City" />
          </Link>
          
          <div className="topbar-right">
            {!user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="topbar-link"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <ul className="dropdown-content navbar-user-dropdown">
                      <li className="dropdown-item"><Link to="/login" onClick={() => setUserDropdownOpen(false)}>Login</Link></li>
                      <li className="dropdown-item"><Link to="/register" onClick={() => setUserDropdownOpen(false)}>Register</Link></li>
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="topbar-link"
                >
                  {forumUser?.avatar_url ? (
                    <img src={forumUser.avatar_url} alt="" className="w-[35px] h-[35px] rounded-full object-cover" />
                  ) : (
                    <div className="w-[35px] h-[35px] rounded-full bg-white/20 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                    <ul className="dropdown-content navbar-user-dropdown">
                      <li className="dropdown-item"><Link to={`/user/${forumUser?.username}`} onClick={() => setUserDropdownOpen(false)}>Profile</Link></li>
                      <li className="dropdown-item"><Link to="/character" onClick={() => setUserDropdownOpen(false)}>Character</Link></li>
                      <li className="dropdown-item"><Link to="/settings" onClick={() => setUserDropdownOpen(false)}>Settings</Link></li>
                      <li className="dropdown-item"><button onClick={handleLogout} className="w-full text-left">Logout</button></li>
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop View - Always visible, full navigation */}
        <div className="topbar-desktop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <div className="topbar-left flex items-center">
            <Link to={user ? "/" : "/landing"} className="topbar-logo">
              <img src={bloxcityLogo} alt="BLOX City" style={{ height: 50 }} />
            </Link>
            <Link to={user ? "/" : "/landing"} className={`topbar-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
            <Link to="/games" className={`topbar-link ${isActive('/games') ? 'active' : ''}`}>Games</Link>
            <Link to="/market" className={`topbar-link ${isActive('/market') ? 'active' : ''}`}>Market</Link>
            <Link to="/forum" className={`topbar-link ${isActive('/forum') ? 'active' : ''}`}>Forum</Link>
            {user && (
              <Link to="/create" className={`topbar-link ${isActive('/create') ? 'active' : ''}`}>Create</Link>
            )}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="topbar-link"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {moreDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMoreDropdownOpen(false)} />
                  <ul className="dropdown-content navbar-more-dropdown">
                    <li className="dropdown-item"><Link to="/users" onClick={() => setMoreDropdownOpen(false)}>Users</Link></li>
                    <li className="dropdown-item"><Link to="/groups" onClick={() => setMoreDropdownOpen(false)}>Groups</Link></li>
                    <li className="dropdown-item"><Link to="/upgrade" onClick={() => setMoreDropdownOpen(false)}>Upgrade</Link></li>
                    <li className="dropdown-item"><a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer" onClick={() => setMoreDropdownOpen(false)}>Discord</a></li>
                  </ul>
                </>
              )}
            </div>
          </div>
          
          <div className="topbar-right flex items-center">
            {!user ? (
              <>
                <Link to="/login" className="topbar-link">Login</Link>
                <Link to="/register" className="topbar-link">Register</Link>
              </>
            ) : (
              <>
                <Link to="/messages" className="topbar-link" title={`${unreadMessages} Messages`}>
                  <span className="icon icon-inbox"></span> {unreadMessages}
                </Link>
                <Link to="/friends" className="topbar-link" title={`${friendRequests} Friend Requests`}>
                  <span className="icon icon-friends"></span> {friendRequests}
                </Link>
                <Link to="/convert" className="topbar-link" title={`${cash.toLocaleString()} Cash`}>
                  <span className="icon icon-cash"></span> {cash.toLocaleString()}
                </Link>
                <Link to="/convert" className="topbar-link" title={`${(forumUser?.coins || 0).toLocaleString()} Coins`}>
                  <span className="icon icon-coins"></span> {(forumUser?.coins || 0).toLocaleString()}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="topbar-link flex items-center gap-1"
                  >
                    {forumUser?.avatar_url ? (
                      <img src={forumUser.avatar_url} alt="" className="w-[25px] h-[25px] rounded-full object-cover mr-1" />
                    ) : (
                      <div className="w-[25px] h-[25px] rounded-full bg-white/20 flex items-center justify-center mr-1">
                        <User className="w-3 h-3" />
                      </div>
                    )}
                    <span className="max-w-[80px] truncate">{forumUser?.username || 'User'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                      <ul className="dropdown-content navbar-user-dropdown">
                        <li className="dropdown-item"><Link to={`/user/${forumUser?.username}`} onClick={() => setUserDropdownOpen(false)}>Profile</Link></li>
                        <li className="dropdown-item"><Link to="/character" onClick={() => setUserDropdownOpen(false)}>Character</Link></li>
                        <li className="dropdown-item"><Link to="/settings" onClick={() => setUserDropdownOpen(false)}>Settings</Link></li>
                        {(isAdmin || isModerator) && (
                          <li className="dropdown-item"><Link to="/admin" onClick={() => setUserDropdownOpen(false)}>Admin</Link></li>
                        )}
                        <li className="dropdown-item"><button onClick={handleLogout} className="w-full text-left">Logout</button></li>
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="topbar-push"></div>
    </>
  );
}
