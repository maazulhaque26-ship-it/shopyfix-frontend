import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function StatCard({ icon, label, value, sub, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-50/50 border-l-4 border-amazon-orange',
    blue: 'bg-blue-50/50 border-l-4 border-blue-500',
    green: 'bg-green-50/50 border-l-4 border-green-500',
    purple: 'bg-purple-50/50 border-l-4 border-purple-500',
  };
  return (
    <div 
      className={`relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-5 ${colors[color]} transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.3)] animate-float group`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amazon-orange/20 transition-colors duration-500"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1 tracking-wide">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="text-3xl p-3 bg-white/50 rounded-xl shadow-sm border border-white/60">{icon}</div>
      </div>
    </div>
  );
}

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) return <div className="text-center text-gray-400 py-8">No data available</div>;
  const max = Math.max(...data.map(d => d.revenue));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="flex items-end gap-2 h-40 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-xs text-gray-500 font-medium">₹{d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}</div>
          <div
            className="w-full bg-amazon-orange rounded-t hover:bg-amazon-orange-hover transition-colors cursor-default"
            style={{ height: `${Math.max(4, (d.revenue / max) * 120)}px` }}
            title={`Revenue: ₹${d.revenue?.toLocaleString('en-IN')}`}
          />
          <div className="text-xs text-gray-400">{months[d._id?.month - 1] || '-'}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(r => { setStats(r.data.stats); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="bg-gray-200 h-28 rounded-lg animate-pulse" />)}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue" value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`} color="orange" />
        <StatCard icon="📦" label="Total Orders" value={stats?.totalOrders?.toLocaleString() || 0} color="blue" />
        <StatCard icon="🛍️" label="Active Products" value={stats?.totalProducts?.toLocaleString() || 0} color="green" />
        <StatCard icon="👥" label="Customers" value={stats?.totalUsers?.toLocaleString() || 0} color="purple" />
      </div>

      {/* Sales Chart */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.3)]">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
        <SimpleBarChart data={stats?.monthlySales || []} />
      </div>

      {/* Recent Orders */}
      <div className="relative overflow-hidden bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(255,165,0,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm text-amazon-blue hover:text-amazon-orange transition-colors">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Order #</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Customer</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentOrders?.map(order => (
                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <Link to={`/admin/orders/${order._id}`} className="text-amazon-blue hover:underline font-medium">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">{order.user?.name || 'N/A'}</td>
                  <td className="py-2.5 px-3 font-medium">₹{order.totalPrice?.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge px-2 py-0.5 text-xs capitalize ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/products/new', label: 'Add Product', icon: '➕' },
          { to: '/admin/categories', label: 'Categories', icon: '📁' },
          { to: '/admin/coupons', label: 'Coupons', icon: '🎟️' },
          { to: '/admin/reviews', label: 'Reviews', icon: '⭐' },
        ].map(link => (
          <Link key={link.to} to={link.to} className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 p-4 flex items-center gap-3 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(255,165,0,0.3)] hover:border-amazon-orange/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amazon-orange/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amazon-orange/10 transition-colors duration-500"></div>
            <span className="text-2xl p-2 bg-white/50 rounded-lg shadow-sm border border-white/60 relative z-10">{link.icon}</span>
            <span className="text-sm font-semibold text-gray-700 tracking-wide relative z-10">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}