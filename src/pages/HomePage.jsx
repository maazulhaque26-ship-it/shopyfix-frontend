import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../services/api';
import { addToCart, toggleWishlist } from '../redux/slices/shopSlices';
import useScrollReveal from '../hooks/useScrollReveal';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');

function imgSrc(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

const SLIDES = [
  { bg: 'linear-gradient(135deg,#1a1a2e,#16213e)', title: 'Cool Your World', sub: 'Premium Air Conditioners — Up to 30% Off', btn: 'Shop ACs →', cat: 'air-conditioners' },
  { bg: 'linear-gradient(135deg,#2d1b69,#6b21a8)', title: 'Laundry Made Easy', sub: 'Top & Front Loaders — Free Installation', btn: 'Shop Washers →', cat: 'washing-machines' },
  { bg: 'linear-gradient(135deg,#064e3b,#065f46)', title: 'Pure Water Daily', sub: 'RO+UV Purifiers — Starting ₹6,999', btn: 'Shop Purifiers →', cat: 'water-purifiers' },
];

function StarRating({ rating }) {
  return <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(Math.floor(rating || 0))}{'☆'.repeat(5 - Math.floor(rating || 0))}</span>;
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const wishlist = useSelector(s => s.wishlist.products);
  const isWished = wishlist.some(p => String(p._id || p) === String(product._id));
  const price    = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discount = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const image    = imgSrc(product.images?.[0]?.url);

  const handleCart = (e) => {
    e.stopPropagation();
    if (!user) { toast.warn('Please login to add to cart'); navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
    toast.success('Added to cart!');
  };

  const handleWish = (e) => {
    e.stopPropagation();
    if (!user) { toast.warn('Please login to save items'); navigate('/login'); return; }
    dispatch(toggleWishlist(product._id));
  };

  return (
    <div
      onClick={() => navigate(`/products/${product.slug}`)}
      className="premium-card"
      style={{ background: '#fff', borderRadius: 10, cursor: 'pointer', overflow: 'hidden', flexShrink: 0, width: 200 }}
    >
      <div style={{ position: 'relative', height: 160, background: '#f9fafb' }}>
        {image
          ? <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>📦</div>
        }
        {discount > 0 && <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>{discount}% OFF</span>}
        {product.isDealOfDay && <span style={{ position: 'absolute', top: 8, right: 34, background: '#f97316', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>DEAL</span>}
        <button onClick={handleWish} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, background: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
          {isWished ? '❤️' : '🤍'}
        </button>
      </div>
      <div style={{ padding: 12 }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 3px' }}>{product.brand}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#111', margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{product.name}</p>
        <StarRating rating={product.ratings} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '6px 0 10px' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>₹{price.toLocaleString('en-IN')}</span>
          {discount > 0 && <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.price.toLocaleString('en-IN')}</span>}
        </div>
        <button onClick={handleCart} style={{ width: '100%', padding: '7px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function HorizontalSection({ title, products, onSeeAll }) {
  const scrollRef = useRef(null);
  if (!products?.length) return null;
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{title}</h2>
        <button onClick={onSeeAll} style={{ background: 'none', border: 'none', color: '#FF9900', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all →</button>
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={scrollRef} style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate   = useNavigate();
  const categories = useSelector(s => s.products.categories);

  const [slide,       setSlide]       = useState(0);
  const [deals,       setDeals]       = useState([]);
  const [featured,    setFeatured]    = useState([]);

  // Premium scroll animations
  useScrollReveal();
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loaded,      setLoaded]      = useState(false);

  // Slide auto-advance
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Load all product sections in ONE request batch — runs only once
  useEffect(() => {
    if (loaded) return;
    setLoaded(true);

    const fetch4 = async () => {
      try {
        const [d, f, n, b] = await Promise.allSettled([
          API.get('/products', { params: { dealOfDay: 'true', limit: 8 } }),
          API.get('/products', { params: { featured: 'true',   limit: 8 } }),
          API.get('/products', { params: { newArrival: 'true', limit: 8 } }),
          API.get('/products', { params: { bestSeller: 'true', limit: 8 } }),
        ]);
        if (d.status === 'fulfilled') setDeals(d.value.data.products || []);
        if (f.status === 'fulfilled') setFeatured(f.value.data.products || []);
        if (n.status === 'fulfilled') setNewArrivals(n.value.data.products || []);
        if (b.status === 'fulfilled') setBestSellers(b.value.data.products || []);
      } catch { /* silent */ }
    };
    fetch4();
  }, [loaded]);

  // Deals countdown timer
  const [time, setTime] = useState(6 * 3600);
  useEffect(() => {
    const t = setInterval(() => setTime(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = String(Math.floor(time / 3600)).padStart(2, '0');
  const mm = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
  const ss = String(time % 60).padStart(2, '0');

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>

      {/* ── Hero Carousel ────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 300, background: SLIDES[slide].bg, overflow: 'hidden', transition: 'background 0.5s' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 10px', lineHeight: 1.2 }}>{SLIDES[slide].title}</h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, margin: '0 0 24px' }}>{SLIDES[slide].sub}</p>
            <button onClick={() => navigate(`/products?category=${SLIDES[slide].cat}`)}
              style={{ padding: '12px 28px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {SLIDES[slide].btn}
            </button>
          </div>
          <div style={{ fontSize: 120, opacity: 0.15 }}>🏠</div>
        </div>
        {/* Dots */}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              style={{ width: i === slide ? 20 : 8, height: 8, borderRadius: 4, background: i === slide ? '#FF9900' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
      </div>

      {/* ── Promo strip ──────────────────────────────────────────────────── */}
      <div style={{ background: '#131921', padding: '12px 24px' }}>
        <div className="reveal" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {['🚚 Free Delivery on orders ₹500+', '🔒 Secure Payments', '📦 10-Day Easy Returns', '🔧 Free Installation', '⭐ 1 Year Warranty'].map(t => (
            <span key={t} style={{ color: '#d1d5db', fontSize: 13 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Categories ───────────────────────────────────────────────── */}
        {categories?.length > 0 && (
          <div className="reveal-section" style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Shop by Category</h2>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {categories.map(cat => (
                <button key={cat._id} onClick={() => navigate(`/products?category=${cat.slug}`)}
                  style={{ flexShrink: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', cursor: 'pointer', textAlign: 'center', minWidth: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>{cat.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{cat.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Deals of the Day ─────────────────────────────────────────── */}
        {deals.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>⚡ Deals of the Day</h2>
                <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  🕐 {hh}:{mm}:{ss}
                </span>
              </div>
              <button onClick={() => navigate('/products?dealOfDay=true')} style={{ background: 'none', border: 'none', color: '#FF9900', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>See all deals →</button>
            </div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {deals.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── Featured Products ────────────────────────────────────────── */}
        <HorizontalSection title="⭐ Featured Products" products={featured} onSeeAll={() => navigate('/products?featured=true')} />

        {/* ── New Arrivals ─────────────────────────────────────────────── */}
        <HorizontalSection title="🆕 New Arrivals" products={newArrivals} onSeeAll={() => navigate('/products?newArrival=true')} />

        {/* ── Best Sellers ─────────────────────────────────────────────── */}
        <HorizontalSection title="🏆 Best Sellers" products={bestSellers} onSeeAll={() => navigate('/products?bestSeller=true')} />

        {/* ── Banner ───────────────────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg,#FF9900,#ff6b00)', borderRadius: 16, padding: '32px 40px', marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Get Up to 40% Off</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 20px' }}>On all kitchen appliances this week only</p>
            <button onClick={() => navigate('/products')}
              style={{ padding: '11px 28px', background: '#fff', color: '#FF9900', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Shop Now →
            </button>
          </div>
          <div style={{ fontSize: 80, opacity: 0.3 }}>🍳</div>
        </div>

      </div>
    </div>
  );
}