import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wrench, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceSettings {
  enabled: boolean;
  password: string;
  message: string;
}

export default function MaintenanceTab() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    password: 'admin123',
    message: 'We are currently performing scheduled maintenance. Please check back soon.'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    if (data?.value) {
      setSettings(data.value as unknown as MaintenanceSettings);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const userId = (await supabase.auth.getUser()).data.user?.id;
    const settingsValue = JSON.parse(JSON.stringify(settings));

    const { data: existing } = await supabase
      .from('site_settings')
      .select('id')
      .eq('key', 'maintenance_mode')
      .single();

    let error;
    if (existing) {
      const result = await supabase
        .from('site_settings')
        .update({
          value: settingsValue,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('key', 'maintenance_mode');
      error = result.error;
    } else {
      const result = await supabase
        .from('site_settings')
        .insert([{
          key: 'maintenance_mode',
          value: settingsValue,
          updated_by: userId
        }]);
      error = result.error;
    }

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success(settings.enabled ? 'Maintenance mode enabled!' : 'Settings saved');
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Wrench className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Maintenance Mode</h2>
            <p className="text-gray-600">Enable maintenance mode to restrict access to the site</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">Maintenance Mode</div>
            <div className="text-sm text-gray-600">
              {settings.enabled ? 'Site is currently in maintenance mode' : 'Site is accessible to all users'}
            </div>
          </div>
          <button
            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.enabled ? 'bg-amber-600' : 'bg-gray-300'
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Message
          </label>
          <textarea
            value={settings.message}
            onChange={(e) => setSettings({ ...settings, message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Message to display during maintenance..."
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Bypass Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password to bypass maintenance..."
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Staff can enter this password on the maintenance page to access the site
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
                Regular users will see the maintenance page. Staff can bypass using the password above.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
