import { 
  BarChart3, Users, Mail, Ban, Shield, Activity, 
  Globe, Settings, MessageSquare, FileText, Wrench, UserCog, 
  Megaphone, Flag, Award, UsersRound, BadgeCheck, Crown, 
  Headphones, Gamepad2, ChevronLeft, Menu
} from "lucide-react";
import type { ComponentType } from "react";
import { AdminTab } from "./types";
import { useState } from "react";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  darkMode: boolean;
  children: React.ReactNode;
}

const tabs: { id: AdminTab; label: string; icon: ComponentType<{ className?: string }>; category: string }[] = [
  // Overview
  { id: "dashboard", label: "Dashboard", icon: BarChart3, category: "Overview" },
  
  // Users & Content
  { id: "forum-mod", label: "Forum Users", icon: MessageSquare, category: "Users" },
  { id: "user-mgmt", label: "User Management", icon: UserCog, category: "Users" },
  { id: "content-mod", label: "Content Moderation", icon: FileText, category: "Users" },
  { id: "reports", label: "Reports", icon: Flag, category: "Users" },
  { id: "support-tickets", label: "Support Tickets", icon: Headphones, category: "Users" },
  
  // Verification
  { id: "gold-checkmarks", label: "Gold Checkmarks", icon: Crown, category: "Verification" },
  { id: "verification-requests", label: "Verify Requests", icon: BadgeCheck, category: "Verification" },
  
  // Content
  { id: "game-thumbnails", label: "Game Thumbnails", icon: Gamepad2, category: "Content" },
  { id: "ads", label: "Advertisements", icon: Megaphone, category: "Content" },
  { id: "groups", label: "Groups", icon: UsersRound, category: "Content" },
  { id: "achievements", label: "Achievements", icon: Award, category: "Content" },
  { id: "updates", label: "Updates", icon: Megaphone, category: "Content" },
  
  // Moderation
  { id: "banned", label: "Banned Words", icon: Ban, category: "Moderation" },
  { id: "ip-blocking", label: "IP Blocking", icon: Globe, category: "Moderation" },
  
  // Legacy (hidden for now but still accessible)
  { id: "reservations", label: "Reservations", icon: Users, category: "Legacy" },
  { id: "newsletter", label: "Newsletter", icon: Mail, category: "Legacy" },
  
  // System
  { id: "admins", label: "Admin Users", icon: Shield, category: "System" },
  { id: "logs", label: "Activity Logs", icon: Activity, category: "System" },
  { id: "maintenance", label: "Maintenance", icon: Wrench, category: "System" },
  { id: "settings", label: "Settings", icon: Settings, category: "System" },
];

// Group tabs by category
const groupedTabs = tabs.reduce((acc, tab) => {
  if (!acc[tab.category]) acc[tab.category] = [];
  acc[tab.category].push(tab);
  return acc;
}, {} as Record<string, typeof tabs>);

// Order of categories to display
const categoryOrder = ["Overview", "Users", "Verification", "Content", "Moderation", "System"];

const AdminTabs = ({ activeTab, onTabChange, darkMode, children }: AdminTabsProps) => {
  // Sidebar is open by default (not collapsed)
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Categories to hide from default view (optional legacy items)
  const hiddenCategories = ["Legacy"];

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg ${
          darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 shadow-lg'
        }`}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen transition-all duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border-r ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            {!collapsed && (
              <h1 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Admin Panel
              </h1>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`p-1.5 rounded-lg hidden lg:block ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {categoryOrder.filter(cat => groupedTabs[cat] && !hiddenCategories.includes(cat)).map((category) => (
              <div key={category} className="mb-4">
                {!collapsed && (
                  <h2 className={`text-xs font-semibold uppercase px-3 py-2 ${
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {category}
                  </h2>
                )}
                <div className="space-y-1">
                  {groupedTabs[category].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        onTabChange(id);
                        setMobileOpen(false);
                      }}
                      title={collapsed ? label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left ${
                        activeTab === id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : darkMode
                            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? '' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {!collapsed && (
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-center`}>
                BLOX City Admin v2.0
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={`flex-1 min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {children}
      </main>
    </div>
  );
};

export default AdminTabs;
