import { useState, useEffect } from "react";
import { Globe, Plus, Trash2, RefreshCw, Shield, AlertCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BlockedIP } from "./types";

interface IPBlockingTabProps {
  darkMode: boolean;
}

const IPBlockingTab = ({ darkMode }: IPBlockingTabProps) => {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [expiresDays, setExpiresDays] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', {
      body: { action: 'list' }
    });
    if (response.data?.blockedIPs) {
      setBlockedIPs(response.data.blockedIPs);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const handleBlockIP = async () => {
    if (!newIP.trim()) return;
    
    // Basic IP validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(newIP.trim()) && !ipv6Regex.test(newIP.trim())) {
      setError("Please enter a valid IP address");
      return;
    }
    
    setAdding(true);
    setError(null);
    
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', {
      body: { 
        action: 'block', 
        ip_address: newIP.trim(),
        reason: newReason.trim() || null,
        expires_days: expiresDays
      }
    });
    
    if (response.data?.success) {
      fetchBlockedIPs();
      setNewIP("");
      setNewReason("");
      setExpiresDays(null);
    } else if (response.data?.error) {
      setError(response.data.error);
    }
    setAdding(false);
  };

  const handleUnblockIP = async (id: string) => {
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', {
      body: { action: 'unblock', id }
    });
    
    if (response.data?.success) {
      fetchBlockedIPs();
    }
  };

  const filteredIPs = blockedIPs.filter(ip => 
    ip.ip_address.includes(searchQuery) || 
    (ip.reason && ip.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cardClass = darkMode 
    ? 'bg-gray-800 border-gray-700' 
    : 'bg-white border-gray-200';

  const inputClass = darkMode
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-200 text-gray-900';

  return (
    <div className="space-y-6">
      {/* Block New IP */}
      <div className={`rounded-xl shadow-sm border p-6 ${cardClass}`}>
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Shield className="w-5 h-5 text-red-500" />
          Block IP Address
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              IP Address *
            </label>
            <input
              type="text"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="192.168.1.1"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${inputClass}`}
            />
          </div>
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reason
            </label>
            <input
              type="text"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="Spam, abuse, etc."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${inputClass}`}
            />
          </div>
          <div className="md:col-span-1">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Expires
            </label>
            <select
              value={expiresDays ?? ''}
              onChange={(e) => setExpiresDays(e.target.value ? parseInt(e.target.value) : null)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${inputClass}`}
            >
              <option value="">Never (permanent)</option>
              <option value="1">1 day</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={handleBlockIP}
              disabled={adding || !newIP.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {adding ? "Blocking..." : "Block IP"}
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <p className={`mt-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Blocked IPs will be unable to make any reservations. Use with caution.
        </p>
      </div>

      {/* Blocked IPs List */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Blocked IP Addresses</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {blockedIPs.length} IP{blockedIPs.length !== 1 ? 's' : ''} currently blocked
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search IPs..."
                className={`pl-9 pr-4 py-2 w-48 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
              />
            </div>
            <button
              onClick={fetchBlockedIPs}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <tr>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>IP Address</th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reason</th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Blocked At</th>
                <th className={`text-left px-6 py-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Expires</th>
                <th className={`text-right px-6 py-3 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading blocked IPs...
                  </td>
                </tr>
              ) : filteredIPs.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {searchQuery ? 'No matching IPs found' : 'No blocked IPs yet'}
                  </td>
                </tr>
              ) : (
                filteredIPs.map((ip) => (
                  <tr key={ip.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className={`px-6 py-3 font-mono text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        {ip.ip_address}
                      </div>
                    </td>
                    <td className={`px-6 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {ip.reason || '-'}
                    </td>
                    <td className={`px-6 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(ip.created_at).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {ip.expires_at ? (
                        <span className={new Date(ip.expires_at) < new Date() ? 'text-red-500' : ''}>
                          {new Date(ip.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-orange-500 font-medium">Permanent</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleUnblockIP(ip.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition ml-auto"
                      >
                        <Shield className="w-4 h-4" />
                        Unblock
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
  );
};

export default IPBlockingTab;
