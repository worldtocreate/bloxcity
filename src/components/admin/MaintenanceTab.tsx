import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettings {
  enabled: boolean;
  password: string;
  message: string;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // Use the secure admin_settings table
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
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings.password && settings.enabled) {
      toast.error('Please set a password before enabling maintenance mode');
      return;
    }
    
    setSaving(true);

    // Use the secure function to save settings with hashed password
    const { error } = await supabase.rpc('save_maintenance_settings', {
      p_enabled: settings.enabled,
      p_message: settings.message,
      p_password: settings.password || 'admin123' // Fallback password
    });

    if (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } else {
      toast.success(settings.enabled ? 'Maintenance mode enabled!' : 'Settings saved');
      // Clear password field after saving
      setSettings(prev => ({ ...prev, password: '' }));
    }
    setSaving(false);
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

  return (
    <div className="space-y-6">
      <div className={`rounded-lg border p-6 space-y-6 ${cardClass}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${darkMode ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${textClass}`}>Maintenance Mode</h2>
            <p className={mutedClass}>Enable maintenance mode to restrict access to the site</p>
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

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
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
            Save Changes
          </button>
        </div>
      </div>

      {/* Warning */}
      {settings.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <div className="font-medium text-amber-800">Maintenance Mode is Active</div>
              <p className="text-sm text-amber-700 mt-1">
                Regular users will see the maintenance page. Staff can bypass using the password.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
