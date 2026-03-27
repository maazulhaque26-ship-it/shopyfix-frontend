import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import API from '../services/api';
import { addToCart, toggleWishlist } from '../redux/slices/shopSlices';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

function imgSrc(url) {
  if (!url) return 'https://via.placeholder.com/400x400?text=No+Image';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

function StarRating({ rating, size = 16 }) {
  return (
    <span style={{ fontSize: size, color: '#f59e0b' }}>
      {'★'.repeat(Math.floor(rating || 0))}
      {'☆'.repeat(5 - Math.floor(rating || 0))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const { user }   = useSelector(s => s.auth);
  const wishlist   = useSelector(s => s.wishlist.products);

  const [product,    setProduct]    = useState(null);
  const [related,    setRelated]    = useState([]);
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeImg,  setActiveImg]  = useState(0);
  const [qty,        setQty]        = useState(1);
  const [activeTab,  setActiveTab]  = useState('description');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const load = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/products/slug/${slug}`);
        const p   = res.data.product;
        setProduct(p);
        setActiveImg(0);

        const [relRes, revRes] = await Promise.allSettled([
          API.get(`/products/${p._id}/related`),
          API.get(`/products/${p._id}/reviews`),
        ]);
        if (relRes.status === 'fulfilled') setRelated(relRes.value.data.products || []);
        if (revRes.status === 'fulfilled') setReviews(revRes.value.data.reviews || []);
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, navigate]);

  const isWishlisted = wishlist.some(p => String(p._id || p) === String(product?._id));

  const handleCart = () => {
    if (!user) { toast.warn('Please login to add to cart'); navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, quantity: qty }));
    toast.success('Added to cart! 🛒');
  };

  const handleWishlist = () => {
    if (!user) { toast.warn('Please login to save items'); navigate('/login'); return; }
    dispatch(toggleWishlist(product._id));
    toast.info(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist ❤️');
  };

  const handleBuyNow = () => {
    if (!user) { toast.warn('Please login first'); navigate('/login'); return; }
    dispatch(addToCart({ productId: product._id, quantity: qty }));
    navigate('/checkout');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.warn('Please login to review'); navigate('/login'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmitting(true);
    try {
      const res = await API.post(`/products/${product._id}/reviews`, reviewForm);
      setReviews(prev => [res.data.review, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review submitted! ⭐');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #FF9900', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!product) return null;

  const price    = product.discountPrice > 0 ? product.discountPrice : product.price;
  const discount = product.discountPrice > 0 ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const images   = product.images?.length ? product.images : [{ url: null }];

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#6b7280', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#FF9900', cursor: 'pointer', padding: 0 }}>Home</button>
          <span>›</span>
          <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: '#FF9900', cursor: 'pointer', padding: 0 }}>Products</button>
          <span>›</span>
          <span style={{ color: '#374151' }}>{product.name}</span>
        </div>

        {/* Main product section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>

          {/* Images */}
          <div>
            {/* Main image */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', aspectRatio: '1', overflow: 'hidden' }}>
              <img
                src={imgSrc(images[activeImg]?.url)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => { e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'; }}
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 64, height: 64, border: `2px solid ${activeImg === i ? '#FF9900' : '#e5e7eb'}`, borderRadius: '8px', overflow: 'hidden', padding: 0, cursor: 'pointer', background: '#fff' }}>
                    <img src={imgSrc(img.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/64x64?text=?'; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{product.brand}</p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', marginBottom: '12px', lineHeight: 1.3 }}>{product.name}</h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <StarRating rating={product.ratings} />
              <span style={{ fontSize: '13px', color: '#6b7280' }}>({product.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#111' }}>₹{price.toLocaleString('en-IN')}</span>
                {discount > 0 && <>
                  <span style={{ fontSize: '16px', color: '#9ca3af', textDecoration: 'line-through' }}>₹{product.price.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>{discount}% off</span>
                </>}
              </div>
              {product.stock > 0 && product.stock <= 5 && (
                <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 600, marginTop: '6px' }}>⚠️ Only {product.stock} left in stock!</p>
              )}
              {product.stock === 0 && (
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: 600, marginTop: '6px' }}>❌ Out of Stock</p>
              )}
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Quantity:</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: 36, height: 36, background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}>−</button>
                  <span style={{ width: 40, textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    style={{ width: 36, height: 36, background: '#f9fafb', border: 'none', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }}>+</button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {product.stock > 0 ? <>
                <button onClick={handleCart}
                  style={{ padding: '13px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                  🛒 Add to Cart
                </button>
                <button onClick={handleBuyNow}
                  style={{ padding: '13px', background: '#131921', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
                  ⚡ Buy Now
                </button>
              </> : (
                <button disabled style={{ padding: '13px', background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'not-allowed' }}>
                  Out of Stock
                </button>
              )}
              <button onClick={handleWishlist}
                style={{ padding: '13px', background: '#fff', color: isWishlisted ? '#ef4444' : '#374151', border: `1.5px solid ${isWishlisted ? '#fecaca' : '#d1d5db'}`, borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
                {isWishlisted ? '❤️ Saved to Wishlist' : '🤍 Save to Wishlist'}
              </button>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ padding: '3px 10px', background: '#f3f4f6', borderRadius: '20px', fontSize: '12px', color: '#6b7280' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', marginBottom: '32px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {['description', 'specs', 'reviews'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? '#FF9900' : '#6b7280', borderBottom: activeTab === tab ? '2px solid #FF9900' : '2px solid transparent', textTransform: 'capitalize' }}>
                {tab === 'reviews' ? `Reviews (${reviews.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding: '24px' }}>
            {activeTab === 'description' && (
              <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7 }}>{product.description}</p>
            )}

            {activeTab === 'specs' && (
              product.specs?.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {product.specs.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: '14px', color: '#374151', width: '40%' }}>{s.key}</td>
                        <td style={{ padding: '10px 16px', fontSize: '14px', color: '#6b7280' }}>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p style={{ color: '#9ca3af' }}>No specifications available.</p>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Review form */}
                <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Write a Review</h3>
                  <form onSubmit={submitReview}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Rating</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[1,2,3,4,5].map(r => (
                          <button key={r} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: r }))}
                            style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: r <= reviewForm.rating ? '#f59e0b' : '#d1d5db' }}>★</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Your Review</span>
                      <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: '14px', border: '1.5px solid #d1d5db', borderRadius: '8px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <button type="submit" disabled={submitting}
                      style={{ padding: '10px 24px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>No reviews yet. Be the first to review!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map(r => (
                      <div key={r._id} style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.user?.name || 'User'}</span>
                            <StarRating rating={r.rating} size={13} />
                          </div>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>{r.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Related Products</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {related.slice(0, 6).map(p => {
                const rPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
                return (
                  <div key={p._id} onClick={() => navigate(`/products/${p.slug}`)}
                    style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                    <img src={imgSrc(p.images?.[0]?.url)} alt={p.name}
                      style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/180x140?text=No+Image'; }} />
                    <div style={{ padding: '10px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#FF9900', margin: 0 }}>₹{rPrice.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}