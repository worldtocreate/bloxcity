import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Check, X, Clock, RefreshCw, Users, Mail, Send, Image } from "lucide-react";
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

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reservations" | "newsletter">("reservations");
  
  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenialModal, setShowDenialModal] = useState<string | null>(null);
  
  // Newsletter state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterSubject, setNewsletterSubject] = useState("");
  const [newsletterContent, setNewsletterContent] = useState("");
  const [newsletterImageUrl, setNewsletterImageUrl] = useState("");
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [newsletterResult, setNewsletterResult] = useState<{ success: boolean; message: string } | null>(null);
  
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
      if (activeTab === "reservations") {
        fetchReservations();
      } else {
        fetchSubscribers();
      }
    }
  }, [isAdmin, filter, activeTab]);

  const fetchReservations = async () => {
    const response = await supabase.functions.invoke('admin-get-reservations', {
      body: { filter }
    });

    if (response.data?.reservations) {
      setReservations(response.data.reservations);
    }
  };

  const fetchSubscribers = async () => {
    const response = await supabase.functions.invoke('admin-get-newsletter-subscribers');

    if (response.data?.subscribers) {
      setSubscribers(response.data.subscribers);
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
  const inactiveSubscribers = subscribers.filter(s => !s.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Manage reservations & newsletter</p>
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
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("reservations")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === "reservations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4" />
              Username Reservations
            </button>
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === "newsletter"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Mail className="w-4 h-4" />
              Newsletter
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === "reservations" ? (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
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

            {/* Reservations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
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
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No reservations found
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <tr key={reservation.id} className="border-b border-gray-100 hover:bg-gray-50">
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
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscribers List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Newsletter Subscribers</h2>
                  <p className="text-sm text-gray-500">
                    {activeSubscribers} active, {inactiveSubscribers} unsubscribed
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
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a public image URL to include in the newsletter
                  </p>
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
    </div>
  );
};

export default Admin;
