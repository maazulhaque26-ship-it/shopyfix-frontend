import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const NAV_ITEMS = [
  { to: '/admin',              label: '📊 Dashboard',  end: true },
  { to: '/admin/products',     label: '📦 Products'           },
  { to: '/admin/categories',   label: '📁 Categories'         },
  { to: '/admin/orders',       label: '🛒 Orders'             },
  { to: '/admin/users',        label: '👥 Users'              },
  { to: '/admin/coupons',      label: '🎟️ Coupons'           },
  { to: '/admin/reviews',      label: '⭐ Reviews'            },
  { to: '/admin/subscribers',  label: '📧 Subscribers'        },
  { to: '/admin/settings',     label: '⚙️ Settings'          },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { user }   = useSelector(s => s.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 font-sans tracking-wide">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`bg-slate-900/60 backdrop-blur-xl border-r border-white/10 shadow-2xl flex flex-col transition-all duration-300 relative ${collapsed ? 'w-16' : 'w-64'}`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
          {!collapsed && (
            <span className="text-white font-bold text-2xl font-serif tracking-tight">
              Shopifix
            </span>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-white text-xl ml-auto">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Go to Store button */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-gray-700">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-amazon-orange text-white text-sm py-2 rounded-lg font-semibold hover:bg-orange-600 flex items-center justify-center gap-2"
            >
              🏠 Go to Store
            </button>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-amazon-orange text-white font-semibold'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.label.split(' ')[0]}</span>
              {!collapsed && <span>{item.label.split(' ').slice(1).join(' ')}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-700 px-4 py-4">
          {!collapsed && (
            <p className="text-gray-400 text-xs mb-2 truncate">{user?.email}</p>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/40 px-6 py-3 flex items-center justify-between z-10 sticky top-0">
          <h1 className="font-bold text-gray-700 text-lg">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-amazon-orange flex items-center gap-1"
            >
              🏠 Home
            </button>
            <button
              onClick={() => window.open('/', '_blank')}
              className="text-sm text-gray-600 hover:text-amazon-orange flex items-center gap-1"
            >
              🔗 View Store
            </button>
            <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 text-gray-800">
          <Outlet />
        </main>
      </div>
    </div>
  );
}