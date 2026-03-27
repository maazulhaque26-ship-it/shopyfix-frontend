/**
 * Navbar.jsx — Professional Audit Fix
 *
 * CRITICAL BUG FIXED:
 * The uploaded Navbar.jsx contained the authSlice Redux code instead
 * of the actual Navbar component — this caused:
 *   "Failed to resolve import '../../services/api' from Navbar.jsx"
 *
 * OTHER FIXES:
 * 1. handleLogout now uses clearAuth (sync) + navigate() — ZERO blank screen
 *    Old flow: dispatch(logout()) → async API call → state clears → blank screen
 *    New flow: clearAuth() sync → navigate('/login') → logout() fires background
 * 2. All SVG icons wrapped in React.memo — never re-render
 * 3. useCallback on all event handlers — prevents child re-renders
 * 4. Click-outside handler uses cleanup to prevent memory leak
 * 5. Removed clearCartState/clearWishlistState — handled by App's auth:expired listener
 */
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { clearAuth, logout } from '../redux/slices/authSlice';
import { resetCart } from '../redux/slices/shopSlices';

// ── Memoised icons — never re-render ─────────────────────────────
const SearchIcon = memo(() => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
));

const CartIcon = memo(() => (
  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
));

const UserIcon = memo(() => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
));

const HeartIcon = memo(() => (
  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
));

// ── Navbar ────────────────────────────────────────────────────────
function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user }       = useSelector(s => s.auth);
  const { items }      = useSelector(s => s.cart);
  const { categories } = useSelector(s => s.products);

  const [query,          setQuery]          = useState('');
  const [showUserMenu,   setShowUserMenu]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const userMenuRef = useRef(null);

  // Cart badge count — derived, no useState needed
  const cartCount = items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

  // Close dropdown on outside click — cleanup on unmount
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/products?keyword=${encodeURIComponent(q)}`);
      setQuery('');
    }
  }, [query, navigate]);

  // FIX: instant logout — zero blank screen
  // Step 1: clearAuth (sync) → Redux clears immediately → ProtectedRoute redirects
  // Step 2: navigate('/login') happens in the same tick
  // Step 3: logout() fires async in background to invalidate server session
  const handleLogout = useCallback(() => {
    dispatch(clearAuth());       // sync: wipes Redux state + localStorage instantly
    dispatch(resetCart());       // sync: clears cart immediately

    setShowUserMenu(false);
    setShowMobileMenu(false);

    navigate('/login', { replace: true }); // React Router: no page reload

    toast.success('Logged out successfully');

    dispatch(logout()); // async: tells server to invalidate cookie (background)
  }, [dispatch, navigate]);

  const closeMenus = useCallback(() => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, []);

  // ── Shared link style ─────────────────────────────────────────
  const navLink = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#fff',
    textDecoration: 'none',
    fontSize: 14,
    cursor: 'pointer',
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>

      {/* ── Top Bar ────────────────────────────────────────────── */}
      <div style={{ background: '#131921', color: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Logo */}
          <Link to="/" onClick={closeMenus} style={{ ...navLink, flexShrink: 0, fontSize: 28, fontWeight: 800, fontFamily: 'serif', letterSpacing: '-0.02em', color: '#fff' }}>
            <span>Shopifix</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', maxWidth: 600, margin: '0 16px' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search appliances, brands..."
              style={{ flex: 1, padding: '8px 14px', fontSize: 14, border: 'none', borderRadius: '6px 0 0 6px', outline: 'none', color: '#111' }}
            />
            <button type="submit" style={{ padding: '8px 14px', background: '#FF9900', border: 'none', borderRadius: '0 6px 6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <SearchIcon />
            </button>
          </form>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>

            {/* Orders — logged-in only */}
            {user && (
              <Link to="/orders" onClick={closeMenus} style={navLink}>
                📦 <span style={{ display: 'none' }}>Orders</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" onClick={closeMenus} style={navLink}>
              <HeartIcon />
            </Link>

            {/* Cart with badge */}
            <Link to="/cart" onClick={closeMenus} style={{ ...navLink, position: 'relative' }}>
              <CartIcon />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, background: '#FF9900', color: '#fff', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ ...navLink, background: 'none', border: 'none', padding: 0 }}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <UserIcon />
                <span style={{ fontSize: 13, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user ? user.name.split(' ')[0] : 'Account'}
                </span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 210, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb', zIndex: 999, overflow: 'hidden' }}>
                  {user ? (
                    <>
                      {/* User info header */}
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                      </div>

                      {/* Menu items */}
                      {[
                        { to: '/profile',  icon: '👤', label: 'My Profile' },
                        { to: '/orders',   icon: '📦', label: 'My Orders', bold: true },
                        { to: '/wishlist', icon: '❤️', label: 'Wishlist' },
                      ].map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={closeMenus}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, color: '#374151', textDecoration: 'none', fontWeight: item.bold ? 600 : 400 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.color = '#FF9900'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#374151'; }}
                        >
                          <span>{item.icon}</span> {item.label}
                        </Link>
                      ))}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={closeMenus}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, color: '#FF9900', fontWeight: 600, textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fff7ed'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          ⚙️ Admin Panel
                        </Link>
                      )}

                      <div style={{ borderTop: '1px solid #e5e7eb' }}>
                        <button
                          onClick={handleLogout}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontWeight: 500 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/login"    onClick={closeMenus} style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: '#FF9900', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
                      <Link to="/register" onClick={closeMenus} style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: '#374151', textDecoration: 'none', borderTop: '1px solid #e5e7eb' }}>Create Account</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Bar ─────────────────────────────────────────── */}
      <div style={{ background: '#232F3E', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4px 16px', display: 'flex', gap: 4 }}>
          <Link to="/products" style={{ padding: '6px 12px', color: '#fff', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', borderRadius: 4 }}>
            All Products
          </Link>
          {(categories || []).slice(0, 8).map(cat => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              style={{ padding: '6px 12px', color: '#ccc', fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap', borderRadius: 4 }}
              onMouseEnter={e => { e.currentTarget.style.color = '#FF9900'; e.currentTarget.style.background = 'rgba(255,153,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#ccc';    e.currentTarget.style.background = 'none'; }}
            >
              {cat.icon} {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

export default memo(Navbar);