import { 
  BarChart3, Users, Mail, Ban, Shield, Activity, 
  Globe, Settings, MessageSquare, FileText, Wrench, UserCog, Megaphone, Flag, Megaphone as AdIcon 
} from "lucide-react";
import { AdminTab } from "./types";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  darkMode: boolean;
}

const tabs: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "reservations", label: "Reservations", icon: Users },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "banned", label: "Banned Words", icon: Ban },
  { id: "ip-blocking", label: "IP Blocking", icon: Globe },
  { id: "forum-mod", label: "Forum Users", icon: MessageSquare },
  { id: "content-mod", label: "Content Mod", icon: FileText },
  { id: "user-mgmt", label: "User Mgmt", icon: UserCog },
  { id: "reports", label: "Reports", icon: Flag },
  { id: "ads", label: "Ads", icon: AdIcon },
  { id: "updates", label: "Updates", icon: Megaphone },
  { id: "admins", label: "Admin Users", icon: Shield },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminTabs = ({ activeTab, onTabChange, darkMode }: AdminTabsProps) => {
  return (
    <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === id
                  ? "border-blue-600 text-blue-600"
                  : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTabs;
