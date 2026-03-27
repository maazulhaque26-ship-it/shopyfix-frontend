import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../services/api';
import { toggleWishlist } from '../redux/slices/shopSlices';
import { addToCart } from '../redux/slices/shopSlices';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price-low',  label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount',   label: 'Best Discount' },
];

function StarRating({ rating }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '13px' }}>
      {'★'.repeat(Math.floor(rating || 0))}{'☆'.repeat(5 - Math.floor(rating || 0))}
    </span>
  );
}

function ProductCard({ product }) {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { user }  = useSelector(s => s.auth);
  const wishlist  = useSelector(s => s.wishlist.products);
  const isWished  = wishlist.some(p => String(p._id || p) === String(product._id));
  const price     = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discount  = product.discountPrice > 0
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

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
      style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', cursor: 'pointer', overflow: 'hidden', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)'}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '180px', background: '#f9fafb' }}>
        <img
          src={product.images?.[0]?.url || 'https://via.placeholder.com/300x200?text=No+Image'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
        />
        {discount > 0 && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
            {discount}% OFF
          </span>
        )}
        <button
          onClick={handleWish}
          style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, background: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}
        >
          {isWished ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px' }}>{product.brand}</p>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111', margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.name}
        </p>
        <StarRating rating={product.ratings} />
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 8px' }}>({product.numReviews || 0} reviews)</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>₹{price.toLocaleString('en-IN')}</span>
          {discount > 0 && <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.price.toLocaleString('en-IN')}</span>}
        </div>
        {product.stock === 0 ? (
          <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>Out of Stock</p>
        ) : (
          <button
            onClick={handleCart}
            style={{ width: '100%', padding: '8px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
      <div style={{ height: 180, background: '#e5e7eb', animation: 'pulse 1.5s infinite' }} />
      <div style={{ padding: 12 }}>
        {[80, 100, 60, 40].map((w, i) => (
          <div key={i} style={{ height: 12, background: '#e5e7eb', borderRadius: 4, marginBottom: 8, width: `${w}%`, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );
}

export default function ProductListingPage() {
  const navigate       = useNavigate();
  const dispatch       = useDispatch();
  const [params, setParams] = useSearchParams();
  const categories     = useSelector(s => s.products.categories);

  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [page,      setPage]      = useState(1);

  // Filters
  const [sort,      setSort]      = useState('newest');
  const [minPrice,  setMinPrice]  = useState('');
  const [maxPrice,  setMaxPrice]  = useState('');
  const [selBrands, setSelBrands] = useState([]);
  const [inStock,   setInStock]   = useState(false);
  const [brands,    setBrands]    = useState([]);

  const categorySlug = params.get('category') || '';
  const keyword      = params.get('keyword')  || '';

  // Find category ID from slug
  const categoryObj = categories?.find(c => c.slug === categorySlug);
  const categoryId  = categoryObj?._id || '';
  const pageTitle   = keyword ? `Search: "${keyword}"` : categoryObj?.name || 'All Products';

  // Load brands
  useEffect(() => {
    API.get('/products/brands').then(r => setBrands(r.data.brands || [])).catch(() => {});
  }, []);

  // Load products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = { page, limit: 12, sort };
        if (keyword)    query.keyword  = keyword;
        if (categoryId) query.category = categoryId;
        if (minPrice)   query.minPrice = minPrice;
        if (maxPrice)   query.maxPrice = maxPrice;
        if (selBrands.length) query.brand = selBrands.join(',');
        if (inStock)    query.inStock  = 'true';

        const res = await API.get('/products', { params: query });
        setProducts(res.data.products || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      } catch (err) {
        toast.error('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, sort, keyword, categoryId, minPrice, maxPrice, selBrands, inStock]);

  const toggleBrand = (brand) => {
    setSelBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSort('newest'); setMinPrice(''); setMaxPrice('');
    setSelBrands([]); setInStock(false); setPage(1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#FF9900', cursor: 'pointer', padding: 0 }}>Home</button>
          <span>›</span>
          <span style={{ color: '#111', fontWeight: 600 }}>{pageTitle}</span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── Sidebar filters ────────────────────────────────────────────── */}
          <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>🔧 Filters</span>
              <button onClick={clearFilters} style={{ fontSize: '11px', color: '#FF9900', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
            </div>

            {/* Categories */}
            {categories?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#374151' }}>Category</p>
                <button
                  onClick={() => { setParams({}); setPage(1); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', fontSize: '13px', background: !categorySlug ? '#fff7ed' : 'none', color: !categorySlug ? '#FF9900' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: !categorySlug ? 700 : 400 }}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => { setParams({ category: cat.slug }); setPage(1); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', fontSize: '13px', background: categorySlug === cat.slug ? '#fff7ed' : 'none', color: categorySlug === cat.slug ? '#FF9900' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: categorySlug === cat.slug ? 700 : 400 }}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Price range */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#374151' }}>Price Range (₹)</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1); }} placeholder="Min"
                  style={{ width: '50%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
                <input type="number" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1); }} placeholder="Max"
                  style={{ width: '50%', padding: '6px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none' }} />
              </div>
            </div>

            {/* Brands */}
            {brands.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#374151' }}>Brand</p>
                <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {brands.map(brand => (
                    <label key={brand} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                      <input type="checkbox" checked={selBrands.includes(brand)} onChange={() => toggleBrand(brand)}
                        style={{ accentColor: '#FF9900', cursor: 'pointer' }} />
                      {brand}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* In stock */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
              <input type="checkbox" checked={inStock} onChange={e => { setInStock(e.target.checked); setPage(1); }}
                style={{ accentColor: '#FF9900', cursor: 'pointer' }} />
              In Stock Only
            </label>
          </aside>

          {/* ── Products grid ──────────────────────────────────────────────── */}
          <div style={{ flex: 1 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {loading ? 'Loading...' : `${total} product${total !== 1 ? 's' : ''} found`}
              </p>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
                style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Active filter chips */}
            {(categorySlug || keyword || selBrands.length > 0 || minPrice || maxPrice || inStock) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {categorySlug && (
                  <span style={{ padding: '4px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '20px', fontSize: '12px', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {categoryObj?.name}
                    <button onClick={() => setParams({})} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#c2410c' }}>×</button>
                  </span>
                )}
                {selBrands.map(b => (
                  <span key={b} style={{ padding: '4px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '20px', fontSize: '12px', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {b}
                    <button onClick={() => toggleBrand(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, color: '#c2410c' }}>×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '10px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>No products found</h3>
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>Try adjusting your filters or search term</p>
                <button onClick={clearFilters} style={{ padding: '10px 24px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>
                  ←
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: '8px 14px', border: '1px solid', borderColor: page === p ? '#FF9900' : '#d1d5db', borderRadius: '8px', background: page === p ? '#FF9900' : '#fff', color: page === p ? '#fff' : '#374151', cursor: 'pointer', fontWeight: page === p ? 700 : 400 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}