import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Save, Loader2, Eye, EyeOff, ShoppingBag, Users, ArrowRightLeft, Gamepad2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettings {
  enabled: boolean;
  password: string;
  message: string;
}

interface PageMaintenanceSettings {
  trading: boolean;
  character: boolean;
  market: boolean;
  forum: boolean;
  games: boolean;
}

interface MaintenanceTabProps {
  darkMode: boolean;
}

export default function MaintenanceTab({ darkMode }: MaintenanceTabProps) {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    password: '',
    message: 'We are currently performing scheduled maintenance. Please check back soon.'
  });
  const [pageSettings, setPageSettings] = useState<PageMaintenanceSettings>({
    trading: false,
    character: false,
    market: false,
    forum: false,
    games: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // Fetch global maintenance settings
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    if (data?.value) {
      const val = data.value as Record<string, unknown>;
      setSettings({
        enabled: (val.enabled as boolean) || false,
        password: '', // Never load password - it's hashed
        message: (val.message as string) || 'We are currently performing scheduled maintenance. Please check back soon.'
      });
    }

    // Fetch page-specific maintenance settings
    const { data: pageData } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'page_maintenance')
      .single();
    
    if (pageData?.value) {
      const val = pageData.value as Record<string, boolean>;
      setPageSettings({
        trading: val.trading || false,
        character: val.character || false,
        market: val.market || false,
        forum: val.forum || false,
        games: val.games || false
      });
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    // Only require password for global maintenance mode, not page-specific
    if (!settings.password && settings.enabled) {
      toast.error('Please set a password before enabling global maintenance mode');
      return;
    }
    
    setSaving(true);

    // Save global maintenance settings (only if password provided or mode enabled)
    if (settings.enabled || settings.password) {
      const { error } = await supabase.rpc('save_maintenance_settings', {
        p_enabled: settings.enabled,
        p_message: settings.message,
        p_password: settings.password || 'admin123'
      });

      if (error) {
        console.error('Save error:', error);
        toast.error('Failed to save global maintenance settings');
        setSaving(false);
        return;
      }
    }

    // Save page-specific maintenance settings using upsert
    const { error: pageError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'page_maintenance',
        value: pageSettings as unknown as { [key: string]: boolean },
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (pageError) {
      console.error('Page settings save error:', pageError);
      toast.error('Failed to save page settings');
    } else {
      toast.success('Settings saved successfully!');
      setSettings(prev => ({ ...prev, password: '' }));
    }
    setSaving(false);
  };

  const togglePageMaintenance = (page: keyof PageMaintenanceSettings) => {
    setPageSettings(prev => ({ ...prev, [page]: !prev[page] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  const pageOptions: { key: keyof PageMaintenanceSettings; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'trading', label: 'Trading', icon: <ArrowRightLeft className="w-5 h-5" />, description: 'Disable the trading page' },
    { key: 'character', label: 'Character', icon: <Users className="w-5 h-5" />, description: 'Disable character customization' },
    { key: 'market', label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" />, description: 'Disable the marketplace' },
    { key: 'forum', label: 'Forums', icon: <MessageSquare className="w-5 h-5" />, description: 'Disable forum discussions' },
    { key: 'games', label: 'Games', icon: <Gamepad2 className="w-5 h-5" />, description: 'Disable the games section' },
  ];

  return (
    <div className="space-y-6">
      {/* Global Maintenance Mode */}
      <div className={`rounded-lg border p-6 space-y-6 ${cardClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${textClass}`}>Global Maintenance Mode</h2>
            <p className={mutedClass}>Enable maintenance mode to restrict access to the entire site</p>
          </div>
        </div>

        {/* Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div>
            <div className={`font-medium ${textClass}`}>Maintenance Mode</div>
            <div className={`text-sm ${mutedClass}`}>
              {settings.enabled ? 'Site is currently in maintenance mode' : 'Site is accessible to all users'}
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.enabled ? 'bg-amber-600' : darkMode ? 'bg-gray-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Message */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>
            Maintenance Message
          </label>
          <textarea
            value={settings.message}
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
            rows={3}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            placeholder="Message to display during maintenance..."
          />
        </div>

        {/* Password */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>
            Staff Bypass Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              placeholder="Enter new password (leave blank to keep existing)"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className={`text-sm mt-1 ${mutedClass}`}>
            Password is securely hashed. Enter a new password only when you want to change it.
          </p>
        </div>
      </div>

      {/* Page-Specific Maintenance */}
      <div className={`rounded-lg border p-6 space-y-6 ${cardClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Wrench className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${textClass}`}>Page Maintenance</h2>
            <p className={mutedClass}>Put specific pages in maintenance mode without affecting the entire site</p>
          </div>
        </div>

        <div className="grid gap-3">
          {pageOptions.map(({ key, label, icon, description }) => (
            <div
              key={key}
              className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  pageSettings[key] 
                    ? 'bg-amber-500/20 text-amber-500' 
                    : darkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {icon}
                </div>
                <div>
                  <div className={`font-medium ${textClass}`}>{label}</div>
                  <div className={`text-sm ${mutedClass}`}>{description}</div>
                </div>
              </div>
              <button
                onClick={() => togglePageMaintenance(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  pageSettings[key] ? 'bg-amber-600' : darkMode ? 'bg-gray-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    pageSettings[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save All Changes
        </button>
      </div>

      {/* Active Warnings */}
      {(settings.enabled || Object.values(pageSettings).some(v => v)) && (
        <div className={`border rounded-lg p-4 ${darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            <Wrench className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <div className={`font-medium ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>Active Maintenance</div>
              <ul className={`text-sm mt-1 space-y-1 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                {settings.enabled && <li>• Global maintenance mode is enabled</li>}
                {pageSettings.trading && <li>• Trading page is in maintenance</li>}
                {pageSettings.character && <li>• Character page is in maintenance</li>}
                {pageSettings.market && <li>• Marketplace is in maintenance</li>}
                {pageSettings.forum && <li>• Forums are in maintenance</li>}
                {pageSettings.games && <li>• Games section is in maintenance</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
