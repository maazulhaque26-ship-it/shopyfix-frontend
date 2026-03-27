import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { updateProfile } from '../redux/slices/authSlice';
import API from '../services/api';
import BackButton from '../components/BackButton.jsx';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await dispatch(updateProfile(form));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) toast.success('Profile updated!');
    else toast.error('Failed to update profile');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('New passwords do not match'); return; }
    setPwSaving(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-4 pb-4 border-b mb-4">
          <div className="w-16 h-16 rounded-full bg-amazon-orange flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs bg-orange-100 text-amazon-orange px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="+91 XXXXXXXXXX" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email (cannot change)</label>
            <input value={user?.email} disabled className="input-field bg-gray-50 cursor-not-allowed text-gray-500" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Current Password</label>
            <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} className="input-field" required minLength={6} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Confirm New Password</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} className="input-field" required />
          </div>
          <button type="submit" disabled={pwSaving} className="btn-outline text-sm disabled:opacity-50">
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Addresses */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Saved Addresses</h2>
        {!user?.addresses?.length ? (
          <p className="text-sm text-gray-500">No addresses saved. Add one during checkout.</p>
        ) : (
          <div className="space-y-3">
            {user.addresses.map(addr => (
              <div key={addr._id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{addr.fullName}</span>
                  {addr.isDefault && <span className="text-xs bg-amazon-orange text-white px-1.5 py-0.5 rounded">Default</span>}
                </div>
                <div className="text-gray-600">{addr.phone}</div>
                <div className="text-gray-600">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}</div>
                <div className="text-gray-600">{addr.city}, {addr.state} — {addr.pincode}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link to="/orders" className="btn-outline flex-1 text-center py-2.5 text-sm">📦 My Orders</Link>
        <Link to="/wishlist" className="btn-outline flex-1 text-center py-2.5 text-sm">🤍 Wishlist</Link>
      </div>
    </div>
  );
}