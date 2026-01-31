import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  LogOut, Check, X, Clock, RefreshCw, Users, Mail, Send, Image, 
  BarChart3, Ban, Trash2, Plus, CheckSquare, Square
} from "lucide-react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

interface Reservation {
  id: string;
  username: string;
  email: string;
  status: string;
  created_at: string;
  ip_address: string | null;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

interface BannedWord {
  id: string;
  word: string;
  reason: string | null;
  created_at: string;
}

interface Stats {
  reservations: {
    total: number;
    pending: number;
    approved: number;
    denied: number;
    todayCount: number;
    weekCount: number;
    approvalRate: number;
  };
  newsletter: {
    total: number;
    active: number;
    todayCount: number;
  };
  bannedWords: number;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "reservations" | "newsletter" | "banned">("dashboard");
  
  // Stats state
  const [stats, setStats] = useState<Stats | null>(null);
  
  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenialModal, setShowDenialModal] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showBulkDenialModal, setShowBulkDenialModal] = useState(false);
  
  // Newsletter state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterImageUrl, setNewsletterImageUrl] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Banned words state
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [newBannedWord, setNewBannedWord] = useState("");
  const [newBannedReason, setNewBannedReason] = useState("");
  const [addingWord, setAddingWord] = useState(false);
  
  const navigate = useNavigate();

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
      if (activeTab === "dashboard") {
        fetchStats();
      } else if (activeTab === "reservations") {
        fetchReservations();
      } else if (activeTab === "newsletter") {
        fetchSubscribers();
      } else if (activeTab === "banned") {
        fetchBannedWords();
      }
    }
  }, [isAdmin, filter, activeTab]);

  const fetchStats = async () => {
    const response = await supabase.functions.invoke('admin-get-stats');
    if (response.data?.stats) {
      setStats(response.data.stats);
    }
  };

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

  const handleApprove = async (reservationId: string) => {
    setActionLoading(reservationId);
    const response = await supabase.functions.invoke('update-reservation-status', {
      body: { reservationId, status: 'approved' }
    });
    if (response.data?.success) {
      fetchReservations();
      fetchStats();
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
      fetchStats();
      setShowDenialModal(null);
      setDenialReason("");
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
      fetchStats();
      setSelectedReservations(new Set());
      setShowBulkDenialModal(false);
      setDenialReason("");
    }
    setBulkLoading(false);
  };

  const toggleSelectAll = () => {
    const pendingReservations = reservations.filter(r => r.status === 'pending');
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
      fetchStats();
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
      fetchStats();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            You don't have admin privileges. Contact an administrator to get access.
          </p>
          <p className="text-sm text-gray-400 mb-4">Logged in as: {user?.email}</p>
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

  const activeSubscribers = subscribers.filter(s => s.is_active).length;
  const pendingReservations = reservations.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">BLOX City Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === "reservations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Reservations
            </button>
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === "newsletter"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail className="w-4 h-4" />
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab("banned")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === "banned"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Ban className="w-4 h-4" />
              Banned Words
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
              <button
                onClick={fetchStats}
                className="flex items-center gap-2 px-3 py-1.5 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition border border-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-gray-500 font-medium">Total Reservations</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{stats?.reservations.total || 0}</div>
                <div className="text-sm text-gray-500 mt-1">
                  +{stats?.reservations.todayCount || 0} today
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="text-gray-500 font-medium">Pending Review</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{stats?.reservations.pending || 0}</div>
                <div className="text-sm text-gray-500 mt-1">
                  Awaiting approval
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-500 font-medium">Approval Rate</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{stats?.reservations.approvalRate || 0}%</div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats?.reservations.approved || 0} approved, {stats?.reservations.denied || 0} denied
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-gray-500 font-medium">Newsletter Subs</span>
                </div>
                <div className="text-3xl font-bold text-gray-800">{stats?.newsletter.active || 0}</div>
                <div className="text-sm text-gray-500 mt-1">
                  +{stats?.newsletter.todayCount || 0} today
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">This Week</h3>
                <div className="text-2xl font-bold text-gray-800">{stats?.reservations.weekCount || 0}</div>
                <div className="text-sm text-gray-500">new reservations</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Banned Words</h3>
                <div className="text-2xl font-bold text-gray-800">{stats?.bannedWords || 0}</div>
                <div className="text-sm text-gray-500">blocked terms</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Subscribers</h3>
                <div className="text-2xl font-bold text-gray-800">{stats?.newsletter.total || 0}</div>
                <div className="text-sm text-gray-500">{(stats?.newsletter.total || 0) - (stats?.newsletter.active || 0)} unsubscribed</div>
              </div>
            </div>
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === "reservations" && (
          <>
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(['pending', 'approved', 'denied', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                onClick={fetchReservations}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Bulk Actions */}
            {filter === 'pending' && pendingReservations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-blue-700 hover:text-blue-800"
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
                    <span className="text-blue-700">{selectedReservations.size} selected</span>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {filter === 'pending' && (
                        <th className="w-10 px-4 py-4"></th>
                      )}
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Username</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">IP</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.length === 0 ? (
                      <tr>
                        <td colSpan={filter === 'pending' ? 7 : 6} className="px-6 py-12 text-center text-gray-500">
                          No reservations found
                        </td>
                      </tr>
                    ) : (
                      reservations.map((reservation) => (
                        <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {filter === 'pending' && (
                            <td className="px-4 py-4">
                              {reservation.status === 'pending' && (
                                <button onClick={() => toggleSelect(reservation.id)}>
                                  {selectedReservations.has(reservation.id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                  ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                  )}
                                </button>
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="font-semibold text-gray-800">{reservation.username}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{reservation.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              reservation.status === 'approved' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {reservation.status === 'pending' && <Clock className="w-3 h-3" />}
                              {reservation.status === 'approved' && <Check className="w-3 h-3" />}
                              {reservation.status === 'denied' && <X className="w-3 h-3" />}
                              {reservation.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm">
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                            {reservation.ip_address || '-'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {reservation.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
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
                              </div>
                            )}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Newsletter Subscribers</h2>
                  <p className="text-sm text-gray-500">
                    {activeSubscribers} active, {subscribers.length - activeSubscribers} unsubscribed
                  </p>
                </div>
                <button
                  onClick={fetchSubscribers}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          No subscribers yet
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((subscriber) => (
                        <tr key={subscriber.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-3 text-sm text-gray-800">{subscriber.email}</td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {new Date(subscriber.subscribed_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              subscriber.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {subscriber.is_active ? 'Active' : 'Unsubscribed'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Send Newsletter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Newsletter
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newsletterSubject}
                    onChange={(e) => setNewsletterSubject(e.target.value)}
                    placeholder="Newsletter subject line"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newsletterContent}
                    onChange={(e) => setNewsletterContent(e.target.value)}
                    placeholder="Write your newsletter content here..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newsletterImageUrl}
                    onChange={(e) => setNewsletterImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                {newsletterResult && (
                  <div className={`p-3 rounded-lg ${
                    newsletterResult.success
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {newsletterResult.message}
                  </div>
                )}
                
                <button
                  onClick={handleSendNewsletter}
                  disabled={sendingNewsletter || !newsletterSubject.trim() || !newsletterContent.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sendingNewsletter ? "Sending..." : `Send to ${activeSubscribers} subscribers`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banned Words Tab */}
        {activeTab === "banned" && (
          <div className="space-y-6">
            {/* Add New Word */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Banned Word
              </h2>
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  value={newBannedWord}
                  onChange={(e) => setNewBannedWord(e.target.value)}
                  placeholder="Word or phrase"
                  className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  value={newBannedReason}
                  onChange={(e) => setNewBannedReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={handleAddBannedWord}
                  disabled={addingWord || !newBannedWord.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  {addingWord ? "Adding..." : "Add Word"}
                </button>
              </div>
            </div>

            {/* Banned Words List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Banned Words List</h2>
                  <p className="text-sm text-gray-500">{bannedWords.length} words blocked</p>
                </div>
                <button
                  onClick={fetchBannedWords}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Word</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Reason</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Added</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedWords.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No banned words yet
                        </td>
                      </tr>
                    ) : (
                      bannedWords.map((word) => (
                        <tr key={word.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-6 py-3 font-mono text-sm text-gray-800">{word.word}</td>
                          <td className="px-6 py-3 text-sm text-gray-500">{word.reason || '-'}</td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {new Date(word.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleDeleteBannedWord(word.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
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
      </main>

      {/* Denial Modal */}
      {showDenialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deny Reservation</h2>
            <p className="text-gray-600 mb-4">
              Optionally provide a reason for denial. This will be included in the email to the user.
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial (optional)"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDenialModal(null);
                  setDenialReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deny {selectedReservations.size} Reservations</h2>
            <p className="text-gray-600 mb-4">
              Optionally provide a reason for denial. This will be included in emails to all users.
            </p>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Reason for denial (optional)"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowBulkDenialModal(false);
                  setDenialReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
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
