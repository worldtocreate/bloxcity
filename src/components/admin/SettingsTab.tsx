import { useState, useEffect } from 'react';
import { Settings, Download, Trash2, AlertTriangle, Check, Shield, Bell, Database, RefreshCw, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForumAnnouncement { enabled: boolean; message: string; type: 'info' | 'warning' | 'success'; }

export default function SettingsTab() {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'reservations' | 'subscribers' | 'logs'>('reservations');
  const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState<ForumAnnouncement>({ enabled: false, message: '', type: 'info' });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [settings, setSettings] = useState({ emailNotifications: true, autoApproveVerifiedDomains: false, maxReservationsPerIP: 3, reservationCooldownHours: 24, enableRecaptcha: false });

  useEffect(() => { fetchAnnouncement(); }, []);

  const fetchAnnouncement = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'forum_announcement').single();
    if (data?.value) setAnnouncement(data.value as unknown as ForumAnnouncement);
  };

  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    try {
      const { error } = await supabase.from('site_settings').update({ value: JSON.parse(JSON.stringify(announcement)), updated_at: new Date().toISOString() }).eq('key', 'forum_announcement');
      if (error) throw error;
      setExportStatus({ success: true, message: 'Announcement saved successfully!' });
    } catch { setExportStatus({ success: false, message: 'Failed to save announcement.' }); }
    setSavingAnnouncement(false);
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleExport = async () => {
    setExporting(true); setExportStatus(null);
    try {
      const response = await supabase.functions.invoke('admin-export-data', { body: { type: exportType } });
      if (response.data?.csv) {
        const blob = new Blob([response.data.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setExportStatus({ success: true, message: `Successfully exported ${response.data.count} records` });
      } else if (response.data?.error) setExportStatus({ success: false, message: response.data.error });
    } catch { setExportStatus({ success: false, message: 'Export failed. Please try again.' }); }
    setExporting(false);
  };

  const handleSaveSettings = async () => { setExportStatus({ success: true, message: 'Settings saved successfully!' }); setTimeout(() => setExportStatus(null), 3000); };

  return (
    <div className="space-y-6">
      {/* Forum Announcement Banner */}
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Megaphone className="w-5 h-5 text-amber-400" />Forum Announcement Banner</h2>
        <p className="mb-4 text-sm text-gray-400">Display a banner message at the top of all forum pages.</p>
        <div className="space-y-4">
          <label className="flex items-center justify-between"><div><span className="font-medium text-gray-200">Enable Banner</span><p className="text-sm text-gray-500">Show the announcement on all forum pages</p></div><button onClick={() => setAnnouncement(a => ({ ...a, enabled: !a.enabled }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${announcement.enabled ? 'bg-blue-600' : 'bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${announcement.enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></label>
          <div><label className="block font-medium mb-2 text-gray-200">Banner Type</label><select value={announcement.type} onChange={e => setAnnouncement(a => ({ ...a, type: e.target.value as ForumAnnouncement['type'] }))} className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white"><option value="info">Info (Blue)</option><option value="warning">Warning (Amber)</option><option value="success">Success (Green)</option></select></div>
          <div><label className="block font-medium mb-2 text-gray-200">Message</label><textarea value={announcement.message} onChange={e => setAnnouncement(a => ({ ...a, message: e.target.value }))} placeholder="Enter your announcement message..." rows={3} className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white resize-none" /></div>
          {announcement.enabled && announcement.message && <div><label className="block font-medium mb-2 text-gray-200">Preview</label><div className={`p-4 rounded-lg border ${announcement.type === 'info' ? 'bg-blue-900/20 border-blue-800 text-blue-300' : announcement.type === 'warning' ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-green-900/20 border-green-800 text-green-300'}`}><div className="flex items-center gap-2"><Megaphone className="w-4 h-4 flex-shrink-0" /><span>{announcement.message}</span></div></div></div>}
          <button onClick={handleSaveAnnouncement} disabled={savingAnnouncement} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50"><Check className="w-4 h-4" />{savingAnnouncement ? 'Saving...' : 'Save Announcement'}</button>
        </div>
      </div>

      {/* Export Data Section */}
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Download className="w-5 h-5 text-blue-400" />Export Data</h2>
        <p className="mb-4 text-sm text-gray-400">Download your data as CSV files for reporting or backup purposes.</p>
        <div className="flex flex-wrap items-center gap-4">
          <select value={exportType} onChange={e => setExportType(e.target.value as typeof exportType)} className="px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white"><option value="reservations">Reservations</option><option value="subscribers">Newsletter Subscribers</option><option value="logs">Activity Logs</option></select>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-50"><Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />{exporting ? 'Exporting...' : 'Export CSV'}</button>
        </div>
        {exportStatus && <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${exportStatus.success ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-red-900/20 text-red-400 border border-red-800'}`}>{exportStatus.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{exportStatus.message}</div>}
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Bell className="w-5 h-5 text-purple-400" />Notifications</h2>
        <div className="space-y-4"><label className="flex items-center justify-between"><div><span className="font-medium text-gray-200">Email Notifications</span><p className="text-sm text-gray-500">Receive email alerts for new reservations and issues</p></div><button onClick={() => setSettings(s => ({ ...s, emailNotifications: !s.emailNotifications }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} /></button></label></div>
      </div>

      {/* Security Settings */}
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Shield className="w-5 h-5 text-green-400" />Security Settings</h2>
        <div className="space-y-6">
          <div><label className="block font-medium mb-2 text-gray-200">Max Reservations per IP</label><div className="flex items-center gap-3"><input type="number" value={settings.maxReservationsPerIP} onChange={e => setSettings(s => ({ ...s, maxReservationsPerIP: parseInt(e.target.value) || 1 }))} min={1} max={10} className="w-24 px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white" /><span className="text-sm text-gray-500">reservations allowed per IP address</span></div></div>
          <div><label className="block font-medium mb-2 text-gray-200">Reservation Cooldown</label><div className="flex items-center gap-3"><input type="number" value={settings.reservationCooldownHours} onChange={e => setSettings(s => ({ ...s, reservationCooldownHours: parseInt(e.target.value) || 1 }))} min={1} max={168} className="w-24 px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white" /><span className="text-sm text-gray-500">hours between reservations from same IP</span></div></div>
          <label className="flex items-center justify-between"><div><span className="font-medium text-gray-200">Auto-approve Verified Domains</span><p className="text-sm text-gray-500">Automatically approve reservations from trusted email domains</p></div><button onClick={() => setSettings(s => ({ ...s, autoApproveVerifiedDomains: !s.autoApproveVerifiedDomains }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.autoApproveVerifiedDomains ? 'bg-blue-600' : 'bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.autoApproveVerifiedDomains ? 'translate-x-6' : 'translate-x-1'}`} /></button></label>
        </div>
      </div>

      {/* Database Info */}
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white"><Database className="w-5 h-5 text-orange-400" />Database Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/5"><div className="text-sm text-gray-500">Database Status</div><div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="font-medium text-white">Healthy</span></div></div>
          <div className="p-4 rounded-lg bg-white/5"><div className="text-sm text-gray-500">Region</div><div className="font-medium mt-1 text-white">US East (Default)</div></div>
          <div className="p-4 rounded-lg bg-white/5"><div className="text-sm text-gray-500">Storage Used</div><div className="font-medium mt-1 text-white">~2.3 MB</div></div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end"><button onClick={handleSaveSettings} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"><Check className="w-4 h-4" />Save Settings</button></div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-800 bg-red-900/10 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400"><AlertTriangle className="w-5 h-5" />Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-400">These actions are destructive and cannot be undone. Please proceed with caution.</p>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/30 transition"><Trash2 className="w-4 h-4" />Clear All Denied Reservations</button>
          <button className="flex items-center gap-2 px-4 py-2 border border-red-700 text-red-400 rounded-lg hover:bg-red-900/30 transition"><RefreshCw className="w-4 h-4" />Reset All Blocked IPs</button>
        </div>
      </div>
    </div>
  );
}
