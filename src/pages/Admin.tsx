import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  Check, X, Clock, RefreshCw, Mail, Send, Image, 
  Ban, Trash2, Plus, CheckSquare, Square,
  UserPlus, UserMinus, Search, Download
} from "lucide-react";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs from "@/components/admin/AdminTabs";
import DashboardTab from "@/components/admin/DashboardTab";
import IPBlockingTab from "@/components/admin/IPBlockingTab";
import SettingsTab from "@/components/admin/SettingsTab";
import ExportButton from "@/components/admin/ExportButton";
import ForumModTab from "@/components/admin/ForumModTab";
import ContentModerationTab from "@/components/admin/ContentModerationTab";
import UserManagementTab from "@/components/admin/UserManagementTab";
import MaintenanceTab from "@/components/admin/MaintenanceTab";
import UpdatesTab from "@/components/admin/UpdatesTab";
import ReportsTab from "@/components/admin/ReportsTab";
import AdsTab from "@/components/admin/AdsTab";
import AchievementsTab from "@/components/admin/AchievementsTab";
import GroupsTab from "@/components/admin/GroupsTab";
import AdminPinGate from "@/components/admin/AdminPinGate";
import VerificationRequestsTab from "@/components/admin/VerificationRequestsTab";
import { useToast } from "@/hooks/use-toast";
import { Crown, Trash2 as TrashIcon, Check as CheckIcon, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ForumUserLite = { id: string; username: string; avatar_url: string | null };
type GoldUserRow = { id: string; forum_user_id: string; granted_at: string; forum_users?: { username: string } | null };
type AffiliateRequestRow = { id: string; status: string; admin_approved: boolean; created_at: string; gold_user?: { username: string } | null; affiliate_user?: { username: string } | null };

const GoldCheckmarksTab = ({ darkMode }: { darkMode: boolean }) => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ForumUserLite[]>([]);
  const [goldUsers, setGoldUsers] = useState<GoldUserRow[]>([]);
  const [pending, setPending] = useState<AffiliateRequestRow[]>([]);

  useEffect(() => { void refreshAll(); }, []);

  const refreshAll = async () => { await Promise.all([fetchGoldUsers(), fetchPendingRequests()]); };

  const fetchGoldUsers = async () => {
    const { data } = await supabase.from("forum_gold_checkmarks")
      .select("id, forum_user_id, granted_at, forum_users!forum_gold_checkmarks_forum_user_id_fkey(username)")
      .order("granted_at", { ascending: false });
    if (data) setGoldUsers(data as unknown as GoldUserRow[]);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase.from("forum_affiliate_requests")
      .select("id, status, admin_approved, created_at, gold_user:forum_users!forum_affiliate_requests_gold_user_id_fkey(username), affiliate_user:forum_users!forum_affiliate_requests_affiliate_user_id_fkey(username)")
      .eq("status", "pending").eq("admin_approved", false).order("created_at", { ascending: false });
    if (data) setPending(data as unknown as AffiliateRequestRow[]);
  };

  const onSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const { data } = await supabase.from("forum_users").select("id, username, avatar_url").ilike("username", `%${query.trim()}%`).limit(10);
    setSearching(false);
    if (data) setSearchResults(data as ForumUserLite[]);
  };

  const grantGold = async (forumUserId: string, username: string) => {
    const { error } = await supabase.from("forum_gold_checkmarks").insert({ forum_user_id: forumUserId });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Granted", description: `Gold checkmark granted to ${username}` });
    setSearchResults([]); setQuery(""); await fetchGoldUsers();
  };

  const revokeGold = async (id: string, username: string) => {
    const { error } = await supabase.from("forum_gold_checkmarks").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Revoked", description: `Gold checkmark revoked from ${username}` });
    await refreshAll();
  };

  const approveRequest = async (id: string) => {
    const { error } = await supabase.from("forum_affiliate_requests").update({ admin_approved: true, admin_approved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Approved", description: "Affiliate request approved" });
    await fetchPendingRequests();
  };

  const rejectRequest = async (id: string) => {
    const { error } = await supabase.from("forum_affiliate_requests").update({ status: "rejected" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Rejected", description: "Affiliate request rejected" });
    await fetchPendingRequests();
  };

  const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";

  return (
    <div className="space-y-6">
      <Card className={cardClass}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-500" />Grant Gold Checkmark</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSearch()} placeholder="Search username…" className={darkMode ? "bg-gray-700 border-gray-600" : ""} />
            <Button onClick={onSearch} disabled={searching}><Search className="h-4 w-4" /></Button>
          </div>
          {searchResults.length > 0 && <div className="space-y-2">{searchResults.map((u) => (<div key={u.id} className="flex items-center justify-between rounded-md border p-2"><span>{u.username}</span><Button size="sm" onClick={() => grantGold(u.id, u.username)}>Grant</Button></div>))}</div>}
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader><CardTitle>Pending Affiliate Requests</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Gold User</TableHead><TableHead>Affiliate</TableHead><TableHead>Requested</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{pending.map((r) => (<TableRow key={r.id}><TableCell>{r.gold_user?.username ?? "Unknown"}</TableCell><TableCell>{r.affiliate_user?.username ?? "Unknown"}</TableCell><TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell><TableCell className="text-right"><div className="inline-flex gap-2"><Button size="sm" variant="outline" onClick={() => approveRequest(r.id)}><CheckIcon className="h-4 w-4" /></Button><Button size="sm" variant="destructive" onClick={() => rejectRequest(r.id)}><XIcon className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader><CardTitle>Gold Checkmark Users</CardTitle></CardHeader>
        <CardContent>
          {goldUsers.length === 0 ? <p className="text-sm text-muted-foreground">No gold users.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Granted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{goldUsers.map((u) => (<TableRow key={u.id}><TableCell className="flex items-center gap-2"><Crown className="h-4 w-4 text-yellow-500" />{u.forum_users?.username ?? "Unknown"}</TableCell><TableCell>{new Date(u.granted_at).toLocaleDateString()}</TableCell><TableCell className="text-right"><Button size="sm" variant="destructive" onClick={() => revokeGold(u.id, u.forum_users?.username ?? "User")}><TrashIcon className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
import { 
  Reservation, NewsletterSubscriber, BannedWord, 
  AdminUser, ActivityLog, AdminTab 
} from "@/components/admin/types";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pinAuthenticated, setPinAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  
  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenialModal, setShowDenialModal] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkDenialModal, setShowBulkDenialModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Newsletter state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterImageUrl, setNewsletterImageUrl] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  
  // Banned words state
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [newBannedWord, setNewBannedWord] = useState("");
  const [newBannedReason, setNewBannedReason] = useState("");
  const [addingWord, setAddingWord] = useState(false);
  const [bannedWordSearch, setBannedWordSearch] = useState("");

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admin" | "moderator">("admin");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logSearch, setLogSearch] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('adminDarkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('adminDarkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: hasAdminRole, error } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });

      if (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(hasAdminRole === true);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "reservations") {
        fetchReservations();
      } else if (activeTab === "newsletter") {
        fetchSubscribers();
      } else if (activeTab === "banned") {
        fetchBannedWords();
      } else if (activeTab === "admins") {
        fetchAdminUsers();
      } else if (activeTab === "logs") {
        fetchActivityLogs();
      }
    }
  }, [isAdmin, filter, activeTab, logFilter]);

  const fetchReservations = async () => {
    const response = await supabase.functions.invoke('admin-get-reservations', {
      body: { filter }
    });
    if (response.data?.reservations) {
      setReservations(response.data.reservations);
      setSelectedReservations(new Set());
    }
  };

  const fetchSubscribers = async () => {
    const response = await supabase.functions.invoke('admin-get-newsletter-subscribers');
    if (response.data?.subscribers) {
      setSubscribers(response.data.subscribers);
    }
  };

  const fetchBannedWords = async () => {
    const response = await supabase.functions.invoke('admin-manage-banned-words', {
      body: { action: 'list' }
    });
    if (response.data?.words) {
      setBannedWords(response.data.words);
    }
  };

  const fetchAdminUsers = async () => {
    const response = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'list' }
    });
    if (response.data?.users) {
      setAdminUsers(response.data.users);
    }
  };

  const fetchActivityLogs = async () => {
    const response = await supabase.functions.invoke('admin-get-activity-logs', {
      body: { filter: logFilter, limit: 100 }
    });
    if (response.data?.logs) {
      setActivityLogs(response.data.logs);
    }
  };

  const handleApprove = async (reservationId: string) => {
    setActionLoading(reservationId);
    const response = await supabase.functions.invoke('update-reservation-status', {
      body: { reservationId, status: 'approved' }
    });
    if (response.data?.success) {
      fetchReservations();
    }
    setActionLoading(null);
  };

  const handleDeny = async (reservationId: string) => {
    setActionLoading(reservationId);
    const response = await supabase.functions.invoke('update-reservation-status', {
      body: { reservationId, status: 'denied', denialReason }
    });
    if (response.data?.success) {
      fetchReservations();
      setShowDenialModal(null);
      setDenialReason("");
    }
    setActionLoading(null);
  };

  const handleRevertToPending = async (reservationId: string) => {
    setActionLoading(reservationId);
    const response = await supabase.functions.invoke('update-reservation-status', {
      body: { reservationId, status: 'pending' }
    });
    if (response.data?.success) {
      fetchReservations();
    }
    setActionLoading(null);
  };

  const handleBulkAction = async (action: 'approve' | 'deny') => {
    if (selectedReservations.size === 0) return;
    
    setBulkLoading(true);
    const response = await supabase.functions.invoke('admin-bulk-action', {
      body: { 
        action, 
        reservationIds: Array.from(selectedReservations),
        denialReason: action === 'deny' ? denialReason : undefined
      }
    });
    
    if (response.data?.success) {
      fetchReservations();
      setSelectedReservations(new Set());
      setShowBulkDenialModal(false);
      setDenialReason("");
    }
    setBulkLoading(false);
  };

  const toggleSelectAll = () => {
    const pendingReservations = filteredReservations.filter(r => r.status === 'pending');
    if (selectedReservations.size === pendingReservations.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(pendingReservations.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedReservations);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedReservations(newSet);
  };

  const handleSendNewsletter = async () => {
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      setNewsletterResult({ success: false, message: "Please fill in subject and content" });
      return;
    }

    setSendingNewsletter(true);
    setNewsletterResult(null);

    const response = await supabase.functions.invoke('admin-send-newsletter', {
      body: { 
        subject: newsletterSubject.trim(),
        content: newsletterContent.trim(),
        imageUrl: newsletterImageUrl.trim() || undefined
      }
    });

    if (response.error) {
      setNewsletterResult({ success: false, message: "Failed to send newsletter" });
    } else if (response.data?.error) {
      setNewsletterResult({ success: false, message: response.data.error });
    } else {
      setNewsletterResult({ success: true, message: response.data.message });
      setNewsletterSubject("");
      setNewsletterContent("");
      setNewsletterImageUrl("");
    }

    setSendingNewsletter(false);
  };

  const handleAddBannedWord = async () => {
    if (!newBannedWord.trim()) return;
    
    setAddingWord(true);
    const response = await supabase.functions.invoke('admin-manage-banned-words', {
      body: { action: 'add', word: newBannedWord.trim(), reason: newBannedReason.trim() || null }
    });
    
    if (response.data?.success) {
      fetchBannedWords();
      setNewBannedWord("");
      setNewBannedReason("");
    }
    setAddingWord(false);
  };

  const handleDeleteBannedWord = async (wordId: string) => {
    const response = await supabase.functions.invoke('admin-manage-banned-words', {
      body: { action: 'delete', wordId }
    });
    
    if (response.data?.success) {
      fetchBannedWords();
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    
    setAddingAdmin(true);
    setAdminError(null);
    
    const response = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'add', email: newAdminEmail.trim(), role: newAdminRole }
    });
    
    if (response.data?.success) {
      fetchAdminUsers();
      setNewAdminEmail("");
    } else if (response.data?.error) {
      setAdminError(response.data.error);
    } else if (response.error) {
      setAdminError("Failed to add admin");
    }
    setAddingAdmin(false);
  };

  const handleRemoveAdmin = async (targetUserId: string, role: string) => {
    if (targetUserId === user?.id) {
      setAdminError("You cannot remove your own admin role");
      return;
    }
    
    const response = await supabase.functions.invoke('admin-manage-users', {
      body: { action: 'remove', targetUserId, role }
    });
    
    if (response.data?.success) {
      fetchAdminUsers();
    } else if (response.data?.error) {
      setAdminError(response.data.error);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'approve_reservation': 'Approved reservation',
      'deny_reservation': 'Denied reservation',
      'revert_reservation_to_pending': 'Reverted reservation to pending',
      'add_banned_word': 'Added banned word',
      'delete_banned_word': 'Deleted banned word',
      'add_role': 'Added admin role',
      'remove_role': 'Removed admin role',
      'send_newsletter': 'Sent newsletter',
      'bulk_approve': 'Bulk approved',
      'bulk_deny': 'Bulk denied',
      'block_ip': 'Blocked IP',
      'unblock_ip': 'Unblocked IP',
      'export_data': 'Exported data',
    };
    return labels[action] || action;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!r.username.toLowerCase().includes(query) && 
          !r.email.toLowerCase().includes(query) &&
          !(r.ip_address && r.ip_address.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const date = new Date(r.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (date < today) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (date < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (date < monthAgo) return false;
      }
    }
    
    return true;
  });
  
  const pendingReservations = filteredReservations.filter(r => r.status === 'pending');

  // Filter subscribers
  const filteredSubscribers = subscribers.filter(s => 
    subscriberSearch.trim() === '' || s.email.toLowerCase().includes(subscriberSearch.toLowerCase())
  );

  // Filter banned words
  const filteredBannedWords = bannedWords.filter(w => 
    bannedWordSearch.trim() === '' || 
    w.word.toLowerCase().includes(bannedWordSearch.toLowerCase()) ||
    (w.reason && w.reason.toLowerCase().includes(bannedWordSearch.toLowerCase()))
  );

  // Filter activity logs
  const filteredLogs = activityLogs.filter(l => 
    logSearch.trim() === '' || 
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.admin_email && l.admin_email.toLowerCase().includes(logSearch.toLowerCase())) ||
    (l.details?.username && String(l.details.username).toLowerCase().includes(logSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'} animate-spin`} />
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading admin panel...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8 max-w-md text-center`}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            You don't have admin privileges. Contact an administrator to get access.
          </p>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-4`}>Logged in as: {user?.email}</p>
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Show PIN gate if not authenticated
  if (!pinAuthenticated && user) {
    return (
      <AdminPinGate
        userId={user.id}
        onAuthenticated={() => setPinAuthenticated(true)}
        darkMode={darkMode}
      />
    );
  }

  const activeSubscribers = subscribers.filter(s => s.is_active).length;

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <AdminHeader 
        user={user} 
        onLogout={handleLogout} 
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />
      
      <AdminTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        darkMode={darkMode}
      />

      <main className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && <DashboardTab darkMode={darkMode} />}
        
        {/* Gold Checkmarks Tab */}
        {activeTab === "gold-checkmarks" && <GoldCheckmarksTab darkMode={darkMode} />}
        
        {/* Verification Requests Tab */}
        {activeTab === "verification-requests" && <VerificationRequestsTab darkMode={darkMode} />}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <>
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex gap-2">
                {(['pending', 'approved', 'denied', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filter === tab
                        ? 'bg-blue-600 text-white'
                        : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                className={`px-4 py-2 border rounded-lg outline-none ${inputClass}`}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
              
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search username, email, or IP..."
                    className={`pl-9 pr-4 py-2 w-64 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
                  />
                </div>
                <ExportButton type="reservations" filter={filter} darkMode={darkMode} />
                <button
                  onClick={fetchReservations}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
                    darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search Results Info */}
            {(searchQuery.trim() || dateFilter !== 'all') && (
              <div className={`mb-4 text-sm ${mutedClass}`}>
                Found {filteredReservations.length} result{filteredReservations.length !== 1 ? 's' : ''}
                {searchQuery.trim() && ` for "${searchQuery}"`}
                {dateFilter !== 'all' && ` (${dateFilter})`}
                <button 
                  onClick={() => { setSearchQuery(""); setDateFilter('all'); }}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Bulk Actions */}
            {filter === 'pending' && pendingReservations.length > 0 && (
              <div className={`${darkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4`}>
                <button
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-2 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:text-blue-800'}`}
                >
                  {selectedReservations.size === pendingReservations.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {selectedReservations.size === pendingReservations.length ? 'Deselect All' : 'Select All'}
                </button>
                
                {selectedReservations.size > 0 && (
                  <>
                    <span className={darkMode ? 'text-blue-400' : 'text-blue-700'}>{selectedReservations.size} selected</span>
                    <button
                      onClick={() => handleBulkAction('approve')}
                      disabled={bulkLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Approve All
                    </button>
                    <button
                      onClick={() => setShowBulkDenialModal(true)}
                      disabled={bulkLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Deny All
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Reservations Table */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <tr>
                      {filter === 'pending' && (
                        <th className="w-10 px-4 py-4"></th>
                      )}
                      <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Username</th>
                      <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Email</th>
                      <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Status</th>
                      <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Date</th>
                      <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>IP</th>
                      <th className={`text-right px-6 py-4 text-sm font-semibold ${mutedClass}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={filter === 'pending' ? 7 : 6} className={`px-6 py-12 text-center ${mutedClass}`}>
                          {searchQuery.trim() || dateFilter !== 'all' ? 'No matching reservations found' : 'No reservations found'}
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((reservation) => (
                        <tr key={reservation.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          {filter === 'pending' && (
                            <td className="px-4 py-4">
                              {reservation.status === 'pending' && (
                                <button onClick={() => toggleSelect(reservation.id)}>
                                  {selectedReservations.has(reservation.id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                  )}
                                </button>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${textClass}`}>{reservation.username}</span>
                          </td>
                          <td className={`px-6 py-4 ${mutedClass}`}>{reservation.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              reservation.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {reservation.status === 'pending' && <Clock className="w-3 h-3" />}
                              {reservation.status === 'approved' && <Check className="w-3 h-3" />}
                              {reservation.status === 'denied' && <X className="w-3 h-3" />}
                              {reservation.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm ${mutedClass}`}>
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </td>
                          <td className={`px-6 py-4 text-sm font-mono ${mutedClass}`}>
                            {reservation.ip_address || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {reservation.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setShowDenialModal(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                    Deny
                                  </button>
                                </>
                              )}
                              {reservation.status === 'approved' && (
                                <>
                                  <button
                                    onClick={() => handleRevertToPending(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Revert to Pending
                                  </button>
                                  <button
                                    onClick={() => setShowDenialModal(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                  >
                                    <X className="w-4 h-4" />
                                    Deny
                                  </button>
                                </>
                              )}
                              {reservation.status === 'denied' && (
                                <>
                                  <button
                                    onClick={() => handleRevertToPending(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition disabled:opacity-50"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Revert to Pending
                                  </button>
                                  <button
                                    onClick={() => handleApprove(reservation.id)}
                                    disabled={actionLoading === reservation.id}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approve
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Newsletter Tab */}
        {activeTab === "newsletter" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscribers List */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div>
                  <h2 className={`text-lg font-semibold ${textClass}`}>Newsletter Subscribers</h2>
                  <p className={`text-sm ${mutedClass}`}>
                    {activeSubscribers} active, {subscribers.length - activeSubscribers} unsubscribed
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButton type="subscribers" darkMode={darkMode} />
                  <button
                    onClick={fetchSubscribers}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-80 transition ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
              <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    placeholder="Search subscribers..."
                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0`}>
                    <tr>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Email</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Status</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Subscribed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={`px-6 py-8 text-center ${mutedClass}`}>
                          {subscriberSearch ? 'No matching subscribers' : 'No subscribers yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <tr key={subscriber.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-6 py-3 text-sm ${textClass}`}>{subscriber.email}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              subscriber.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {subscriber.is_active ? 'Active' : 'Unsubscribed'}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>
                            {new Date(subscriber.subscribed_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Send Newsletter */}
            <div className={`rounded-xl shadow-sm border p-6 ${cardClass}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textClass}`}>
                <Send className="w-5 h-5 text-purple-500" />
                Send Newsletter
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${mutedClass}`}>Subject</label>
                  <input
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Newsletter subject..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${mutedClass}`}>Content</label>
                  <textarea
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    placeholder="Write your newsletter content here..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none ${inputClass}`}
                    rows={6}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${mutedClass}`}>
                    <span className="flex items-center gap-1">
                      <Image className="w-4 h-4" />
                      Image URL (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={newsletterImageUrl}
                    onChange={(e) => setNewsletterImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${inputClass}`}
                  />
                </div>
                <button
                  onClick={handleSendNewsletter}
                  disabled={sendingNewsletter || !newsletterSubject.trim() || !newsletterContent.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                >
                  <Send className="w-4 h-4" />
                  {sendingNewsletter ? "Sending..." : `Send to ${activeSubscribers} subscribers`}
                </button>
                {newsletterResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    newsletterResult.success 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {newsletterResult.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Banned Words Tab */}
        {activeTab === "banned" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Word */}
            <div className={`rounded-xl shadow-sm border p-6 ${cardClass}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textClass}`}>
                <Plus className="w-5 h-5 text-red-500" />
                Add Banned Word
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${mutedClass}`}>Word or Phrase</label>
                  <input
                    type="text"
                    value={newBannedWord}
                    onChange={(e) => setNewBannedWord(e.target.value)}
                    placeholder="Enter word to ban..."
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${mutedClass}`}>Reason (optional)</label>
                  <input
                    type="text"
                    value={newBannedReason}
                    onChange={(e) => setNewBannedReason(e.target.value)}
                    placeholder="Why is this word banned?"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${inputClass}`}
                  />
                </div>
                <button
                  onClick={handleAddBannedWord}
                  disabled={addingWord || !newBannedWord.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  {addingWord ? "Adding..." : "Add to Blocklist"}
                </button>
              </div>
            </div>

            {/* Banned Words List */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div>
                  <h2 className={`text-lg font-semibold ${textClass}`}>Blocked Words</h2>
                  <p className={`text-sm ${mutedClass}`}>{bannedWords.length} words blocked</p>
                </div>
                <button
                  onClick={fetchBannedWords}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-80 transition ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <div className={`px-6 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={bannedWordSearch}
                    onChange={(e) => setBannedWordSearch(e.target.value)}
                    placeholder="Search banned words..."
                    className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
                  />
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0`}>
                    <tr>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Word</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Reason</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Added</th>
                      <th className={`text-right px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBannedWords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`px-6 py-8 text-center ${mutedClass}`}>
                          {bannedWordSearch ? 'No matching words' : 'No banned words yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredBannedWords.map((word) => (
                        <tr key={word.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-6 py-3 font-mono text-sm ${textClass}`}>{word.word}</td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>{word.reason || '-'}</td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>
                            {new Date(word.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleDeleteBannedWord(word.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* IP Blocking Tab */}
        {activeTab === "ip-blocking" && <IPBlockingTab darkMode={darkMode} />}

        {/* Forum Moderation Tab */}
        {activeTab === "forum-mod" && <ForumModTab darkMode={darkMode} />}

        {/* Content Moderation Tab */}
        {activeTab === "content-mod" && <ContentModerationTab darkMode={darkMode} />}

        {/* User Management Tab */}
        {activeTab === "user-mgmt" && <UserManagementTab />}

        {/* Maintenance Tab */}
        {activeTab === "maintenance" && <MaintenanceTab darkMode={darkMode} />}

        {/* Updates Tab */}
        {activeTab === "updates" && <UpdatesTab darkMode={darkMode} />}

        {/* Reports Tab */}
        {activeTab === "reports" && <ReportsTab darkMode={darkMode} />}
        
        {/* Ads Tab */}
        {activeTab === "ads" && <AdsTab darkMode={darkMode} />}

        {/* Achievements Tab */}
        {activeTab === "achievements" && <AchievementsTab darkMode={darkMode} />}

        {/* Groups Tab */}
        {activeTab === "groups" && <GroupsTab darkMode={darkMode} />}
        
        {/* Admin Users Tab */}
        {activeTab === "admins" && (
          <div className="space-y-6">
            {/* Add New Admin */}
            <div className={`rounded-xl shadow-sm border p-6 ${cardClass}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${textClass}`}>
                <UserPlus className="w-5 h-5" />
                Add Admin User
              </h2>
              <div className="flex flex-wrap gap-4">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="User email address"
                  className={`flex-1 min-w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${inputClass}`}
                />
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as "admin" | "moderator")}
                  className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${inputClass}`}
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
                <button
                  onClick={handleAddAdmin}
                  disabled={addingAdmin || !newAdminEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {addingAdmin ? "Adding..." : "Add User"}
                </button>
              </div>
              {adminError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                  {adminError}
                </div>
              )}
              <p className={`mt-3 text-sm ${mutedClass}`}>
                The user must have already signed up before you can add them as an admin.
              </p>
            </div>

            {/* Admin Users List */}
            <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div>
                  <h2 className={`text-lg font-semibold ${textClass}`}>Admin Users</h2>
                  <p className={`text-sm ${mutedClass}`}>{adminUsers.length} users with elevated privileges</p>
                </div>
                <button
                  onClick={fetchAdminUsers}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:opacity-80 transition ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Email</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Role</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Added</th>
                      <th className={`text-right px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`px-6 py-8 text-center ${mutedClass}`}>
                          No admin users found
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((adminUser) => (
                        <tr key={adminUser.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className={`px-6 py-3 text-sm ${textClass}`}>{adminUser.email}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              adminUser.role === 'admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {adminUser.role}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>
                            {new Date(adminUser.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {adminUser.user_id !== user?.id && (
                              <button
                                onClick={() => handleRemoveAdmin(adminUser.user_id, adminUser.role)}
                                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition ml-auto"
                              >
                                <UserMinus className="w-4 h-4" />
                                Remove
                              </button>
                            )}
                            {adminUser.user_id === user?.id && (
                              <span className={`text-sm ${mutedClass}`}>(You)</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'approve_reservation', 'deny_reservation', 'add_banned_word', 'add_role', 'remove_role', 'block_ip', 'export_data'].map((action) => (
                <button
                  key={action}
                  onClick={() => setLogFilter(action)}
                  className={`px-4 py-2 rounded-lg font-medium transition text-sm ${
                    logFilter === action
                      ? 'bg-blue-600 text-white'
                      : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {action === 'all' ? 'All' : getActionLabel(action)}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search logs..."
                    className={`pl-9 pr-4 py-2 w-48 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
                  />
                </div>
                <ExportButton type="logs" darkMode={darkMode} />
                <button
                  onClick={fetchActivityLogs}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h2 className={`text-lg font-semibold ${textClass}`}>Activity History</h2>
                <p className={`text-sm ${mutedClass}`}>Recent admin actions (last 100)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <tr>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Action</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Admin</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Details</th>
                      <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${mutedClass}`}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`px-6 py-8 text-center ${mutedClass}`}>
                          {logSearch ? 'No matching logs' : 'No activity logs found'}
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.action.includes('approve') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              log.action.includes('deny') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              log.action.includes('add') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              log.action.includes('remove') || log.action.includes('delete') ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                              log.action.includes('block') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              log.action.includes('export') ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>{log.admin_email || 'Unknown'}</td>
                          <td className={`px-6 py-3 text-sm ${mutedClass} max-w-xs truncate`}>
                            {log.details?.username && <span className="font-mono">@{String(log.details.username)}</span>}
                            {log.details?.email && <span>{String(log.details.email)}</span>}
                            {log.details?.word && <span className="font-mono">{String(log.details.word)}</span>}
                            {log.details?.role && <span className="capitalize">{String(log.details.role)}</span>}
                            {log.details?.ip_address && <span className="font-mono">{String(log.details.ip_address)}</span>}
                            {log.details?.type && <span className="capitalize">{String(log.details.type)}</span>}
                          </td>
                          <td className={`px-6 py-3 text-sm ${mutedClass}`}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && <SettingsTab darkMode={darkMode} />}
      </main>

      {/* Denial Modal */}
      {showDenialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-4 ${textClass}`}>Deny Reservation</h2>
            <p className={`mb-4 ${mutedClass}`}>
              Optionally provide a reason for denial. This will be included in the email to the user.
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial (optional)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none ${inputClass}`}
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDenialModal(null);
                  setDenialReason("");
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeny(showDenialModal)}
                disabled={actionLoading === showDenialModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {actionLoading === showDenialModal ? "Denying..." : "Deny Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Denial Modal */}
      {showBulkDenialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 max-w-md w-full ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-4 ${textClass}`}>Deny {selectedReservations.size} Reservations</h2>
            <p className={`mb-4 ${mutedClass}`}>
              Optionally provide a reason for denial. This will be included in emails to all users.
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial (optional)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none ${inputClass}`}
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowBulkDenialModal(false);
                  setDenialReason("");
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction('deny')}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {bulkLoading ? "Denying..." : "Deny All Selected"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
