import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import API from '../../services/api';

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);
  const [total,       setTotal]       = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [deleting,    setDeleting]    = useState(null);

  const fetchSubscribers = useCallback(async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await API.get('/admin/subscribers', {
        params: { page: p, limit: 20, search: q },
      });
      setSubscribers(res.data.subscribers || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setActiveCount(res.data.activeCount || 0);
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(1, ''); }, [fetchSubscribers]);

  // Search with debounce
  useEffect(() => {
    const t = setTimeout(() => { fetchSubscribers(1, search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search, fetchSubscribers]);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Remove ${email} from subscribers?`)) return;
    setDeleting(id);
    try {
      await API.delete(`/admin/subscribers/${id}`);
      toast.success('Subscriber removed');
      fetchSubscribers(page, search);
    } catch {
      toast.error('Failed to remove subscriber');
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = () => {
    // Opens CSV download directly from backend
    const token = localStorage.getItem('token');
    const base  = import.meta.env.VITE_API_URL || '';
    window.open(`${base}/admin/subscribers/export?token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📧 Newsletter Subscribers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active subscriber{activeCount !== 1 ? 's' : ''} · {total} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchSubscribers(page, search)}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-amazon-orange hover:text-amazon-orange transition-colors bg-white"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={total === 0}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            ⬇️ Export CSV
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Subscribers', value: total,       icon: '📬', color: 'border-l-blue-500' },
          { label: 'Active',            value: activeCount, icon: '✅', color: 'border-l-green-500' },
          { label: 'Unsubscribed',      value: total - activeCount, icon: '🚫', color: 'border-l-red-400' },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-5 border-l-4 ${s.color} transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.3)] animate-float group`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amazon-orange/20 transition-colors duration-500"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1 tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold tracking-tight text-gray-900">{s.value}</p>
              </div>
              <span className="text-2xl p-2 bg-white/50 rounded-xl shadow-sm border border-white/60">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-4 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.3)]">
        <input
          type="text"
          placeholder="🔍 Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange focus:bg-white shadow-inner transition-colors duration-300 placeholder:text-gray-400"
        />
      </div>

      {/* Table */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-1 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.2)]">
        {loading ? (
          <div className="space-y-0">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 animate-pulse border-b border-white" />
            ))}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 font-medium">
              {search ? `No subscribers matching "${search}"` : 'No subscribers yet'}
            </p>
            {!search && (
              <p className="text-sm text-gray-400 mt-1">
                Emails will appear here when users subscribe from the website footer
              </p>
            )}
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Email Address</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Subscribed On</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map((sub, i) => (
                  <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amazon-orange text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {sub.email[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{sub.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {sub.createdAt
                        ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sub.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sub.isActive ? '✅ Active' : '🚫 Unsubscribed'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(sub._id, sub.email)}
                        disabled={deleting === sub._id}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                      >
                        {deleting === sub._id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setPage(p => p - 1); fetchSubscribers(page - 1, search); }}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs border rounded disabled:opacity-40 bg-white hover:bg-gray-50"
                  >← Prev</button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => { setPage(p); fetchSubscribers(p, search); }}
                      className={`w-8 h-8 text-xs rounded ${page === p ? 'bg-amazon-orange text-white' : 'border bg-white hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => { setPage(p => p + 1); fetchSubscribers(page + 1, search); }}
                    disabled={page === pages}
                    className="px-3 py-1.5 text-xs border rounded disabled:opacity-40 bg-white hover:bg-gray-50"
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="relative overflow-hidden bg-blue-50/70 backdrop-blur-md border border-blue-200/50 rounded-2xl p-5 text-sm text-blue-900 shadow-lg hover:-translate-y-1 transition-transform duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <p className="font-semibold mb-2 tracking-wide">💡 How it works:</p>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• When a user enters their email in the website footer and clicks <strong>Subscribe</strong>, it gets saved here</li>
            <li>• Click <strong>⬇️ Export CSV</strong> to download all emails for use in Mailchimp, Gmail, etc.</li>
            <li>• Duplicate emails are automatically rejected</li>
            <li>• Click <strong>Remove</strong> to delete a subscriber permanently</li>
          </ul>
        </div>
      </div>
    </div>
  );
}