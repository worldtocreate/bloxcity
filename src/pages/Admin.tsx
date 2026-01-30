import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Check, X, Clock, RefreshCw } from "lucide-react";
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";

interface Reservation {
  id: string;
  username: string;
  email: string;
  status: string;
  created_at: string;
  ip_address: string | null;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenialModal, setShowDenialModal] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user is admin using the has_role function
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
      fetchReservations();
    }
  }, [isAdmin, filter]);

  const fetchReservations = async () => {
    const response = await supabase.functions.invoke('admin-get-reservations', {
      body: { filter }
    });

    if (response.data?.reservations) {
      setReservations(response.data.reservations);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Username Reservations</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
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
