import { LogOut, Moon, Sun } from "lucide-react";
import { User } from "@supabase/supabase-js";
import bloxcityLogo from "@/assets/IMG_2412_Original-1.png";

interface AdminHeaderProps {
  user: User | null;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const AdminHeader = ({ user, onLogout, darkMode, onToggleDarkMode }: AdminHeaderProps) => {
  return (
    <header className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Admin Dashboard</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BLOX City Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</span>
          <button
            onClick={onLogout}
            className={`flex items-center gap-2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
