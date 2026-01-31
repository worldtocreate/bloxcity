import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Settings, Shield, User, Coins, Menu, Home, MessageSquare, Users, Briefcase, Star, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import UnreadBadge from './UnreadBadge';
import VerifiedBadge from './VerifiedBadge';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface ForumHeaderProps {
  user: any;
  forumUser: ForumUser | null;
  isAdmin: boolean;
}

export default function ForumHeader({ user, forumUser, isAdmin }: ForumHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/forum', icon: MessageSquare, label: 'Forum' },
    { href: '/players', icon: Users, label: 'Players' },
    { href: '/groups', icon: Briefcase, label: 'Groups' },
    { href: '/market', icon: ShoppingBag, label: 'Catalog' },
    { href: '/games', icon: Star, label: 'Games' },
  ];

  return (
    <header className="bg-[hsl(var(--bc-table-header))] sticky top-0 z-50">
      {/* Top bar with logo and user actions */}
      <div className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="p-2 rounded hover:bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text-muted))] transition lg:hidden">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            
            <Link to="/" className="flex items-center gap-2">
              <img src={bloxcityLogo} alt="BLOX City" className="h-10 w-10 rounded" />
              <span className="text-xl font-bold text-[hsl(var(--bc-primary))] hidden sm:block">BLOX City</span>
            </Link>
          </div>

          {/* Right: User actions */}
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1 text-[hsl(var(--bc-text))] text-sm">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{forumUser?.coins?.toLocaleString() || 0}</span>
            </div>

            {user ? (
              <>
                {forumUser && <UnreadBadge forumUserId={forumUser.id} />}
                
                {isAdmin && (
                  <Link 
                    to="/admin"
                    className="text-[hsl(var(--bc-secondary))] hover:opacity-80 transition p-1"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </Link>
                )}
                
                <Link 
                  to={`/user/${forumUser?.username}`}
                  className="flex items-center gap-2 text-[hsl(var(--bc-link))] hover:underline text-sm"
                >
                  {forumUser?.avatar_url ? (
                    <img 
                      src={forumUser.avatar_url} 
                      alt={forumUser.username}
                      className="w-6 h-6 rounded object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:flex items-center gap-1">
                    {forumUser?.username || 'User'}
                    {forumUser?.is_verified && <VerifiedBadge size="sm" />}
                  </span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-secondary))] transition text-sm"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="text-[hsl(var(--bc-link))] hover:underline text-sm"
                >
                  Login
                </Link>
                <Link 
                  to="/register"
                  className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-3 py-1.5 rounded text-sm transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation bar - teal background */}
      <nav className="max-w-6xl mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className="flex items-center gap-1.5 px-4 py-2.5 text-white/90 hover:text-white hover:bg-white/10 transition text-sm font-medium"
              >
                <link.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
