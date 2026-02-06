import { 
  BarChart3, Users, Mail, Ban, Shield, Activity, 
  Globe, Settings, MessageSquare, FileText, Wrench, UserCog, 
  Megaphone, Flag, Award, UsersRound, BadgeCheck, Crown, 
  Headphones, Gamepad2, ChevronLeft, ChevronRight, Briefcase, Image, X
} from "lucide-react";
import type { ComponentType } from "react";
import { AdminTab } from "./types";
import { useState } from "react";

interface AdminTabsProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  darkMode: boolean;
  children: React.ReactNode;
  mobileOpen: boolean;
  onMobileClose: () => void;
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
  { id: "games", label: "Games", icon: Gamepad2, category: "Content" },
  { id: "game-thumbnails", label: "Thumbnails", icon: Image, category: "Content" },
  { id: "ads", label: "Advertisements", icon: Megaphone, category: "Content" },
  { id: "groups", label: "Groups", icon: UsersRound, category: "Content" },
  { id: "achievements", label: "Achievements", icon: Award, category: "Content" },
  { id: "updates", label: "Updates", icon: Megaphone, category: "Content" },
  { id: "jobs", label: "Jobs", icon: Briefcase, category: "Content" },
  
  // Moderation
  { id: "banned", label: "Banned Words", icon: Ban, category: "Moderation" },
  { id: "ip-blocking", label: "IP Blocking", icon: Globe, category: "Moderation" },
  
  // System
  { id: "admin-accounts", label: "Admin Accounts", icon: Shield, category: "System" },
  { id: "admins", label: "Site Admins", icon: Shield, category: "System" },
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

const AdminTabs = ({ activeTab, onTabChange, darkMode, children, mobileOpen, onMobileClose }: AdminTabsProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#05050a]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen transition-all duration-300 ease-out bg-[#0a0a0f] border-r border-white/5 flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {/* Header */}
        <div className={`h-16 flex items-center border-b border-white/5 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-white/10">
          {categoryOrder.filter(cat => groupedTabs[cat]).map((category) => (
            <div key={category} className="mb-6">
              {!collapsed && (
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-3 mb-2">
                  {category}
                </h2>
              )}
              <div className="space-y-0.5">
                {groupedTabs[category].map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onTabChange(id);
                        onMobileClose();
                      }}
                      title={collapsed ? label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                      {!collapsed && (
                        <span className="text-sm font-medium truncate">{label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t border-white/5 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500">System Online</span>
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mx-auto" />
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AdminTabs;
