import { useState } from "react";
import { LogOut, Bell, Search, Settings, User, ChevronDown, Menu } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import bloxcityLogo from "@/assets/IMG_2412_Original-1.png";

interface AdminHeaderProps {
  user: SupabaseUser | null;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onMobileMenuToggle?: () => void;
}

const AdminHeader = ({ user, onLogout, darkMode, onToggleDarkMode, onMobileMenuToggle }: AdminHeaderProps) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-[#0a0a0f] border-b border-white/5 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src={bloxcityLogo} alt="BLOX City" className="w-9 h-9 rounded-xl" />
          <div className="hidden sm:block">
            <h1 className="text-white font-semibold text-lg leading-tight">BLOX City</h1>
            <p className="text-xs text-gray-500">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, reports, settings..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-white/5 rounded border border-white/10">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition">
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition ml-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm text-white font-medium leading-tight truncate max-w-[120px]">
                {user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-[10px] text-gray-500">Administrator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#12121a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/5">
                  <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Signed in as admin</p>
                </div>
                <div className="p-1.5">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition">
                    <Settings className="w-4 h-4" />
                    Preferences
                  </button>
                </div>
                <div className="p-1.5 border-t border-white/5">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
