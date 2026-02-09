import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Loader2, Megaphone, X, Shield, Lock, Mail, Send, Calendar, Hammer, Menu, ChevronDown, Home, Gamepad2, Store, MessageSquare, Users, ShoppingBasket, Plus, Pencil, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';

// Inline Maintenance component
function Maintenance({ message }: { message?: string }) {
  const navigate = useNavigate();
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error: rpcError } = await supabase.rpc('verify_maintenance_password', {
      p_password: inputPassword
    });
    
    if (rpcError) {
      setError('Verification failed. Please try again.');
    } else if (data === true) {
      sessionStorage.setItem('maintenance_bypass', 'true');
      navigate('/');
      window.location.reload();
    } else {
      setError('Incorrect password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-dark))] flex items-center justify-center p-4">
      <main className="max-w-[700px] w-full text-center">
        <Hammer className="w-20 h-20 mx-auto text-[hsl(var(--bc-text-muted))]" />
        <h1 className="text-4xl font-bold text-[hsl(var(--bc-text))] mt-4 mb-0">We'll be back soon!</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mt-2 text-lg">{message || "We're performing some maintenance at the moment."}</p>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch justify-center max-w-md mx-auto">
            <input type="password" value={inputPassword} onChange={(e) => { setInputPassword(e.target.value); setError(''); }}
              placeholder="Developer Password" className="flex-1 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2.5 text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] text-sm" disabled={loading} required />
            <button type="submit" disabled={loading} className="bg-[hsl(var(--bc-success))] hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2 min-w-[100px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
          {error && <p className="text-[hsl(var(--bc-error))] text-sm mt-2 text-left max-w-md mx-auto">{error}</p>}
        </form>
      </main>
    </div>
  );
}

// Inline DOBPrompt component
const DOB_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function DOBPrompt({ isOpen, onClose, forumUserId }: { isOpen: boolean; onClose: () => void; forumUserId: string }) {
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = async () => {
    setError('');
    if (!dobMonth || !dobDay || !dobYear) { setError('Please select your full date of birth'); return; }
    const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 13) { setError('You must be at least 13 years old'); return; }

    setSaving(true);
    const dateString = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const { error: updateError } = await supabase.from('forum_users').update({ date_of_birth: dateString, dob_updated_at: new Date().toISOString() }).eq('id', forumUserId);
    if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return; }
    toast.success('Date of birth saved!');
    setSaving(false);
    onClose();
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[hsl(220,15%,13%)] border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="w-5 h-5 text-[hsl(var(--bc-primary))]" />Confirm Your Date of Birth
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">We need to verify your age to ensure you can access all features.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-gray-700 dark:text-gray-300">Month</Label><select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"><option value="">Month</option>{DOB_MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}</select></div>
            <div><Label className="text-gray-700 dark:text-gray-300">Day</Label><select value={dobDay} onChange={(e) => setDobDay(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"><option value="">Day</option>{days.map((d) => <option key={d} value={String(d)}>{d}</option>)}</select></div>
            <div><Label className="text-gray-700 dark:text-gray-300">Year</Label><select value={dobYear} onChange={(e) => setDobYear(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"><option value="">Year</option>{years.map((y) => <option key={y} value={String(y)}>{y}</option>)}</select></div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">Your date of birth is private and used for age verification only.</div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Later</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ForumAnnouncement { enabled: boolean; message: string; type: 'info' | 'warning' | 'success'; }
interface TwoFASettings { is_enabled: boolean; method: string; }
interface MaintenanceSettings { enabled: boolean; message: string; }

// ============= INLINE TOPBAR =============
function Topbar({ 
  user, forumUser, isAdmin, 
  unreadMessageCount, friendRequestCount, 
  onToggleSidebar 
}: { 
  user: any; forumUser: any; isAdmin: boolean; 
  unreadMessageCount: number; friendRequestCount: number;
  onToggleSidebar: () => void;
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const username = forumUser?.username || 'User';
  const displayUsername = username.length > 10 ? username.substring(0, 10) + '...' : username;
  const avatarUrl = forumUser?.avatar_url || '/placeholder.svg';
  const currencyCash = forumUser?.currency_cash || 0;
  const currencyCoins = forumUser?.currency_coins || 0;
  const serialId = forumUser?.serial_id;

  return (
    <>
      <nav className="topbar">
        {/* Mobile View */}
        <div className="hide-for-large">
          <div className="topbar-sidebar-toggler" onClick={onToggleSidebar} style={{ marginLeft: 0, marginTop: '3px', padding: '0 15px', cursor: 'pointer' }}>
            <Menu className="w-5 h-5" />
          </div>
          <Link to={user ? '/' : '/landing'} className="topbar-logo" style={{ marginLeft: '25%' }}>
            <img src={bloxcityLogo} alt="BLOX City" />
          </Link>
          <div className="topbar-right">
            {!user ? (
              <>
                <button className="topbar-link dropdown" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {userDropdownOpen && (
                  <ul className="dropdown-content navbar-user-dropdown show">
                    <li className="dropdown-item"><Link to="/login">Login</Link></li>
                    <li className="dropdown-item"><Link to="/register">Register</Link></li>
                  </ul>
                )}
              </>
            ) : (
              <>
                <button className="topbar-link dropdown" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                  <img src={avatarUrl} alt="" style={{ borderRadius: '50%', width: '35px', height: '35px' }} />
                </button>
                {userDropdownOpen && (
                  <ul className="dropdown-content navbar-user-dropdown show">
                    <li className="dropdown-item"><Link to={serialId ? `/${serialId}/${username}/profile` : '/settings'}>Profile</Link></li>
                    <li className="dropdown-item"><Link to="/character">Character</Link></li>
                    <li className="dropdown-item"><Link to="/settings">Settings</Link></li>
                    <li className="dropdown-item"><button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="w-full text-left">Logout</button></li>
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop View */}
        <div className="show-for-large">
          <div className="topbar-left">
            <Link to={user ? '/' : '/landing'} className="topbar-logo">
              <img src={bloxcityLogo} alt="BLOX City" style={{ height: '50px' }} />
            </Link>
            <Link to={user ? '/' : '/landing'} className="topbar-link">Home</Link>
            <Link to="/games" className="topbar-link">Games</Link>
            <Link to="/market" className="topbar-link">Market</Link>
            <Link to="/forum" className="topbar-link">Forum</Link>
            {user && <Link to="/create" className="topbar-link">Create</Link>}
            <div className="relative">
              <button className="topbar-link dropdown" onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}>
                <ChevronDown className="w-4 h-4" />
              </button>
              {moreDropdownOpen && (
                <ul className="dropdown-content navbar-more-dropdown show">
                  <li className="dropdown-item"><Link to="/users">Users</Link></li>
                  <li className="dropdown-item"><Link to="/groups">Groups</Link></li>
                  <li className="dropdown-item"><Link to="/upgrade">Upgrade</Link></li>
                  <li className="dropdown-item"><a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer">Discord</a></li>
                </ul>
              )}
            </div>
          </div>
          <div className="topbar-right">
            {!user ? (
              <>
                <Link to="/login" className="topbar-link">Login</Link>
                <Link to="/register" className="topbar-link">Register</Link>
              </>
            ) : (
              <>
                <Link to="/messages" className="topbar-link" title={`${unreadMessageCount} Messages`}>
                  <i className="icon icon-inbox"></i> {unreadMessageCount}
                </Link>
                <Link to="/friends" className="topbar-link" title={`${friendRequestCount} Friend Requests`}>
                  <i className="icon icon-friends"></i> {friendRequestCount}
                </Link>
                <Link to="/money?from=cash" className="topbar-link" title={`${currencyCash.toLocaleString()} Cash`}>
                  <i className="icon icon-cash"></i> {currencyCash.toLocaleString()}
                </Link>
                <Link to="/money?from=coins" className="topbar-link" title={`${currencyCoins.toLocaleString()} Coins`}>
                  <i className="icon icon-coins"></i> {currencyCoins.toLocaleString()}
                </Link>
                <div className="relative">
                  <button className="topbar-link dropdown" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                    <img src={avatarUrl} alt="" style={{ borderRadius: '50%', width: '25px', height: '25px', marginRight: '5px' }} />
                    {displayUsername}
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {userDropdownOpen && (
                    <ul className="dropdown-content navbar-user-dropdown show">
                      <li className="dropdown-item"><Link to={serialId ? `/${serialId}/${username}/profile` : '/settings'}>Profile</Link></li>
                      <li className="dropdown-item"><Link to="/character">Character</Link></li>
                      <li className="dropdown-item"><Link to="/settings">Settings</Link></li>
                      {isAdmin && <li className="dropdown-item"><Link to="/admin">Admin</Link></li>}
                      <li className="dropdown-item"><button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="w-full text-left">Logout</button></li>
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="topbar-push"></div>
    </>
  );
}

// ============= INLINE SIDEBAR =============
function Sidebar({ 
  isOpen, onClose, user, forumUser, isAdmin,
  unreadMessageCount, friendRequestCount
}: { 
  isOpen: boolean; onClose: () => void; user: any; forumUser: any; isAdmin: boolean;
  unreadMessageCount: number; friendRequestCount: number;
}) {
  const currencyCash = forumUser?.currency_cash || 0;
  const currencyCoins = forumUser?.currency_coins || 0;

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar hide-for-large ${isOpen ? '' : 'hide'}`}>
        <div className="sidebar-inner">
          <ul className="sidebar-items">
            <li className="item"><Link to={user ? '/' : '/landing'} onClick={onClose}><Home className="w-5 h-5" /><span>Home</span></Link></li>
            <li className="item"><Link to="/games" onClick={onClose}><Gamepad2 className="w-5 h-5" /><span>Games</span></Link></li>
            <li className="item"><Link to="/market" onClick={onClose}><Store className="w-5 h-5" /><span>Market</span></Link></li>
            <li className="item"><Link to="/forum" onClick={onClose}><MessageSquare className="w-5 h-5" /><span>Forum</span></Link></li>
            <li className="item"><Link to="/users" onClick={onClose}><Search className="w-5 h-5" /><span>Users</span></Link></li>
            <li className="item"><Link to="/upgrade" onClick={onClose}><ShoppingBasket className="w-5 h-5" /><span>Upgrade</span></Link></li>
            {user && <li className="item"><Link to="/create" onClick={onClose}><Plus className="w-5 h-5" /><span>Create</span></Link></li>}
            <li className="item"><Link to="/blog" onClick={onClose}><Pencil className="w-5 h-5" /><span>Blog</span></Link></li>
          </ul>
          
          {user && (
            <>
              <div className="sidebar-divider"></div>
              <ul className="sidebar-items">
                <li className="item"><Link to="/money?from=cash" onClick={onClose}><i className="icon icon-cash"></i><span>{currencyCash.toLocaleString()} Cash</span></Link></li>
                <li className="item"><Link to="/money?from=coins" onClick={onClose}><i className="icon icon-coins"></i><span>{currencyCoins.toLocaleString()} Coins</span></Link></li>
                <li className="item"><Link to="/friends" onClick={onClose}><i className="icon icon-friends"></i><span>{friendRequestCount} Friend Requests</span></Link></li>
                <li className="item"><Link to="/messages" onClick={onClose}><i className="icon icon-inbox"></i><span>{unreadMessageCount} Messages</span></Link></li>
                {isAdmin && <li className="item"><Link to="/admin" onClick={onClose}><i className="icon icon-staff"></i><span>Panel</span></Link></li>}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ============= INLINE FOOTER =============
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/terms-of-service" className="footer-link">Terms</Link>
        <Link to="/privacy-policy" className="footer-link">Privacy</Link>
        <Link to="/support" className="footer-link">Support</Link>
        <Link to="/about" className="footer-link">About</Link>
        <Link to="/jobs" className="footer-link">Jobs</Link>
        <Link to="/staff" className="footer-link">Team</Link>
        <Link to="/support" className="footer-link">Contact</Link>
      </div>
      <div className="footer-copyright">© {new Date().getFullYear()} BLOX City | Made with ♥ by Hurricane & Soba</div>
      <div className="footer-social-icons">
        <a href="https://x.com/bloxcity" className="footer-social-icon" title="Follow us on Twitter!" target="_blank" rel="noopener noreferrer">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        <a href="https://discord.gg/bloxcity" className="footer-social-icon" title="Join our Discord!" target="_blank" rel="noopener noreferrer">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
        </a>
      </div>
    </footer>
  );
}

export default function ForumLayout() {
  const { user, forumUser, isAdmin, isModerator, loading, emailVerified, refreshEmailVerification } = useForumAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState<ForumAnnouncement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFASettings | null>(null);
  const [checkingTwoFA, setCheckingTwoFA] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [showDOBPrompt, setShowDOBPrompt] = useState(false);
  const [maintenanceBypass, setMaintenanceBypass] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [friendRequestCount, setFriendRequestCount] = useState(0);

  useOnlineStatus(forumUser?.id || null);

  useEffect(() => {
    fetchAnnouncement();
    fetchMaintenanceSettings();
    const bypass = sessionStorage.getItem('maintenance_bypass');
    setMaintenanceBypass(bypass === 'true');
    document.title = 'BLOX City - Community';
  }, []);

  useEffect(() => {
    if (forumUser?.id) {
      fetchCounts();
    }
  }, [forumUser?.id]);

  const fetchCounts = async () => {
    if (!forumUser?.id) return;
    const [{ count: msgCount }, { count: frCount }] = await Promise.all([
      supabase.from('forum_conversations').select('*', { count: 'exact', head: true }).or(`participant_1.eq.${forumUser.id},participant_2.eq.${forumUser.id}`),
      supabase.from('forum_friend_requests').select('*', { count: 'exact', head: true }).eq('receiver_id', forumUser.id).eq('status', 'pending')
    ]);
    setUnreadMessageCount(msgCount || 0);
    setFriendRequestCount(frCount || 0);
  };

  useEffect(() => {
    if (!loading && isAdmin && forumUser) {
      checkTwoFAStatus();
    } else if (!loading) {
      setCheckingTwoFA(false);
    }
  }, [loading, isAdmin, forumUser]);

  useEffect(() => {
    if (!loading && forumUser && !(forumUser as any).date_of_birth) {
      const timer = setTimeout(() => setShowDOBPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, forumUser]);

  useEffect(() => {
    if (user && emailVerified === false) {
      const interval = setInterval(() => refreshEmailVerification(), 5000);
      return () => clearInterval(interval);
    }
  }, [user, emailVerified]);

  const checkTwoFAStatus = async () => {
    if (!forumUser) { setCheckingTwoFA(false); return; }
    try {
      const { data } = await supabase.from('forum_2fa_settings').select('is_enabled, method').eq('forum_user_id', forumUser.id).maybeSingle();
      setTwoFAStatus(data as TwoFASettings | null);
    } catch { setTwoFAStatus(null); }
    finally { setCheckingTwoFA(false); }
  };

  const fetchAnnouncement = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'forum_announcement').single();
    if (data?.value) setAnnouncement(data.value as unknown as ForumAnnouncement);
  };

  const fetchMaintenanceSettings = async () => {
    const { data, error } = await supabase.rpc('get_maintenance_status');
    if (!error && data) setMaintenanceSettings(data as unknown as MaintenanceSettings);
  };

  const handleSendVerificationEmail = async () => {
    setSendingVerification(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email');
      if (error) toast.error('Failed to send verification email');
      else { toast.success('Verification email sent! Check your inbox.'); setVerificationEmailSent(true); }
    } catch { toast.error('Failed to send verification email'); }
    setSendingVerification(false);
  };

  if (maintenanceSettings?.enabled && !maintenanceBypass && !isAdmin) {
    return <Maintenance message={maintenanceSettings.message} />;
  }

  if (!loading && forumUser?.is_suspended) {
    const now = new Date();
    const endsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
    if (!endsAt || now < endsAt) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
          <div className="max-w-md w-full bc-card text-center p-8">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Account Suspended</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">Your account has been suspended for violating our community guidelines.</p>
            {forumUser.suspension_reason && <div className="bc-alert bc-alert-danger mb-4 text-left"><strong>Reason:</strong> {forumUser.suspension_reason}</div>}
            {endsAt && <p className="text-sm text-[hsl(var(--bc-text-muted))]">Suspension ends: {endsAt.toLocaleDateString()}</p>}
            {!endsAt && <p className="text-sm text-red-600 font-medium">This suspension is permanent.</p>}
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} className="mt-6 btn btn-gray w-full">Sign Out</button>
          </div>
        </div>
      );
    }
  }

  if (!loading && forumUser && (forumUser as any).has_pending_warning) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <div className="bc-card p-8 max-w-lg">
          <h1 className="text-2xl font-bold text-amber-600 mb-4 text-center">Account Warning</h1>
          <p className="text-[hsl(var(--bc-text))] mb-4 text-center">You have received a warning from the moderation team.</p>
          <div className="bc-alert bc-alert-warning mb-4">{(forumUser as any).warning_content}</div>
          <button onClick={async () => { await supabase.from('forum_users').update({ has_pending_warning: false, warning_accepted_at: new Date().toISOString() }).eq('id', forumUser.id); window.location.reload(); }} className="w-full btn btn-primary">I Understand and Accept</button>
        </div>
      </div>
    );
  }

  const isSettingsPage = location.pathname.startsWith('/settings');
  const adminNeeds2FA = !loading && !checkingTwoFA && isAdmin && forumUser && (!twoFAStatus || !twoFAStatus.is_enabled);

  if (adminNeeds2FA && !isSettingsPage) {
    return (
      <div className="min-h-screen" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <Topbar user={user} forumUser={forumUser} isAdmin={isAdmin} unreadMessageCount={unreadMessageCount} friendRequestCount={friendRequestCount} onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} user={user} forumUser={forumUser} isAdmin={isAdmin} unreadMessageCount={unreadMessageCount} friendRequestCount={friendRequestCount} />
        <div className="flex items-center justify-center p-4 py-20">
          <div className="bc-card p-8 max-w-md text-center">
            <Shield className="w-16 h-16 mx-auto text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Two-Factor Authentication Required</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-6">As an administrator, you must enable 2FA to protect your account.</p>
            <button onClick={() => navigate('/settings')} className="btn btn-primary w-full flex items-center justify-center gap-2"><Lock className="w-5 h-5" />Set Up 2FA Now</button>
          </div>
        </div>
      </div>
    );
  }

  const bannerStyles = { info: 'bc-alert bc-alert-info', warning: 'bc-alert bc-alert-warning', success: 'bc-alert bc-alert-success' };
  const showEmailVerificationBanner = user && forumUser && emailVerified === false;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <Topbar user={user} forumUser={forumUser} isAdmin={isAdmin} unreadMessageCount={unreadMessageCount} friendRequestCount={friendRequestCount} onToggleSidebar={() => setMobileSidebarOpen(true)} />
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} user={user} forumUser={forumUser} isAdmin={isAdmin} unreadMessageCount={unreadMessageCount} friendRequestCount={friendRequestCount} />
      
      {showEmailVerificationBanner && (
        <div className="site-banner bc-alert bc-alert-warning">
          <Mail className="w-5 h-5" />
          <span>Verify your email <strong>{user.email}</strong> to access forum features.</span>
          {verificationEmailSent ? <span className="ml-auto font-medium">Email sent!</span> : (
            <button onClick={handleSendVerificationEmail} disabled={sendingVerification} className="ml-auto btn btn-xs">{sendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Verification Email'}</button>
          )}
        </div>
      )}

      {adminNeeds2FA && isSettingsPage && (
        <div className="site-banner bc-alert bc-alert-warning">
          <Shield className="w-5 h-5" />
          <span>Enable 2FA to access forum features.</span>
        </div>
      )}

      {announcement?.enabled && announcement.message && !bannerDismissed && (
        <div className={`site-banner ${bannerStyles[announcement.type]}`}>
          <Megaphone className="w-5 h-5" />
          <span>{announcement.message}</span>
          <button onClick={() => setBannerDismissed(true)} className="ml-auto p-1 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        {loading || checkingTwoFA ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" /></div>
        ) : (
          <>
            {forumUser && showDOBPrompt && <DOBPrompt isOpen={showDOBPrompt} onClose={() => setShowDOBPrompt(false)} forumUserId={forumUser.id} />}
            <Outlet context={{ user, forumUser, isAdmin, loading, emailVerified }} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
