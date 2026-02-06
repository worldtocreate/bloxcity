import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Store, MessageSquare, Search, ShoppingBasket, Plus, PenLine, Shield } from 'lucide-react';
import { Sidebar, SidebarContent, useSidebar } from '@/components/ui/sidebar';
import { ForumUser } from '@/hooks/useForumAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSidebarProps {
  forumUser?: ForumUser | null;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
}

export default function AppSidebar({ forumUser, isLoggedIn, isAdmin, isModerator }: AppSidebarProps) {
  const location = useLocation();
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
  const [cash, setCash] = useState(0);
  const [friendRequests, setFriendRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (forumUser) {
      fetchData();
    }
  }, [forumUser]);

  const fetchData = async () => {
    if (!forumUser) return;
    
    // Fetch cash
    const { data: userData } = await supabase
      .from('forum_users')
      .select('cash')
      .eq('id', forumUser.id)
      .single();
    if (userData) setCash((userData as any).cash || 0);

    // Fetch friend requests
    const { count: friendCount } = await supabase
      .from('forum_friend_requests')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', forumUser.id)
      .eq('status', 'pending');
    setFriendRequests(friendCount || 0);

    // Fetch unread messages
    const { count: msgCount } = await supabase
      .from('forum_direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', forumUser.id)
      .eq('is_read', false);
    setUnreadMessages(msgCount || 0);
  };

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  // MOBILE ONLY - sidebar is exclusively for mobile users
  // Desktop users get all features in the topbar
  if (!isMobile || !openMobile) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9]"
        onClick={() => setOpenMobile(false)}
      />
      
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-inner">
          <ul className="sidebar-items">
            <li className="item">
              <Link to={isLoggedIn ? '/' : '/landing'} onClick={handleLinkClick}>
                <Home className="sidebar-icon" />
                <span>Home</span>
              </Link>
            </li>
            <li className="item">
              <Link to="/games" onClick={handleLinkClick}>
                <Gamepad2 className="sidebar-icon" />
                <span>Games</span>
              </Link>
            </li>
            <li className="item">
              <Link to="/market" onClick={handleLinkClick}>
                <Store className="sidebar-icon" />
                <span>Market</span>
              </Link>
            </li>
            <li className="item">
              <Link to="/forum" onClick={handleLinkClick}>
                <MessageSquare className="sidebar-icon" />
                <span>Forum</span>
              </Link>
            </li>
            <li className="item">
              <Link to="/users" onClick={handleLinkClick}>
                <Search className="sidebar-icon" />
                <span>Users</span>
              </Link>
            </li>
            <li className="item">
              <Link to="/upgrade" onClick={handleLinkClick}>
                <ShoppingBasket className="sidebar-icon" />
                <span>Upgrade</span>
              </Link>
            </li>
            {isLoggedIn && (
              <li className="item">
                <Link to="/create" onClick={handleLinkClick}>
                  <Plus className="sidebar-icon" />
                  <span>Create</span>
                </Link>
              </li>
            )}
            <li className="item">
              <a href="https://blog.bloxcity.com" target="_blank" rel="noopener noreferrer">
                <PenLine className="sidebar-icon" />
                <span>Blog</span>
              </a>
            </li>
          </ul>

          {isLoggedIn && forumUser && (
            <>
              <div className="sidebar-divider"></div>
              <ul className="sidebar-items">
                <li className="item">
                  <Link to="/convert" onClick={handleLinkClick}>
                    <span className="icon icon-cash"></span>
                    <span>{cash.toLocaleString()} Cash</span>
                  </Link>
                </li>
                <li className="item">
                  <Link to="/convert" onClick={handleLinkClick}>
                    <span className="icon icon-coins"></span>
                    <span>{(forumUser.coins || 0).toLocaleString()} Coins</span>
                  </Link>
                </li>
                <li className="item">
                  <Link to="/friends" onClick={handleLinkClick}>
                    <span className="icon icon-friends"></span>
                    <span>{friendRequests} Friend Requests</span>
                  </Link>
                </li>
                <li className="item">
                  <Link to="/messages" onClick={handleLinkClick}>
                    <span className="icon icon-inbox"></span>
                    <span>{unreadMessages} Messages</span>
                  </Link>
                </li>
                {(isAdmin || isModerator) && (
                  <li className="item">
                    <Link to="/admin" onClick={handleLinkClick}>
                      <span className="icon icon-staff"></span>
                      <span>Panel</span>
                    </Link>
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}
