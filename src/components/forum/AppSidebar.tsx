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
  Heart,
  Award,
  Plus,
  BadgeCheck,
  Sparkles,
  HelpCircle,
  Shield,
  Map,
  Briefcase,
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
  useSidebar,
} from '@/components/ui/sidebar';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';

interface AppSidebarProps {
  forumUser?: {
    username: string;
  } | null;
  isLoggedIn: boolean;
}

const mainNavItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Games', url: '/games', icon: Gamepad2 },
  { title: 'Market', url: '/market', icon: Store },
  { title: 'Forum', url: '/forum', icon: MessageSquare },
  { title: 'Players', url: '/players', icon: Users },
  { title: 'Groups', url: '/groups', icon: UsersRound },
];

const moreItems = [
  { title: 'Achievements', url: '/achievements', icon: Award },
  { title: 'Roadmap', url: '/roadmap', icon: Map },
  { title: 'Work for BLOX City', url: '/jobs', icon: Briefcase },
];

const comingSoonItems = [
  { title: 'Character', url: '/character', icon: User },
  { title: 'Trading', url: '/trading', icon: ArrowLeftRight },
];

export default function AppSidebar({ forumUser, isLoggedIn }: AppSidebarProps) {
  const location = useLocation();
  const { state, setOpenMobile, isMobile } = useSidebar();
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

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 15px',
    color: '#777',
    fontWeight: 500,
    lineHeight: 1.5,
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background-color 0.35s',
  };

  const activeLinkStyle = {
    ...linkStyle,
    background: '#ededed',
  };

  const iconStyle = {
    fontSize: '21px',
    width: '25px',
    flexShrink: 0,
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="sidebar"
      style={{ 
        background: '#fff',
        borderRight: '1px solid #ccc',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: collapsed ? '60px' : '200px',
        zIndex: 10,
        overflowY: 'auto'
      }}
    >
      <SidebarHeader style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
        <Link to="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <img src={bloxcityLogo} alt="BLOX City" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
          {!collapsed && (
            <span style={{ fontWeight: 600, color: '#333' }}>BLOX City</span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent style={{ marginTop: '10px' }}>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      style={isActive(item.url) ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive(item.url)) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.url)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <item.icon style={iconStyle} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* More Section */}
        <SidebarGroup style={{ marginTop: '10px' }}>
          <SidebarGroupContent>
            <SidebarMenu style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {moreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      style={isActive(item.url) ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive(item.url)) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive(item.url)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <item.icon style={iconStyle} />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div style={{ background: '#eee', margin: '15px 0', height: '1px', width: '100%' }} />

        {/* User Section - Only for logged in users */}
        {isLoggedIn && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/create"
                      onClick={handleLinkClick}
                      style={isActive('/create') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/create')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/create')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Plus style={iconStyle} />
                      {!collapsed && <span>Create</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/upgrades"
                      onClick={handleLinkClick}
                      style={isActive('/upgrades') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/upgrades')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/upgrades')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Sparkles style={iconStyle} />
                      {!collapsed && <span>Upgrade</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/friends"
                      onClick={handleLinkClick}
                      style={isActive('/friends') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/friends')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/friends')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Heart style={iconStyle} />
                      {!collapsed && <span>Friends</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/messages"
                      onClick={handleLinkClick}
                      style={isActive('/messages') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/messages')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/messages')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Mail style={iconStyle} />
                      {!collapsed && <span>Messages</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/support"
                      onClick={handleLinkClick}
                      style={isActive('/support') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/support')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/support')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <HelpCircle style={iconStyle} />
                      {!collapsed && <span>Support</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild onClick={handleLinkClick}>
                    <Link
                      to="/settings"
                      onClick={handleLinkClick}
                      style={isActive('/settings') ? activeLinkStyle : linkStyle}
                      onMouseEnter={(e) => {
                        if (!isActive('/settings')) {
                          e.currentTarget.style.background = '#ededed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive('/settings')) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <Settings style={iconStyle} />
                      {!collapsed && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {forumUser?.username && ["soba", "dylan"].includes(forumUser.username.toLowerCase()) && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild onClick={handleLinkClick}>
                      <Link
                        to="/g0dfrey"
                        onClick={handleLinkClick}
                        style={isActive('/g0dfrey') ? activeLinkStyle : linkStyle}
                        onMouseEnter={(e) => {
                          if (!isActive('/g0dfrey')) {
                            e.currentTarget.style.background = '#ededed';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive('/g0dfrey')) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <Shield style={iconStyle} />
                        {!collapsed && <span>Panel</span>}
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
