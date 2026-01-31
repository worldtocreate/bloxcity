import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Settings, Shield, User, Coins, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import UnreadBadge from './UnreadBadge';
import VerifiedBadge from './VerifiedBadge';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

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
          {/* Coins Display */}
          <div className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] px-2 sm:px-3 py-1.5 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-sm">{forumUser?.coins?.toLocaleString() || 0}</span>
          </div>

          {user ? (
            <>
              {forumUser && (
                <UnreadBadge forumUserId={forumUser.id} />
              )}
              
              {isAdmin && (
                <Link 
                  to="/admin"
                  className="flex items-center gap-2 text-[hsl(var(--bc-accent))] hover:opacity-80 transition p-2"
                  title="Admin Panel"
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
                  {forumUser?.is_verified && <VerifiedBadge size="md" />}
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
