import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { 
  Check, X, Clock, RefreshCw, Mail, Send, Image, 
  Ban, Trash2, Plus, CheckSquare, Square,
  UserPlus, UserMinus, Search, Download, Loader2
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
import { useToast } from "@/hooks/use-toast";
import { Crown, Trash2 as TrashIcon, Check as CheckIcon, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// NOTE: Inlined to avoid production module resolution issues.
const GamesManagementTab = ({ darkMode }: { darkMode: boolean }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "under_review" | "public" | "private">("all");
  const [rows, setRows] = useState<
    Array<{
      id: string;
      title: string;
      category: string;
      is_private: boolean | null;
      is_under_review: boolean | null;
      thumbnail_url: string | null;
      thumbnail_status: string | null;
      created_at: string;
      creator: { username: string } | null;
    }>
  >([]);

  const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-800";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-500";
  const inputClass = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-800";

  const fetchGames = async () => {
    setLoading(true);
    let query = supabase
      .from("forum_games")
      .select(
        "id,title,category,is_private,is_under_review,thumbnail_url,thumbnail_status,created_at,creator:creator_id(username)"
      )
      .order("created_at", { ascending: false });

    if (filter === "under_review") query = query.eq("is_under_review", true);
    if (filter === "public") query = query.eq("is_private", false).eq("is_under_review", false);
    if (filter === "private") query = query.eq("is_private", true);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Failed to load games", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const creator = r.creator?.username?.toLowerCase() || "";
      return r.title.toLowerCase().includes(needle) || creator.includes(needle);
    });
  }, [rows, q]);

  const setReview = async (id: string, next: boolean) => {
    const { error } = await supabase.from("forum_games").update({ is_under_review: next }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next ? "Marked under review" : "Review cleared" });
    void fetchGames();
  };

  const setPrivate = async (id: string, next: boolean) => {
    const { error } = await supabase.from("forum_games").update({ is_private: next }).eq("id", id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: next ? "Game set to private" : "Game set to public" });
    void fetchGames();
  };

  return (
    <div className="space-y-6">
      <div className={`${cardClass} border rounded-xl p-6`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className={`text-lg font-semibold ${textClass}`}>Games Management</h2>
            <p className={`text-sm ${mutedClass}`}>Flag games for review, or make them public/private.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title or creator…"
                className={`pl-10 pr-3 py-2 border rounded-lg outline-none ${inputClass}`}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className={`px-3 py-2 border rounded-lg outline-none ${inputClass}`}
            >
              <option value="all">All</option>
              <option value="under_review">Under review</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchGames}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={darkMode ? "text-gray-300" : "text-gray-600"}>
                <th className="text-left py-2">Game</th>
                <th className="text-left py-2">Creator</th>
                <th className="text-left py-2">Thumb</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Visibility</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={`py-10 text-center ${mutedClass}`}>
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" /> Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-10 text-center ${mutedClass}`}>No games found.</td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className={darkMode ? "border-t border-gray-700" : "border-t border-gray-200"}>
                    <td className={`py-3 ${textClass}`}>
                      <a href={`/game/${g.id}`} className="hover:underline">{g.title}</a>
                      <div className={`text-xs ${mutedClass}`}>{g.category}</div>
                    </td>
                    <td className={`py-3 ${textClass}`}>{g.creator?.username || "Unknown"}</td>
                    <td className="py-3">
                      <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-200/20 flex items-center justify-center relative">
                        {g.thumbnail_url ? (
                          <img
                            src={g.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover absolute inset-0"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${mutedClass}"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          <Image className={`w-5 h-5 ${mutedClass}`} />
                        )}
                      </div>
                    </td>
                    <td className={`py-3 ${textClass}`}>
                      {g.is_under_review ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600">
                          <Clock className="w-4 h-4" /> Under review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Check className="w-4 h-4" /> OK
                        </span>
                      )}
                      {g.thumbnail_status && (
                        <div className={`text-xs ${mutedClass}`}>Thumb: {g.thumbnail_status}</div>
                      )}
                    </td>
                    <td className={`py-3 ${textClass}`}>
                      {g.is_private ? (
                        <span className="inline-flex items-center gap-1">
                          <EyeOff className="w-4 h-4" /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-4 h-4" /> Public
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant={g.is_under_review ? "default" : "outline"}
                          onClick={() => setReview(g.id, !g.is_under_review)}
                        >
                          {g.is_under_review ? "Clear review" : "Under review"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrivate(g.id, !g.is_private)}
                        >
                          {g.is_private ? "Make public" : "Make private"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Full AdminPinGate implementation with PIN setup and verification
import { Lock, Eye, EyeOff, Shield, KeyRound } from "lucide-react";

const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "bloxcity_admin_salt_v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

const AdminPinGate = ({
  userId,
  onAuthenticated,
  darkMode,
}: {
  userId: string;
  onAuthenticated: () => void;
  darkMode: boolean;
}) => {
  const [mode, setMode] = useState<"loading" | "setup" | "verify">("loading");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [storedHash, setStoredHash] = useState<string | null>(null);

  useEffect(() => {
    const checkPinStatus = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("admin_pin_hash")
        .eq("user_id", userId)
        .single();
      
      if (data?.admin_pin_hash) {
        setStoredHash(data.admin_pin_hash);
        setMode("verify");
      } else {
        setMode("setup");
      }
    };
    checkPinStatus();
  }, [userId]);

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value.slice(-1);
    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }
    setError("");

    if (value && index < 3) {
      const nextInput = document.getElementById(isConfirm ? `confirm-pin-${index + 1}` : `pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, isConfirm = false) => {
    if (e.key === "Backspace" && index > 0) {
      const currentVal = isConfirm ? confirmPin[index] : pin[index];
      if (!currentVal) {
        const prevInput = document.getElementById(isConfirm ? `confirm-pin-${index - 1}` : `pin-${index - 1}`);
        prevInput?.focus();
      }
    }
  };

  const handleSetupPin = async () => {
    const pinStr = pin.join("");
    const confirmStr = confirmPin.join("");

    if (pinStr.length !== 4) {
      setError("Please enter a 4-digit PIN");
      return;
    }
    if (pinStr !== confirmStr) {
      setError("PINs do not match");
      return;
    }

    setLoading(true);
    const pinHash = await hashPin(pinStr);

    const { error: updateError } = await supabase
      .from("user_roles")
      .update({ admin_pin_hash: pinHash })
      .eq("user_id", userId);

    if (updateError) {
      setError("Failed to save PIN. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onAuthenticated();
  };

  const handleVerifyPin = async () => {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) {
      setError("Please enter your 4-digit PIN");
      return;
    }

    setLoading(true);
    const pinHash = await hashPin(pinStr);

    if (pinHash === storedHash) {
      onAuthenticated();
    } else {
      setError("Incorrect PIN");
      setPin(["", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    }
    setLoading(false);
  };

  const inputClass = `w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white"
      : "bg-white border-gray-300 text-gray-800"
  }`;

  if (mode === "loading") {
    return (
      <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} flex items-center justify-center p-4`}>
      <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-8 max-w-md w-full`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
            {mode === "setup" ? (
              <KeyRound className="w-8 h-8 text-blue-500" />
            ) : (
              <Shield className="w-8 h-8 text-blue-500" />
            )}
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
            {mode === "setup" ? "Set Up Admin PIN" : "Enter Admin PIN"}
          </h1>
          <p className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {mode === "setup"
              ? "Create a 4-digit PIN to secure admin access"
              : "Enter your PIN to access the admin panel"}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              {mode === "setup" ? "Create PIN" : "Your PIN"}
            </label>
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[i]}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={inputClass}
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>

          {mode === "setup" && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                Confirm PIN
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`confirm-pin-${i}`}
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    value={confirmPin[i]}
                    onChange={(e) => handlePinChange(i, e.target.value, true)}
                    onKeyDown={(e) => handleKeyDown(e, i, true)}
                    className={inputClass}
                  />
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className={`flex items-center gap-2 mx-auto text-sm ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPin ? "Hide PIN" : "Show PIN"}
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={mode === "setup" ? handleSetupPin : handleVerifyPin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "setup" ? "Set PIN & Continue" : "Verify & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Full VerificationRequestsTab implementation
const VerificationRequestsTab = ({ darkMode }: { darkMode: boolean }) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState("");
  const [showDenialModal, setShowDenialModal] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "denied" | "all">("pending");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from("forum_verification_requests")
      .select(`
        id,
        request_type,
        reason,
        status,
        created_at,
        denial_reason,
        reviewed_at,
        forum_user_id,
        forum_users!forum_verification_requests_forum_user_id_fkey (
          id,
          username,
          avatar_url,
          is_verified
        )
      `)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const handleDecision = async (requestId: string, decision: "approved" | "denied", reason?: string) => {
    setProcessing(requestId);
    
    const { data, error } = await supabase.functions.invoke("admin-manage-users", {
      body: {
        action: "review_verification",
        requestId,
        decision,
        denialReason: reason,
      },
    });

    if (error || data?.error) {
      toast({
        title: "Error",
        description: error?.message || data?.error || "Failed to process request",
        variant: "destructive",
      });
    } else {
      toast({
        title: decision === "approved" ? "Approved" : "Denied",
        description: `Request has been ${decision}`,
      });
      fetchRequests();
    }

    setProcessing(null);
    setShowDenialModal(null);
    setDenialReason("");
  };

  const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-800";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${textClass}`}>Verification Requests</h2>
        <div className="flex gap-2">
          {(["pending", "approved", "denied", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className={`${cardClass} border rounded-xl p-8 text-center`}>
          <p className={mutedClass}>No {filter === "all" ? "" : filter} requests found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={req.forum_users?.avatar_url || "/placeholder.svg"}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${textClass}`}>
                        {req.forum_users?.username || "Unknown"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          req.request_type === "gold"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {req.request_type === "gold" ? "Gold" : "Blue"} Checkmark
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          req.status === "pending"
                            ? "bg-orange-500/20 text-orange-500"
                            : req.status === "approved"
                            ? "bg-green-500/20 text-green-500"
                            : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className={`text-sm ${mutedClass}`}>
                      Requested {new Date(req.created_at).toLocaleDateString()}
                    </p>
                    {req.reason && (
                      <p className={`text-sm mt-1 ${mutedClass}`}>
                        <span className="font-medium">Reason:</span> {req.reason}
                      </p>
                    )}
                    {req.denial_reason && (
                      <p className="text-sm mt-1 text-red-400">
                        <span className="font-medium">Denied:</span> {req.denial_reason}
                      </p>
                    )}
                  </div>
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(req.id, "approved")}
                      disabled={processing === req.id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      {processing === req.id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => setShowDenialModal(req.id)}
                      disabled={processing === req.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Denial Modal */}
      {showDenialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} border rounded-xl p-6 max-w-md w-full`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Deny Request</h3>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Enter reason for denial..."
              className={`w-full p-3 rounded-lg border resize-none h-24 ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-800"
              }`}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDenialModal(null);
                  setDenialReason("");
                }}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  darkMode ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(showDenialModal, "denied", denialReason)}
                disabled={!denialReason.trim() || processing === showDenialModal}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {processing === showDenialModal ? "Denying..." : "Deny Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type ForumUserLite = { id: string; username: string; avatar_url: string | null };
type GoldUserRow = { id: string; forum_user_id: string; granted_at: string; forum_users?: { username: string } | null };
type AffiliateRequestRow = { id: string; status: string; admin_approved: boolean; created_at: string; gold_user?: { username: string } | null; affiliate_user?: { username: string } | null };
type AffiliateRow = { id: string; gold_user_id: string; affiliate_user_id: string; created_at: string; gold_user?: { username: string } | null; affiliate_user?: { username: string } | null };

const GoldCheckmarksTab = ({ darkMode }: { darkMode: boolean }) => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ForumUserLite[]>([]);
  const [goldUsers, setGoldUsers] = useState<GoldUserRow[]>([]);
  const [pending, setPending] = useState<AffiliateRequestRow[]>([]);
  
  // Force affiliate state
  const [forceAffiliateMode, setForceAffiliateMode] = useState(false);
  const [selectedGoldUser, setSelectedGoldUser] = useState<{ id: string; username: string } | null>(null);
  const [affiliateQuery, setAffiliateQuery] = useState("");
  const [affiliateSearchResults, setAffiliateSearchResults] = useState<ForumUserLite[]>([]);
  const [affiliateSearching, setAffiliateSearching] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);

  useEffect(() => { void refreshAll(); }, []);

  const refreshAll = async () => { await Promise.all([fetchGoldUsers(), fetchPendingRequests(), fetchAffiliates()]); };

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

  const fetchAffiliates = async () => {
    const { data } = await supabase.from("forum_affiliates")
      .select("id, gold_user_id, affiliate_user_id, created_at, gold_user:forum_users!forum_affiliates_gold_user_id_fkey(username), affiliate_user:forum_users!forum_affiliates_affiliate_user_id_fkey(username)")
      .order("created_at", { ascending: false });
    if (data) setAffiliates(data as unknown as AffiliateRow[]);
  };

  const onSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const { data } = await supabase.from("forum_users").select("id, username, avatar_url").ilike("username", `%${query.trim()}%`).limit(10);
    setSearching(false);
    if (data) setSearchResults(data as ForumUserLite[]);
  };

  const onAffiliateSearch = async () => {
    if (!affiliateQuery.trim()) return;
    setAffiliateSearching(true);
    const { data } = await supabase.from("forum_users").select("id, username, avatar_url").ilike("username", `%${affiliateQuery.trim()}%`).limit(10);
    setAffiliateSearching(false);
    if (data) setAffiliateSearchResults(data as ForumUserLite[]);
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

  const forceAffiliate = async (affiliateUserId: string, affiliateUsername: string) => {
    if (!selectedGoldUser) return;
    const { error } = await supabase.from("forum_affiliates").insert({
      gold_user_id: selectedGoldUser.id,
      affiliate_user_id: affiliateUserId
    });
    if (error) { 
      toast({ title: "Error", description: error.message, variant: "destructive" }); 
      return; 
    }
    toast({ 
      title: "Affiliate Added", 
      description: `${affiliateUsername} is now an affiliate of ${selectedGoldUser.username}` 
    });
    setAffiliateSearchResults([]); 
    setAffiliateQuery(""); 
    setSelectedGoldUser(null);
    setForceAffiliateMode(false);
    await fetchAffiliates();
  };

  const removeAffiliate = async (id: string, affiliateUsername: string) => {
    const { error } = await supabase.from("forum_affiliates").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Removed", description: `${affiliateUsername} is no longer an affiliate` });
    await fetchAffiliates();
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

      {/* Force Affiliate Card */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
            Force Affiliate User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!forceAffiliateMode ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Force add a user as an affiliate to a Gold checkmark holder without requiring their acceptance.
              </p>
              <Button onClick={() => setForceAffiliateMode(true)} variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />Start Force Affiliate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!selectedGoldUser ? (
                <div>
                  <p className="text-sm font-medium mb-2">Step 1: Select Gold User</p>
                  <div className="space-y-2">
                    {goldUsers.map((g) => (
                      <div key={g.id} className="flex items-center justify-between rounded-md border p-2">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          {g.forum_users?.username ?? "Unknown"}
                        </span>
                        <Button size="sm" onClick={() => setSelectedGoldUser({ id: g.forum_user_id, username: g.forum_users?.username ?? "" })}>
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" onClick={() => setForceAffiliateMode(false)} className="mt-2">Cancel</Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Step 2: Select user to affiliate to <span className="text-yellow-500">{selectedGoldUser.username}</span>
                  </p>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      value={affiliateQuery} 
                      onChange={(e) => setAffiliateQuery(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && onAffiliateSearch()} 
                      placeholder="Search username to affiliate…" 
                      className={darkMode ? "bg-gray-700 border-gray-600" : ""} 
                    />
                    <Button onClick={onAffiliateSearch} disabled={affiliateSearching}><Search className="h-4 w-4" /></Button>
                  </div>
                  {affiliateSearchResults.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {affiliateSearchResults.map((u) => (
                        <div key={u.id} className="flex items-center justify-between rounded-md border p-2">
                          <span>{u.username}</span>
                          <Button size="sm" onClick={() => forceAffiliate(u.id, u.username)}>
                            Make Affiliate
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" onClick={() => { setSelectedGoldUser(null); setAffiliateQuery(""); setAffiliateSearchResults([]); }}>
                    Back
                  </Button>
                </div>
              )}
            </div>
          )}
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

      {/* Current Affiliates */}
      <Card className={cardClass}>
        <CardHeader><CardTitle>Current Affiliates</CardTitle></CardHeader>
        <CardContent>
          {affiliates.length === 0 ? <p className="text-sm text-muted-foreground">No affiliates.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Gold User</TableHead><TableHead>Affiliate</TableHead><TableHead>Since</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{affiliates.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="flex items-center gap-2"><Crown className="h-4 w-4 text-yellow-500" />{a.gold_user?.username ?? "Unknown"}</TableCell>
                  <TableCell>{a.affiliate_user?.username ?? "Unknown"}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="destructive" onClick={() => removeAffiliate(a.id, a.affiliate_user?.username ?? "User")}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
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

// Support Tickets Tab
function SupportTicketsTab({ darkMode }: { darkMode: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"open" | "in_progress" | "closed" | "all">("open");
  const [adminForumUserId, setAdminForumUserId] = useState<string | null>(null);
  const [loadingAdminId, setLoadingAdminId] = useState(true);

  const cardClass = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-800";
  const mutedClass = darkMode ? "text-gray-400" : "text-gray-500";
  const inputClass = darkMode
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-white border-gray-200 text-gray-900 placeholder-gray-500";

  const ensureAdminForumUserId = async (): Promise<string> => {
    if (adminForumUserId) return adminForumUserId;

    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    const authUserId = auth.user?.id;
    if (!authUserId) throw new Error("Not signed in");

    const { data: forumRow, error: forumErr } = await supabase
      .from("forum_users")
      .select("id")
      .eq("user_id", authUserId)
      .single();
    if (forumErr) throw forumErr;
    if (!forumRow?.id) throw new Error("Forum user not found");

    setAdminForumUserId(forumRow.id);
    return forumRow.id;
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("forum_support_tickets")
        .select("id, subject, status, creator_id, created_at, updated_at, claimed_by, claimed_at, closed_at")
        .order("updated_at", { ascending: false });

      if (filter !== "all") query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
      if (!selectedId && (data?.length ?? 0) > 0) setSelectedId(data![0].id);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load tickets", variant: "destructive" });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from("forum_support_ticket_replies")
        .select("id, ticket_id, author_id, message, created_at, is_staff_reply")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setReplies(data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load replies", variant: "destructive" });
      setReplies([]);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingAdminId(true);
        await ensureAdminForumUserId();
      } catch (e: any) {
        if (!alive) return;
        toast({
          title: "Error",
          description: e?.message || "Failed to load admin user",
          variant: "destructive",
        });
      } finally {
        if (alive) setLoadingAdminId(false);
      }
    })();

    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    if (!selectedId) return;
    fetchReplies(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const claimTicket = async () => {
    if (!selectedId) return;
    try {
      const forumUserId = await ensureAdminForumUserId();

      const { error } = await supabase
        .from("forum_support_tickets")
        .update({ status: "in_progress", claimed_by: forumUserId, claimed_at: new Date().toISOString() })
        .eq("id", selectedId);
      if (error) throw error;
      await fetchTickets();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to claim ticket", variant: "destructive" });
    }
  };

  const closeTicket = async () => {
    if (!selectedId) return;
    try {
      const forumUserId = await ensureAdminForumUserId();

      const { error } = await supabase
        .from("forum_support_tickets")
        .update({ status: "closed", closed_by: forumUserId, closed_at: new Date().toISOString() })
        .eq("id", selectedId);
      if (error) throw error;
      await fetchTickets();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to close ticket", variant: "destructive" });
    }
  };

  const sendReply = async () => {
    if (!selectedId) return;
    const trimmed = reply.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const forumUserId = await ensureAdminForumUserId();

      const { error } = await supabase
        .from("forum_support_ticket_replies")
        .insert({ ticket_id: selectedId, author_id: forumUserId, message: trimmed, is_staff_reply: true });
      if (error) throw error;
      setReply("");
      await fetchReplies(selectedId);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const selected = useMemo(() => tickets.find((t) => t.id === selectedId) || null, [tickets, selectedId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className={`text-xl font-semibold ${textClass}`}>Support Tickets</h2>
        <div className="flex gap-2">
          {(["open", "in_progress", "closed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "in_progress" ? "In Progress" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchTickets}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              darkMode ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading || loadingAdminId ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className={`${cardClass} border rounded-xl p-8 text-center`}>
          <p className={mutedClass}>No tickets found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${cardClass} border rounded-xl overflow-hidden lg:col-span-1`}>
            <div className={`px-4 py-3 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <p className={`text-sm font-medium ${textClass}`}>Tickets</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 border-b transition ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  } ${
                    selectedId === t.id
                      ? darkMode
                        ? "bg-gray-700"
                        : "bg-gray-50"
                      : "hover:bg-gray-50/60 dark:hover:bg-gray-700/40"
                  }`}
                >
                  <p className={`text-sm font-semibold truncate ${textClass}`}>{t.subject}</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${mutedClass}`}>{new Date(t.created_at).toLocaleString()}</p>
                    <span className={`text-xs ${mutedClass}`}>{t.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${cardClass} border rounded-xl p-4 lg:col-span-2`}>
            {!selected ? (
              <p className={mutedClass}>Select a ticket to view details.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className={`text-lg font-semibold ${textClass}`}>{selected.subject}</h3>
                    <p className={`text-sm ${mutedClass}`}>Status: {selected.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {!selected.claimed_by && selected.status !== "closed" && (
                      <button
                        onClick={claimTicket}
                        className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition"
                      >
                        Claim
                      </button>
                    )}
                    {selected.status !== "closed" && (
                      <button
                        onClick={closeTicket}
                        className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                <div className={`rounded-lg border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="p-4 max-h-[45vh] overflow-y-auto space-y-3">
                    {replies.length === 0 ? (
                      <p className={mutedClass}>No replies yet.</p>
                    ) : (
                      replies.map((r) => (
                        <div
                          key={r.id}
                          className={`rounded-lg border p-3 ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                        >
                          <p className={`text-xs ${mutedClass}`}>{new Date(r.created_at).toLocaleString()}</p>
                          <p className={`mt-2 text-sm whitespace-pre-wrap ${textClass}`}>{r.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {selected.status !== "closed" && (
                  <div className="space-y-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply..."
                      className={`w-full min-h-[100px] px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${inputClass}`}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={sendReply}
                        disabled={sending || !reply.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
                      >
                        {sending ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending
                          </span>
                        ) : (
                          "Send"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { 
  Reservation, NewsletterSubscriber, BannedWord, 
  AdminUser, ActivityLog, AdminTab 
} from "@/components/admin/types";

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
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

      // Check moderator role
      const { data: hasModRole } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'moderator'
      });
      setIsModerator(hasModRole === true);

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
    if (isAdmin || isModerator) {
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
  }, [isAdmin, isModerator, filter, activeTab, logFilter]);

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

  if (!isAdmin && !isModerator) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8 max-w-md text-center`}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>Access Denied</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>
            You don't have admin or moderator privileges. Contact an administrator to get access.
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
      <AdminTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        darkMode={darkMode}
      >
        <div className="p-4 lg:p-6">
          <AdminHeader 
            user={user} 
            onLogout={handleLogout} 
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
          />
          <div className="mt-6">
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

        {/* Support Tickets Tab */}
        {activeTab === "support-tickets" && <SupportTicketsTab darkMode={darkMode} />}

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

        {/* Games Management Tab */}
        {activeTab === "games" && <GamesManagementTab darkMode={darkMode} />}
        
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
          </div>
        </div>
      </AdminTabs>

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
