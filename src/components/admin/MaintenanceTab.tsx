import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettings { enabled: boolean; password: string; message: string; }

export default function MaintenanceTab() {
  const [settings, setSettings] = useState<MaintenanceSettings>({ enabled: false, password: '', message: 'We are currently performing scheduled maintenance. Please check back soon.' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('admin_settings').select('value').eq('key', 'maintenance_mode').single();
    if (data?.value) {
      const val = data.value as Record<string, unknown>;
      setSettings({ enabled: (val.enabled as boolean) || false, password: '', message: (val.message as string) || 'We are currently performing scheduled maintenance. Please check back soon.' });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings.password && settings.enabled) { toast.error('Please set a password before enabling maintenance mode'); return; }
    setSaving(true);
    const { error } = await supabase.rpc('save_maintenance_settings', { p_enabled: settings.enabled, p_message: settings.message, p_password: settings.password || 'admin123' });
    if (error) { console.error('Save error:', error); toast.error('Failed to save settings'); }
    else { toast.success(settings.enabled ? 'Maintenance mode enabled!' : 'Settings saved'); setSettings(prev => ({ ...prev, password: '' })); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#12121a] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/20"><Wrench className="w-6 h-6 text-amber-400" /></div>
          <div><h2 className="text-xl font-semibold text-white">Maintenance Mode</h2><p className="text-gray-400">Enable maintenance mode to restrict access to the site</p></div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
          <div><div className="font-medium text-white">Maintenance Mode</div><div className="text-sm text-gray-400">{settings.enabled ? 'Site is currently in maintenance mode' : 'Site is accessible to all users'}</div></div>
          <button onClick={() => setSettings({ ...settings, enabled: !settings.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.enabled ? 'bg-amber-600' : 'bg-gray-600'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button>
        </div>
        <div><label className="block text-sm font-medium mb-2 text-gray-400">Maintenance Message</label><textarea value={settings.message} onChange={e => setSettings({ ...settings, message: e.target.value })} rows={3} className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Message to display during maintenance..." /></div>
        <div><label className="block text-sm font-medium mb-2 text-gray-400">Staff Bypass Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={settings.password} onChange={e => setSettings({ ...settings, password: e.target.value })} className="w-full px-4 py-3 pr-12 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter new password (leave blank to keep existing)" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div><p className="text-sm mt-1 text-gray-500">Password is securely hashed. Enter a new password only when you want to change it.</p></div>
        <div className="flex justify-end pt-4 border-t border-white/10"><button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white rounded-lg transition">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes</button></div>
      </div>
      {settings.enabled && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4"><div className="flex items-start gap-3"><Wrench className="w-5 h-5 text-amber-400 mt-0.5" /><div><div className="font-medium text-amber-200">Maintenance Mode is Active</div><p className="text-sm text-amber-400 mt-1">Regular users will see the maintenance page. Staff can bypass using the password.</p></div></div></div>
      )}
    </div>
  );
}
