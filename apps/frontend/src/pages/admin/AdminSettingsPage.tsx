import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RefreshCw } from 'lucide-react';
import { settingsApi, authApi } from '../../lib/api';
import toast from 'react-hot-toast';

const SETTING_GROUPS = [
  {
    title: 'Business Info',
    emoji: '🏪',
    keys: [
      { key: 'PICKUP_LOCATION', label: 'Pickup Location', placeholder: 'Hjortvägen, Älmhult, Sweden' },
      { key: 'PICKUP_TIME', label: 'Pickup Time', placeholder: 'Friday 17:00 - 20:00' },
      { key: 'CONTACT_EMAIL', label: 'Contact Email', placeholder: 'info@tastybites.se' },
      { key: 'CONTACT_PHONE', label: 'Contact Phone', placeholder: '+46 70 123 4567' },
    ],
  },
  {
    title: 'Payment',
    emoji: '💳',
    keys: [
      { key: 'SWISH_NUMBER', label: 'Swish Number', placeholder: '0701234567' },
      { key: 'WHATSAPP_NUMBER', label: 'WhatsApp Number', placeholder: '+46701234567' },
    ],
  },
  {
    title: 'Social Media',
    emoji: '📱',
    keys: [
      { key: 'APP_URL', label: 'App URL', placeholder: 'https://tastybites.vercel.app' },
      { key: 'INSTAGRAM_URL', label: 'Instagram URL', placeholder: 'https://instagram.com/...' },
      { key: 'FACEBOOK_URL', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
    ],
  },
  {
    title: 'Menu Visibility',
    emoji: '👁️',
    keys: [
      { key: 'SHOW_DAILY_MENU', label: 'Show Daily Menu', placeholder: 'true / false', isBoolean: true },
      { key: 'SHOW_FRIDAY_MENU', label: 'Show Friday Menu', placeholder: 'true / false', isBoolean: true },
      { key: 'ORDERS_ENABLED', label: 'Orders Enabled', placeholder: 'true / false', isBoolean: true },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.getAll();
      setSettings(res.data.data || {});
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await settingsApi.update(key, value);
      toast.success(`${key} saved!`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      toast.error('Current password is incorrect');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your Tasty Bites store</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <motion.div className="w-8 h-8 border-2 border-spice-200 border-t-spice-500 rounded-full mx-auto"
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {SETTING_GROUPS.map((group) => (
            <div key={group.title} className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <span>{group.emoji}</span> {group.title}
              </h2>
              <div className="space-y-4">
                {group.keys.map((setting) => (
                  <div key={setting.key} className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{setting.label}</label>
                      {(setting as { isBoolean?: boolean }).isBoolean ? (
                        <select
                          value={settings[setting.key] || 'true'}
                          onChange={(e) => setSettings((s) => ({ ...s, [setting.key]: e.target.value }))}
                          className="input-field"
                        >
                          <option value="true">✅ Enabled</option>
                          <option value="false">❌ Disabled</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={settings[setting.key] || ''}
                          onChange={(e) => setSettings((s) => ({ ...s, [setting.key]: e.target.value }))}
                          placeholder={setting.placeholder}
                          className="input-field"
                        />
                      )}
                    </div>
                    <button
                      onClick={() => saveSetting(setting.key, settings[setting.key] || '')}
                      disabled={saving === setting.key}
                      className="btn-primary py-3 px-4 flex-shrink-0"
                    >
                      {saving === setting.key ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Change Password */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              🔐 Change Password
            </h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="input-field"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={pwLoading}
                className="btn-primary"
              >
                {pwLoading ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
