import { LogOut, Moon, Sun } from "lucide-react";
import { User } from "@supabase/supabase-js";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

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
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-lg transition ${darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
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
