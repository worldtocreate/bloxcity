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
  BadgeCheck,
  Sparkles,
  HelpCircle,
  Shield,
  Map,
  Briefcase,
  FileText,
  AlertCircle,
  Package,
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
import bloxcityLogo from "@/assets/IMG_2412_Original-1.png";

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
  { title: 'Market', url: '/market', icon: Store },
  { title: 'Trading', url: '/trading', icon: ArrowLeftRight },
  { title: 'Achievements', url: '/achievements', icon: Award },
  { title: 'Roadmap', url: '/roadmap', icon: Map },
  { title: 'Blog', url: '/blog', icon: FileText },
  { title: 'Bug Reports', url: '/bugs', icon: AlertCircle },
  { title: 'Work for BLOX City', url: '/jobs', icon: Briefcase },
];

const comingSoonItems = [
  { title: 'Character', url: '/character', icon: User },
];

export default function AppSidebar({ forumUser, isLoggedIn }: AppSidebarProps) {
  const location = useLocation();
  const { state, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r" style={{ 
      background: 'hsl(var(--bc-section-bg))', 
      borderColor: 'hsl(var(--bc-section-border))' 
    }}>
      <SidebarHeader className="p-3" style={{ borderBottom: '1px solid hsl(var(--bc-section-border))' }}>
        <Link to="/" className="flex items-center gap-2" onClickCapture={handleLinkClick}>
          <img src={bloxcityLogo} alt="BLOX City" className="w-8 h-8 flex-shrink-0" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
          {!collapsed && (
            <span className="font-bold" style={{ color: 'hsl(var(--bc-text))' }}>BLOX City</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="bc-side-title mb-2">
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
                      className={`bc-side-link ${isActive(item.url) ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <item.icon className="bc-side-icon" />
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
            <SidebarGroupLabel className="bc-side-title mb-2">
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
                      className={`bc-side-link ${isActive(item.url) ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0', opacity: 0.6 }}
                    >
                      <item.icon className="bc-side-icon" />
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
              <SidebarGroupLabel className="bc-side-title mb-2">
                Account
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/inventory"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/inventory') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Package className="bc-side-icon" />
                      {!collapsed && <span>Inventory</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/create"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/create') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Plus className="bc-side-icon" />
                      {!collapsed && <span>Create</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/request"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/request') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <BadgeCheck className="bc-side-icon" />
                      {!collapsed && <span>Request Verification</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/upgrades"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/upgrades') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Sparkles className="bc-side-icon" />
                      {!collapsed && <span>Upgrades</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/friends"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/friends') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Heart className="bc-side-icon" />
                      {!collapsed && <span>Friends</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/messages"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/messages') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Mail className="bc-side-icon" />
                      {!collapsed && <span>Messages</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/support"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/support') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <HelpCircle className="bc-side-icon" />
                      {!collapsed && <span>Support</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/settings"
                      onClickCapture={handleLinkClick}
                      className={`bc-side-link ${isActive('/settings') ? 'active' : ''}`}
                      style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                    >
                      <Settings className="bc-side-icon" />
                      {!collapsed && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {forumUser?.username && ["soba", "dylan"].includes(forumUser.username.toLowerCase()) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleLinkClick}>
                      <Link
                        to="/g0dfrey"
                        onClickCapture={handleLinkClick}
                        className={`bc-side-link ${isActive('/g0dfrey') ? 'active' : ''}`}
                        style={{ borderRadius: 'var(--bc-rounded-lg)', margin: '2px 0' }}
                      >
                        <Shield className="bc-side-icon" />
                        {!collapsed && <span>The g0dfrey panel</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>
    </Sidebar>
  );
}
