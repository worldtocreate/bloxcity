import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Gamepad2,
  Store,
  User,
  ArrowLeftRight,
  Users,
  UsersRound,
  Settings,
  Mail,
  ChevronLeft,
  Heart,
  Award,
  Plus,
  Trophy,
  BadgeCheck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import LeaderboardSidebar from './LeaderboardSidebar';

interface AppSidebarProps {
  forumUser?: {
    username: string;
  } | null;
  isLoggedIn: boolean;
}

const mainNavItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Forum', url: '/forum', icon: MessageSquare },
  { title: 'Players', url: '/players', icon: Users },
  { title: 'Groups', url: '/groups', icon: UsersRound },
  { title: 'Games', url: '/games', icon: Gamepad2 },
  { title: 'Achievements', url: '/achievements', icon: Award },
];

const comingSoonItems = [
  { title: 'Market', url: '/market', icon: Store },
  { title: 'Character', url: '/character', icon: User },
  { title: 'Trading', url: '/trading', icon: ArrowLeftRight },
];

export default function AppSidebar({ forumUser, isLoggedIn }: AppSidebarProps) {
  const location = useLocation();
  const { state, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 border-b border-[hsl(var(--bc-border))]">
        <Link to="/" className="flex items-center gap-2" onClickCapture={handleLinkClick}>
          <img src={bloxcityLogo} alt="BLOX City" className="w-8 h-8 rounded-lg flex-shrink-0" />
          {!collapsed && (
            <span className="font-bold text-[hsl(var(--bc-text))]">BLOX City</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-[hsl(var(--bc-text-muted))] uppercase tracking-wider mb-2 px-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to={item.url}
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive(item.url)
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Coming Soon Section */}
        <SidebarGroup className="mt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-[hsl(var(--bc-text-muted))] uppercase tracking-wider mb-2 px-2">
              Coming Soon
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {comingSoonItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to={item.url}
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive(item.url)
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        {isLoggedIn && (
          <SidebarGroup className="mt-4">
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-semibold text-[hsl(var(--bc-text-muted))] uppercase tracking-wider mb-2 px-2">
                Account
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/create"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/create')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <Plus className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Create</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/request"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/request')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <BadgeCheck className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Request Verification</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/upgrades"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/upgrades')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Upgrades</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/friends"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/friends')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <Heart className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Friends</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/messages"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/messages')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <Mail className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Messages</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/support"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/support')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <HelpCircle className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Support</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/settings"
                      onClickCapture={handleLinkClick}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive('/settings')
                          ? 'bg-[hsl(var(--bc-primary))] text-white'
                          : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                      }`}
                    >
                      <Settings className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Leaderboard - show when expanded and logged in */}
        {!collapsed && isLoggedIn && (
          <SidebarGroup className="mt-4">
            <SidebarGroupContent>
              <div className="px-2">
                <LeaderboardSidebar />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Only show collapse button on desktop */}
      {!isMobile && (
        <SidebarFooter className="p-2 border-t border-[hsl(var(--bc-border))]">
          <SidebarMenuButton
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))] transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </SidebarMenuButton>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
