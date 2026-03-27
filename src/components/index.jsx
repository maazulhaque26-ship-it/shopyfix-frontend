import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
export function ProtectedRoute({ children }) {
  const { user } = useSelector(s => s.auth);
  // Also check localStorage directly to handle payment callback edge cases
  const token = localStorage.getItem('token');
  if (!user && !token) return <Navigate to="/login" replace />;
  return children;
}

// ── AdminRoute ─────────────────────────────────────────────────────────────────
export function AdminRoute({ children }) {
  const { user } = useSelector(s => s.auth);
  const token = localStorage.getItem('token');
  if (!user && !token) return <Navigate to="/login" replace />;
  if (user && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default ProtectedRoute;

// ── StarRating ──────────────────────────────────────────────────────────────────
export function StarRating({ rating, maxStars = 5, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`}>
      {Array.from({ length: maxStars }, (_, i) => (
        <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : i < rating ? 'text-yellow-300' : 'text-gray-300'}>★</span>
      ))}
    </div>
  );
}

// ── ProductCard ─────────────────────────────────────────────────────────────────
export function ProductCard({ product }) {
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const wishlistProducts = useSelector(s => s.wishlist.products);
  const dispatch = useDispatch();

  const isWishlisted = wishlistProducts.some(p => String(p._id || p) === String(product._id));
  const discount = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const effectivePrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) { toast.warn('Please login first to add to wishlist!'); navigate('/login'); return; }
    import('../redux/slices/shopSlices').then(m => dispatch(m.toggleWishlist(product._id)));
  };

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.15)] transition-all duration-500 hover:-translate-y-2 cursor-pointer group overflow-hidden" onClick={() => navigate(`/products/${product.slug}`)}>
      <div className="relative overflow-hidden">
        <img 
          src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=600&fit=crop&q=80'} 
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=600&fit=crop&q=80'; }}
          alt={product.name} 
          className="w-full h-52 object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
        />
        {discount > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">{discount}% OFF</span>}
        {product.isDealOfDay && <span className="absolute top-2 right-8 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">DEAL</span>}
        <button onClick={handleWishlist} className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform">
          <span className={isWishlisted ? 'text-red-500' : 'text-gray-300'}>{isWishlisted ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-0.5">{product.brand}</p>
        <p className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">{product.name}</p>
        <StarRating rating={product.ratings || 0} />
        <p className="text-xs text-gray-400 mb-2">({product.numReviews || 0} reviews)</p>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">₹{effectivePrice.toLocaleString('en-IN')}</span>
          {discount > 0 && <span className="text-xs text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>}
        </div>
        {product.stock === 0 && <p className="text-xs text-red-500 mt-1">Out of Stock</p>}
      </div>
    </div>
  );
}

// Need useDispatch
import { useDispatch } from 'react-redux';

// ── Skeleton ────────────────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-3 animate-pulse">
      <div className="bg-gray-200 h-48 rounded-lg mb-3" />
      <div className="bg-gray-200 h-3 rounded mb-2 w-1/3" />
      <div className="bg-gray-200 h-4 rounded mb-2" />
      <div className="bg-gray-200 h-4 rounded mb-3 w-2/3" />
      <div className="bg-gray-200 h-5 rounded w-1/2" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

// ── Breadcrumb ──────────────────────────────────────────────────────────────────
export function Breadcrumb({ items }) {
  const navigate = useNavigate();
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 flex-wrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <span>›</span>}
          {item.href ? (
            <button onClick={() => navigate(item.href)} className="hover:text-amazon-orange">{item.label}</button>
          ) : (
            <span className="text-gray-800 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────────
export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className="px-3 py-2 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">←</button>
      {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
        const p = i + 1;
        return (
          <button key={p} onClick={() => onChange(p)} className={`w-9 h-9 rounded ${page === p ? 'bg-amazon-orange text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>{p}</button>
        );
      })}
      <button onClick={() => onChange(page + 1)} disabled={page === pages} className="px-3 py-2 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">→</button>
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📦', title, message, actionLabel, onAction }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {message && <p className="text-gray-500 mb-6">{message}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="bg-amazon-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600">{actionLabel}</button>
      )}
    </div>
  );
}