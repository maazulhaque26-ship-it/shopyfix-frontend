import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

// ============ SHARED TABLE WRAPPER ============
function AdminTable({ title, addLabel, onAdd, columns, rows, loading }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {addLabel && <button onClick={onAdd} className="btn-orange text-sm px-4 py-2">{addLabel}</button>}
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{columns.map(c => <th key={c} className="text-left py-3 px-4 text-gray-600 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(5).fill(0).map((_, i) => (
                <tr key={i}>{columns.map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>
              )) : rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN CATEGORIES ============
export function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/categories').then(r => { setCategories(r.data.categories || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: '', description: '', icon: '', isActive: true }); setShowForm(true); };
  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '', isActive: cat.isActive }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/categories/${editing._id}`, form);
        toast.success('Category updated!');
      } else {
        await API.post('/categories', form);
        toast.success('Category created!');
      }
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try { await API.delete(`/categories/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <button onClick={openNew} className="btn-orange text-sm px-4 py-2">+ Add Category</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Icon (emoji)</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="input-field" placeholder="🧊" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-amazon-orange" />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-orange text-sm disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th><th className="text-left py-3 px-4 text-gray-600 font-medium">Slug</th><th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th><th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan={4} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>) :
              categories.map(cat => (
                <tr key={cat._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{cat.icon} {cat.name}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs font-mono">{cat.slug}</td>
                  <td className="py-3 px-4"><span className={`badge text-xs px-2 py-0.5 ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button onClick={() => openEdit(cat)} className="text-amazon-blue hover:text-amazon-orange text-xs font-medium">Edit</button>
                    <button onClick={() => handleDelete(cat._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ADMIN ORDERS ============
const STATUS_COLORS = {
  // Capitalized — matches DB enum values
  Pending:    'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped:    'bg-indigo-100 text-indigo-800',
  Delivered:  'bg-green-100 text-green-800',
  Cancelled:  'bg-red-100 text-red-800',
  // lowercase fallbacks for safety
  pending:    'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped:    'bg-indigo-100 text-indigo-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    API.get('/admin/orders', { params: { status, page, limit: 15 } })
      .then(r => { setOrders(r.data.orders || []); setTotalPages(r.data.pages || 1); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, page]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1.5 text-xs rounded-full border transition-colors capitalize ${status === s ? 'bg-amazon-orange text-white border-amazon-orange' : 'border-gray-300 text-gray-600 hover:border-amazon-orange hover:text-amazon-orange'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(8).fill(0).map((_, i) => <tr key={i}>{Array(8).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>) :
                orders.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-gray-500">No orders found</td></tr> :
                orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-amazon-blue">#{order.orderNumber}</td>
                    <td className="py-3 px-4 text-gray-700">{order.user?.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{order.items?.length}</td>
                    <td className="py-3 px-4 font-medium">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-500 capitalize">{order.paymentMethod}</td>
                    <td className="py-3 px-4"><span className={`badge text-xs px-2 py-0.5 capitalize ${STATUS_COLORS[order.status] || ''}`}>{order.status}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4"><Link to={`/admin/orders/${order._id}`} className="text-amazon-blue hover:text-amazon-orange text-xs font-medium">View</Link></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">‹</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ADMIN ORDER DETAIL ============
export function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusForm, setStatusForm] = useState({ orderStatus: '', note: '', trackingId: '' });

  useEffect(() => {
    API.get(`/orders/${id}`).then(r => {
      setOrder(r.data.order);
      // FIX: read order.status (correct DB field), default to 'Pending'
      setStatusForm(f => ({ ...f, orderStatus: r.data.order.status || 'Pending' }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // FIX: send 'status' field (what backend reads) + 'orderStatus' as fallback
      const payload = {
        status:      statusForm.orderStatus,   // backend reads this
        orderStatus: statusForm.orderStatus,   // belt-and-suspenders
        note:        statusForm.note,
        trackingId:  statusForm.trackingId,
      };
      const res = await API.put(`/admin/orders/${id}/status`, payload);
      setOrder(res.data.order);
      toast.success('Order status updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setUpdating(false); }
  };

  if (loading) return <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-amazon-orange border-t-transparent rounded-full mx-auto" /></div>;
  if (!order) return <div className="text-center py-10 text-gray-500">Order not found</div>;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
        <Link to="/admin/orders" className="btn-outline text-sm">← All Orders</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-2 text-sm">
          <h2 className="font-semibold text-gray-900 border-b pb-2">Order Info</h2>
          <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{order.user?.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{order.user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{order.paymentMethod} — <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span></span></div>
          <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold">₹{order.totalPrice?.toLocaleString('en-IN')}</span></div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 text-sm">
          <h2 className="font-semibold text-gray-900 border-b pb-2 mb-2">Shipping Address</h2>
          <div className="text-gray-600 space-y-0.5">
            <div className="font-medium text-gray-900">{order.shippingAddress?.fullName}</div>
            <div>{order.shippingAddress?.phone}</div>
            <div>{order.shippingAddress?.addressLine1}</div>
            <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <img src={item.image} alt={item.name} className="w-12 h-12 object-contain border rounded bg-gray-50 p-1 flex-shrink-0" onError={e => { e.target.src = 'https://placehold.co/48x48/f3f4f6/9ca3af?text=Img'; }} />
              <div className="flex-1 text-sm">
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</div>
              </div>
              <div className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Update Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="font-semibold text-gray-900 border-b pb-2 mb-3">Update Status</h2>
        <form onSubmit={handleUpdateStatus} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Order Status</label>
              <select value={statusForm.orderStatus} onChange={e => setStatusForm(f => ({ ...f, orderStatus: e.target.value }))} className="input-field">
                {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Tracking ID</label>
              <input value={statusForm.trackingId} onChange={e => setStatusForm(f => ({ ...f, trackingId: e.target.value }))} className="input-field" placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Note</label>
            <input value={statusForm.note} onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))} className="input-field" placeholder="Status update note..." />
          </div>
          <button type="submit" disabled={updating} className="btn-orange text-sm disabled:opacity-50">
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </form>

        {/* Status history */}
        {order.statusHistory?.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Status History</h3>
            <div className="space-y-2">
              {order.statusHistory.slice().reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`badge px-2 py-0.5 capitalize mt-0.5 ${STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-600'}`}>{h.status}</span>
                  <span className="text-gray-500">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                  {h.note && <span className="text-gray-700">— {h.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ ADMIN USERS ============
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    API.get('/admin/users', { params: { search, page, limit: 15 } })
      .then(r => { setUsers(r.data.users || []); setTotalPages(r.data.pages || 1); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, page]);

  const handleToggle = async (id) => {
    try {
      const res = await API.put(`/admin/users/${id}/toggle-status`);
      setUsers(us => us.map(u => u._id === id ? res.data.user : u));
      toast.success('User status updated');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Users</h1>
      <div className="bg-white rounded-lg shadow-sm p-3">
        <input placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field" />
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Name', 'Email', 'Phone', 'Joined', 'Status', 'Action'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-600 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(8).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>) :
                users.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-gray-500">No users found</td></tr> :
                users.map(user => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-gray-500">{user.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4"><span className={`badge text-xs px-2 py-0.5 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3 px-4"><button onClick={() => handleToggle(user._id)} className={`text-xs font-medium transition-colors ${user.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>{user.isActive ? 'Deactivate' : 'Activate'}</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN COUPONS ============
export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', expiresAt: '', usageLimit: '', isActive: true });

  const load = () => { setLoading(true); API.get('/admin/coupons').then(r => { setCoupons(r.data.coupons || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiresAt) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await API.post('/admin/coupons', form);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', expiresAt: '', usageLimit: '', isActive: true });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await API.delete(`/admin/coupons/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleStatus = async (id, current) => {
    try { await API.put(`/admin/coupons/${id}`, { isActive: !current }); load(); } catch { toast.error('Failed to update'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Coupons</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-orange text-sm px-4 py-2">+ Add Coupon</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-4">New Coupon</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'code', label: 'Coupon Code *', type: 'text', placeholder: 'WELCOME10' },
              { key: 'description', label: 'Description', type: 'text', placeholder: '10% off first order' },
              { key: 'discountValue', label: 'Discount Value *', type: 'number', placeholder: '10' },
              { key: 'minOrderAmount', label: 'Min Order Amount', type: 'number', placeholder: '500' },
              { key: 'maxDiscountAmount', label: 'Max Discount', type: 'number', placeholder: '500' },
              { key: 'usageLimit', label: 'Usage Limit', type: 'number', placeholder: '100' },
              { key: 'expiresAt', label: 'Expiry Date *', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm font-medium text-gray-700 block mb-1">{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))} className="input-field" placeholder={f.placeholder} />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm(fv => ({ ...fv, discountType: e.target.value }))} className="input-field">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(fv => ({ ...fv, isActive: e.target.checked }))} className="accent-amazon-orange" />
              <label className="text-sm text-gray-700">Active</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-orange text-sm">{saving ? 'Creating...' : 'Create Coupon'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>{['Code', 'Type', 'Value', 'Min Order', 'Expires', 'Used', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-600 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(4).fill(0).map((_, i) => <tr key={i}><td colSpan={8} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td></tr>) :
                coupons.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono font-bold text-amazon-orange">{c.code}</td>
                    <td className="py-3 px-4 capitalize text-gray-600">{c.discountType}</td>
                    <td className="py-3 px-4 font-medium">{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                    <td className="py-3 px-4 text-gray-500">{c.minOrderAmount ? `₹${c.minOrderAmount}` : '—'}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(c.expiresAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-500">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                    <td className="py-3 px-4"><span className={`badge text-xs px-2 py-0.5 ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="py-3 px-4 space-x-2">
                      <button onClick={() => toggleStatus(c._id, c.isActive)} className="text-xs text-amazon-blue hover:text-amazon-orange">{c.isActive ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => handleDelete(c._id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN REVIEWS ============
export function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    API.get('/admin/reviews', { params: { page, limit: 15 } })
      .then(r => { setReviews(r.data.reviews || []); setTotalPages(r.data.pages || 1); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try { await API.delete(`/reviews/${id}`); toast.success('Review deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>{['User', 'Product', 'Rating', 'Comment', 'Date', 'Action'].map(h => <th key={h} className="text-left py-3 px-4 text-gray-600 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array(8).fill(0).map((_, i) => <tr key={i}>{Array(6).fill(0).map((_, j) => <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>) :
                reviews.length === 0 ? <tr><td colSpan={6} className="py-10 text-center text-gray-500">No reviews</td></tr> :
                reviews.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900 font-medium">{r.user?.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-[150px] truncate">{r.product?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {'⭐'.repeat(r.rating)}
                        <span className="text-xs text-gray-500">({r.rating})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate">{r.comment}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4"><button onClick={() => handleDelete(r._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}