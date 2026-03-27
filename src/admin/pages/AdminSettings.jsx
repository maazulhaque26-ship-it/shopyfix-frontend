import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../../services/api';

const TABS = [
  { id: 'store',    label: '🏪 Store Info' },
  { id: 'contact',  label: '📞 Contact' },
  { id: 'social',   label: '📱 Social Media' },
  { id: 'ecom',     label: '🛒 E-Commerce' },
  { id: 'seo',      label: '🔍 SEO' },
];

// ✅ FIX: Field component ko BAHAR nikal diya taaki re-render pe focus na hate
const Field = ({ label, name, type = 'text', placeholder = '', value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange"
    />
  </div>
);

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('store');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName:          'Shopifix',
    storeTagline:       'Your one-stop destination for home & kitchen appliances',
    storeAddress:       '',
    copyrightText:      '© 2024 Shopifix. All rights reserved.',
    maintenanceMode:    false,
    phone:              '1800-123-4567',
    email:              'support@shopifix.com',
    fullAddress:        '',
    facebook:           '',
    twitter:            '',
    instagram:          '',
    youtube:            '',
    currency:           '₹',
    freeShippingAbove:  500,
    taxRate:            18,
    metaTitle:          'Shopifix - Best Appliances Online',
    metaDescription:    'Shop best home appliances at lowest prices',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/settings');
        if (res.data.settings) setForm(f => ({ ...f, ...res.data.settings }));
      } catch { /* silent */ }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await API.put('/admin/settings', form);
      toast.success('✅ Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Store Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-amazon-orange text-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-5">

        {/* ── Store Info ─────────────────────────────────────────────────── */}
        {activeTab === 'store' && (
          <>
            <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">🏪 Store Information</h2>
            <Field label="Store Name"       name="storeName"     placeholder="Shopifix" value={form.storeName} onChange={handleChange} />
            <Field label="Store Tagline"    name="storeTagline"  placeholder="Your one-stop destination..." value={form.storeTagline} onChange={handleChange} />
            <Field label="Store Address"    name="storeAddress"  placeholder="123 Main Street, Delhi" value={form.storeAddress} onChange={handleChange} />
            <Field label="Copyright Text"   name="copyrightText" placeholder="© 2024 Shopifix. All rights reserved." value={form.copyrightText} onChange={handleChange} />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="maintenanceMode"
                checked={!!form.maintenanceMode}
                onChange={handleChange}
                id="maintenanceMode"
                className="w-4 h-4 accent-amazon-orange"
              />
              <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                Maintenance Mode <span className="text-gray-400 font-normal">(hides store from public)</span>
              </label>
            </div>
          </>
        )}

        {/* ── Contact ───────────────────────────────────────────────────── */}
        {activeTab === 'contact' && (
          <>
            <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">📞 Contact Details</h2>
            <Field label="Phone Number"  name="phone"       placeholder="1800-123-4567" value={form.phone} onChange={handleChange} />
            <Field label="Support Email" name="email"       type="email" placeholder="support@yourdomain.com" value={form.email} onChange={handleChange} />
            <Field label="Full Address"  name="fullAddress" placeholder="123 Main St, New Delhi - 110001" value={form.fullAddress} onChange={handleChange} />
          </>
        )}

        {/* ── Social Media ──────────────────────────────────────────────── */}
        {activeTab === 'social' && (
          <>
            <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">📱 Social Media Links</h2>
            <Field label="Facebook URL"  name="facebook"  placeholder="https://facebook.com/yourpage" value={form.facebook} onChange={handleChange} />
            <Field label="Twitter URL"   name="twitter"   placeholder="https://twitter.com/yourhandle" value={form.twitter} onChange={handleChange} />
            <Field label="Instagram URL" name="instagram" placeholder="https://instagram.com/yourpage" value={form.instagram} onChange={handleChange} />
            <Field label="YouTube URL"   name="youtube"   placeholder="https://youtube.com/yourchannel" value={form.youtube} onChange={handleChange} />
          </>
        )}

        {/* ── E-Commerce ────────────────────────────────────────────────── */}
        {activeTab === 'ecom' && (
          <>
            <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">🛒 E-Commerce Settings</h2>
            <Field label="Currency Symbol"         name="currency"          placeholder="₹" value={form.currency} onChange={handleChange} />
            <Field label="Free Shipping Above (₹)" name="freeShippingAbove" type="number" placeholder="500" value={form.freeShippingAbove} onChange={handleChange} />
            <Field label="Tax Rate (%)"             name="taxRate"           type="number" placeholder="18" value={form.taxRate} onChange={handleChange} />
          </>
        )}

        {/* ── SEO ───────────────────────────────────────────────────────── */}
        {activeTab === 'seo' && (
          <>
            <h2 className="font-semibold text-gray-700 text-lg border-b pb-2">🔍 SEO Settings</h2>
            <Field label="Meta Title"       name="metaTitle"       placeholder="Shopifix - Best Appliances Online" value={form.metaTitle} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                name="metaDescription"
                value={form.metaDescription ?? ''}
                onChange={handleChange}
                rows={3}
                placeholder="Shop best home appliances at lowest prices in India"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange"
              />
            </div>
          </>
        )}

        {/* Save button */}
        <div className="pt-2 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-amazon-orange text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '⏳ Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}