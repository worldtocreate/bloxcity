import { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, RefreshCw, Shield, AlertCircle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BlockedIP } from './types';

export default function IPBlockingTab() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newIP, setNewIP] = useState('');
  const [newReason, setNewReason] = useState('');
  const [expiresDays, setExpiresDays] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', { body: { action: 'list' } });
    if (response.data?.blockedIPs) setBlockedIPs(response.data.blockedIPs);
    setLoading(false);
  };

  useEffect(() => { fetchBlockedIPs(); }, []);

  const handleBlockIP = async () => {
    if (!newIP.trim()) return;
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (!ipv4Regex.test(newIP.trim()) && !ipv6Regex.test(newIP.trim())) { setError('Please enter a valid IP address'); return; }
    setAdding(true); setError(null);
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', { body: { action: 'block', ip_address: newIP.trim(), reason: newReason.trim() || null, expires_days: expiresDays } });
    if (response.data?.success) { fetchBlockedIPs(); setNewIP(''); setNewReason(''); setExpiresDays(null); }
    else if (response.data?.error) setError(response.data.error);
    setAdding(false);
  };

  const handleUnblockIP = async (id: string) => {
    const response = await supabase.functions.invoke('admin-manage-blocked-ips', { body: { action: 'unblock', id } });
    if (response.data?.success) fetchBlockedIPs();
  };

  const filteredIPs = blockedIPs.filter(ip => ip.ip_address.includes(searchQuery) || (ip.reason && ip.reason.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Shield className="w-5 h-5 text-red-400" />Block IP Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1"><label className="block text-sm font-medium mb-1 text-gray-300">IP Address *</label><input type="text" value={newIP} onChange={e => setNewIP(e.target.value)} placeholder="192.168.1.1" className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:ring-2 focus:ring-red-500" /></div>
          <div className="md:col-span-1"><label className="block text-sm font-medium mb-1 text-gray-300">Reason</label><input type="text" value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Spam, abuse, etc." className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white" /></div>
          <div className="md:col-span-1"><label className="block text-sm font-medium mb-1 text-gray-300">Expires</label><select value={expiresDays ?? ''} onChange={e => setExpiresDays(e.target.value ? parseInt(e.target.value) : null)} className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white"><option value="">Never (permanent)</option><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select></div>
          <div className="md:col-span-1 flex items-end"><button onClick={handleBlockIP} disabled={adding || !newIP.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition disabled:opacity-50"><Plus className="w-4 h-4" />{adding ? 'Blocking...' : 'Block IP'}</button></div>
        </div>
        {error && <div className="mt-4 p-3 bg-red-900/20 text-red-400 rounded-lg border border-red-800 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
        <p className="mt-3 text-sm text-gray-500">Blocked IPs will be unable to make any reservations. Use with caution.</p>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#12121a]">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div><h2 className="text-lg font-semibold text-white">Blocked IP Addresses</h2><p className="text-sm text-gray-400">{blockedIPs.length} IP{blockedIPs.length !== 1 ? 's' : ''} currently blocked</p></div>
          <div className="flex items-center gap-3">
            <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search IPs..." className="pl-9 pr-4 py-2 w-48 border border-white/10 rounded-lg bg-white/5 text-white text-sm" /></div>
            <button onClick={fetchBlockedIPs} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0a0a0f] border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-400">IP Address</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-400">Reason</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-400">Blocked At</th>
                <th className="text-left px-6 py-3 text-xs font-semibold uppercase text-gray-400">Expires</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading blocked IPs...</td></tr> : filteredIPs.length === 0 ? <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">{searchQuery ? 'No matching IPs found' : 'No blocked IPs yet'}</td></tr> : (
                filteredIPs.map(ip => (
                  <tr key={ip.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3 font-mono text-sm text-gray-200"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-500" />{ip.ip_address}</div></td>
                    <td className="px-6 py-3 text-sm text-gray-400">{ip.reason || '-'}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">{new Date(ip.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">{ip.expires_at ? <span className={new Date(ip.expires_at) < new Date() ? 'text-red-400' : ''}>{new Date(ip.expires_at).toLocaleDateString()}</span> : <span className="text-orange-400 font-medium">Permanent</span>}</td>
                    <td className="px-6 py-3 text-right"><button onClick={() => handleUnblockIP(ip.id)} className="flex items-center gap-1 px-3 py-1.5 text-green-400 hover:bg-green-900/20 rounded-lg transition ml-auto"><Shield className="w-4 h-4" />Unblock</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
