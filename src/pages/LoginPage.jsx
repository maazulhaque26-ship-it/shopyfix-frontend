/**
 * LoginPage.jsx — Demo Accounts Section Removed
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { login, clearError } from '../redux/slices/authSlice';
import { fetchCart, fetchWishlist } from '../redux/slices/shopSlices';

const FieldErr = memo(({ msg, isEmail }) => (
  <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
    ⚠️ {msg}
    {isEmail && (
      <Link to="/register" style={{ color: '#2563eb', textDecoration: 'underline', marginLeft: 4, fontWeight: 600 }}>
        Sign up →
      </Link>
    )}
  </p>
));

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading } = useSelector(s => s.auth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [fieldErr, setFieldErr] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    dispatch(clearError());
    return () => dispatch(clearError());
  }, [dispatch]);

  const clearFieldErr = useCallback((field) => {
    setFieldErr(prev => ({ ...prev, [field]: '' }));
  }, []);

  const validate = useCallback(() => {
    const errs = { email: '', password: '' };
    let ok = true;
    if (!email.trim()) {
      errs.email = 'Email is required'; ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address'; ok = false;
    }
    if (!password) {
      errs.password = 'Password is required'; ok = false;
    }
    setFieldErr(errs);
    return ok;
  }, [email, password]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(login({
      email: email.trim().toLowerCase(),
      password,
    }));

    if (login.fulfilled.match(result)) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
      const name = result.payload.user?.name?.split(' ')[0] || 'there';
      toast.success(`👋 Welcome back, ${name}!`, { autoClose: 3000 });
      navigate(from, { replace: true });
    } else {
      const msg = result.payload || 'Login failed. Please try again.';
      const lower = msg.toLowerCase();
      toast.error(msg, { autoClose: 5000 });

      if (lower.includes('no account') || lower.includes('not found') ||
          lower.includes('does not exist') || lower.includes('register')) {
        setFieldErr(f => ({ ...f, email: 'No account found with this email' }));
      } else if (lower.includes('incorrect password') || lower.includes('wrong password') ||
                 lower.includes('password')) {
        setFieldErr(f => ({ ...f, password: 'Incorrect password' }));
      } else if (lower.includes('deactivated') || lower.includes('inactive')) {
        setFieldErr(f => ({ ...f, email: 'Account deactivated — contact support' }));
      }
    }
  }, [dispatch, navigate, email, password, from, validate]);

  const inp = (hasErr) => ({
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    border: `1.5px solid ${hasErr ? '#dc2626' : '#d1d5db'}`,
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', fontSize: 32, fontWeight: 800, fontFamily: 'serif', letterSpacing: '-0.02em', color: '#111' }}>
            <span>Shopifix</span>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 24, color: '#111' }}>Sign In</h2>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); clearFieldErr('email'); }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                style={inp(fieldErr.email)}
                onFocus={e  => { if (!fieldErr.email) e.target.style.borderColor = '#FF9900'; }}
                onBlur={e   => { if (!fieldErr.email) e.target.style.borderColor = '#d1d5db'; }}
              />
              {fieldErr.email && (
                <FieldErr
                  msg={fieldErr.email}
                  isEmail={fieldErr.email.includes('No account')}
                />
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearFieldErr('password'); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ ...inp(fieldErr.password), paddingRight: 44 }}
                  onFocus={e  => { if (!fieldErr.password) e.target.style.borderColor = '#FF9900'; }}
                  onBlur={e   => { if (!fieldErr.password) e.target.style.borderColor = '#d1d5db'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErr.password && <FieldErr msg={fieldErr.password} />}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 13, background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading && (
                <span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6b7280' }}>
            New to Shopifix?{' '}
            <Link to="/register" style={{ color: '#FF9900', fontWeight: 600, textDecoration: 'none' }}>
              Create your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}