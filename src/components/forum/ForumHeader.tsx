import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, LogIn, LogOut, Settings, Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';

interface ForumHeaderProps {
  user: any;
  forumUser: ForumUser | null;
  isAdmin: boolean;
}

export default function ForumHeader({ user, forumUser, isAdmin }: ForumHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/forum');
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/forum" className="flex items-center gap-3">
          <img src={bloxcityLogo} alt="BLOX City" className="h-10 w-10 rounded-lg" />
          <div>
            <h1 className="text-xl font-bold text-white">BLOX City</h1>
            <p className="text-xs text-gray-400">Community Forum</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link 
            to="/forum"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Forums</span>
          </Link>

          {user ? (
            <>
              {isAdmin && (
                <Link 
                  to="/admin"
                  className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link 
                to="/forum/settings"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <div className="flex items-center gap-2">
                {forumUser?.avatar_url ? (
                  <img 
                    src={forumUser.avatar_url} 
                    alt={forumUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-white font-medium hidden sm:inline">
                  {forumUser?.username || 'User'}
                  {isAdmin && <Shield className="w-3 h-3 text-yellow-400 inline ml-1" />}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/forum/login"
                className="flex items-center gap-2 text-gray-300 hover:text-white transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
              <Link 
                to="/forum/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
