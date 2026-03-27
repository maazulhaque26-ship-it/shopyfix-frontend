import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

// Fix image URLs for local uploads
const API_BASE = (import.meta.env.VITE_API_URL || 'https://shopyfix-backend.onrender.com').replace('/api', '');

function imgSrc(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

export default function AdminProducts() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = useCallback(async (pg = 1, kw = '') => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 10 };
      if (kw.trim()) params.keyword = kw.trim();
      const res = await API.get('/products', { params });
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      if (err?.response) toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(1, ''); }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchProducts(1, search); }, 400);
    return () => clearTimeout(t);
  }, [search, fetchProducts]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await API.delete(`/products/${id}`);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Products</h1>
          {!loading && <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>{total} products total</p>}
        </div>
        <button onClick={() => navigate('/admin/products/new')}
          style={{ padding: '10px 20px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
          + Add Product
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products by name, brand..."
          autoComplete="off"
          style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', fontSize: '14px', border: '1.5px solid #d1d5db', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => (e.target.style.borderColor = '#FF9900')}
          onBlur={e => (e.target.style.borderColor = '#d1d5db')}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: 36, height: 36, border: '4px solid #FF9900', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#111' }}>No products found</p>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>{search ? `No results for "${search}"` : 'Add your first product'}</p>
            {!search && (
              <button onClick={() => navigate('/admin/products/new')}
                style={{ padding: '10px 24px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                + Add Product
              </button>
            )}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, idx) => {
                const imageUrl = imgSrc(p.images?.[0]?.url);
                const price = p.discountPrice > 0 ? p.discountPrice : p.price;

                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>

                    {/* Product */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Image box */}
                        <div style={{ width: 52, height: 52, borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px">📦</div>';
                              }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#111', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{p.name}</p>
                          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{p.brand}</p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>{p.category?.name || '—'}</td>

                    {/* Price */}
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px', color: '#111', margin: 0 }}>₹{price.toLocaleString('en-IN')}</p>
                      {p.discountPrice > 0 && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', margin: '2px 0 0' }}>₹{p.price.toLocaleString('en-IN')}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: p.stock === 0 ? '#ef4444' : p.stock < 5 ? '#f59e0b' : '#10b981' }}>{p.stock}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b' }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => navigate(`/admin/products/${p._id}/edit`)}
                          style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(p._id, p.name)} disabled={deleting === p._id}
                          style={{ padding: '5px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', opacity: deleting === p._id ? 0.5 : 1 }}>
                          {deleting === p._id ? '...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button onClick={() => { const p = page - 1; setPage(p); fetchProducts(p, search); }} disabled={page === 1}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>←</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => { setPage(p); fetchProducts(p, search); }}
              style={{ padding: '8px 14px', border: '1px solid', borderColor: page === p ? '#FF9900' : '#d1d5db', borderRadius: '8px', background: page === p ? '#FF9900' : '#fff', color: page === p ? '#fff' : '#374151', cursor: 'pointer', fontWeight: page === p ? 700 : 400 }}>
              {p}
            </button>
          ))}
          <button onClick={() => { const p = page + 1; setPage(p); fetchProducts(p, search); }} disabled={page === pages}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: page === pages ? 'not-allowed' : 'pointer', opacity: page === pages ? 0.4 : 1 }}>→</button>
        </div>
      )}
    </div>
  );
}