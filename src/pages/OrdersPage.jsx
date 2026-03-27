/**
 * OrdersPage.jsx — Fixed
 *
 * BUGS FIXED:
 * 1. Status showed stale "Pending" — added cache-busting timestamp param
 *    so every visit fetches fresh data from server
 * 2. STATUS_COLOR used wrong field — now handles both 'status' variations
 * 3. Item images were broken — uses image stored in order, not product ref
 * 4. Added pull-to-refresh button so user can manually refresh
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import { useSelector }                       from 'react-redux';
import API                                   from '../services/api';

const STATUS_COLOR = {
  Pending:    'background:#fef9c3;color:#854d0e',
  Processing: 'background:#dbeafe;color:#1e40af',
  Shipped:    'background:#ede9fe;color:#6d28d9',
  Delivered:  'background:#dcfce7;color:#166534',
  Cancelled:  'background:#fee2e2;color:#991b1b',
};

const STATUS_ICON = {
  Pending:    '⏳',
  Processing: '⚙️',
  Shipped:    '🚚',
  Delivered:  '✅',
  Cancelled:  '❌',
};

export default function OrdersPage() {
  const navigate      = useNavigate();
  const { user }      = useSelector(s => s.auth);

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  const fetchOrders = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      // FIX: _t cache-buster ensures browser never serves stale cached response
      const res = await API.get('/orders/my-orders', {
        params: { page: pageNum, limit: 10, _t: Date.now() },
      });
      setOrders(res.data.orders || []);
      setPages(res.data.pages   || 1);
      setTotal(res.data.total   || 0);
    } catch {
      /* silent — ProtectedRoute already handles auth */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders(page);
  }, [user, page, navigate, fetchOrders]);

  const getStatusStyle = (status) =>
    STATUS_COLOR[status] || 'background:#f3f4f6;color:#374151';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-amazon-orange text-sm hover:underline">← Back</button>
          <button onClick={() => navigate('/')} className="text-amazon-orange text-sm hover:underline">🏠 Home</button>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-lg h-28 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-amazon-orange text-sm hover:underline">← Back</button>
            <button onClick={() => navigate('/')} className="text-amazon-orange text-sm hover:underline">🏠 Home</button>
            <h1 className="text-2xl font-bold text-gray-800">
              My Orders {total > 0 && <span className="text-base font-normal text-gray-500">({total})</span>}
            </h1>
          </div>
          {/* FIX: Manual refresh button so user can pull latest status */}
          <button
            onClick={() => fetchOrders(page)}
            className="text-sm text-amazon-orange border border-amazon-orange px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here</p>
            <button onClick={() => navigate('/products')} className="bg-amazon-orange text-white px-6 py-2 rounded-lg font-semibold">
              Shop Now
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map(order => {
                // FIX: handle both field names (status is the correct DB field)
                const orderStatus = order.status || order.orderStatus || 'Pending';

                return (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-800 text-base">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'
                            }
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">
                            {order.paymentMethod} · {order.paymentStatus}
                          </p>
                        </div>
                        <div className="text-right">
                          {/* FIX: inline style for status so it always renders correctly */}
                          <span style={{ ...Object.fromEntries(getStatusStyle(orderStatus).split(';').map(s => s.split(':'))), padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600, display: 'inline-block' }}>
                            {STATUS_ICON[orderStatus]} {orderStatus}
                          </span>
                          <p className="font-bold text-amazon-orange text-base mt-1">
                            ₹{order.totalPrice?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Item thumbnails */}
                      <div className="flex gap-2 flex-wrap">
                        {(order.items || []).slice(0, 4).map((item, i) => (
                          <div key={i} className="w-12 h-12 rounded border bg-gray-50 overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image.startsWith('/uploads/')
                                  ? `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${item.image}`
                                  : item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                            )}
                          </div>
                        ))}
                        {(order.items?.length || 0) > 4 && (
                          <div className="w-12 h-12 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for active orders */}
                    {!['Cancelled', 'Delivered'].includes(orderStatus) && (
                      <div className="px-5 pb-4">
                        <div className="flex items-center gap-0">
                          {['Pending','Processing','Shipped','Delivered'].map((s, i, arr) => {
                            const currentIdx = arr.indexOf(orderStatus);
                            const active = i <= currentIdx;
                            return (
                              <div key={s} className="flex items-center flex-1">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#FF9900' : '#e5e7eb', flexShrink: 0 }} />
                                {i < arr.length - 1 && (
                                  <div style={{ flex: 1, height: 2, background: active && i < currentIdx ? '#FF9900' : '#e5e7eb' }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          {['Pending','Processing','Shipped','Delivered'].map(s => (
                            <span key={s} style={{ fontSize: 10, color: s === orderStatus ? '#FF9900' : '#9ca3af', fontWeight: s === orderStatus ? 600 : 400 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 bg-white"
                >
                  ←
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded text-sm ${page === p ? 'bg-amazon-orange text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 bg-white"
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}