import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

export default function AdminProductForm() {
  const navigate   = useNavigate();
  const { id }     = useParams(); // present when editing
  const isEdit     = !!id;

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(isEdit);
  const [saving,     setSaving]     = useState(false);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [name,         setName]         = useState('');
  const [brand,        setBrand]        = useState('');
  const [categoryId,   setCategoryId]   = useState('');
  const [description,  setDescription]  = useState('');
  const [price,        setPrice]        = useState('');
  const [discountPrice,setDiscountPrice]= useState('');
  const [stock,        setStock]        = useState('');
  const [sku,          setSku]          = useState('');
  const [tags,         setTags]         = useState('');
  const [specs,        setSpecs]        = useState([{ key: '', value: '' }]);
  const [isFeatured,   setIsFeatured]   = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isDealOfDay,  setIsDealOfDay]  = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isActive,     setIsActive]     = useState(true);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles,     setNewFiles]     = useState([]);
  const [newPreviews,  setNewPreviews]  = useState([]);

  // ── Load categories first, then load product (so categoryId matches) ───────
  useEffect(() => {
    const init = async () => {
      // 1. Always load categories first
      try {
        const catRes = await API.get('/categories');
        const cats = catRes.data.categories || [];
        setCategories(cats);

        // 2. If editing, load product AFTER categories are in state
        if (isEdit) {
          const prodRes = await API.get(`/products/id/${id}`);
          const p = prodRes.data.product;

          setName(p.name || '');
          setBrand(p.brand || '');
          setDescription(p.description || '');
          setPrice(String(p.price || ''));
          setDiscountPrice(String(p.discountPrice || ''));
          setStock(String(p.stock || ''));
          setSku(p.sku || '');
          setTags(Array.isArray(p.tags) ? p.tags.join(', ') : '');
          setSpecs(p.specs?.length ? p.specs : [{ key: '', value: '' }]);
          setIsFeatured(!!p.isFeatured);
          setIsNewArrival(!!p.isNewArrival);
          setIsDealOfDay(!!p.isDealOfDay);
          setIsBestSeller(!!p.isBestSeller);
          setIsActive(p.isActive !== false);
          setExistingImages(p.images || []);

          // Set category — compare _id strings
          const catId = p.category?._id || p.category;
          if (catId) {
            // Find matching category in the list we just loaded
            const match = cats.find(c => c._id === catId || c._id === String(catId));
            if (match) setCategoryId(match._id);
            else setCategoryId(String(catId)); // fallback: set raw id
          }
        }
      } catch (err) {
        toast.error('Failed to load form data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEdit]);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const total = existingImages.length + newFiles.length + files.length;
    if (total > 10) { toast.warn('Maximum 10 images allowed'); return; }
    setNewFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setNewPreviews(prev => [...prev, ev.target.result]);
      reader.readAsDataURL(f);
    });
  };

  const removeExisting = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNew      = (idx) => {
    setNewFiles(prev    => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Specs handlers ─────────────────────────────────────────────────────────
  const addSpec    = ()       => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const removeSpec = (idx)    => setSpecs(prev => prev.filter((_, i) => i !== idx));
  const updateSpec = (idx, field, val) =>
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim())    { toast.error('Product name is required'); return; }
    if (!brand.trim())   { toast.error('Brand is required'); return; }
    if (!categoryId)     { toast.error('Please select a category'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }
    if (!price || Number(price) <= 0) { toast.error('Please enter a valid price'); return; }
    if (!stock || Number(stock) < 0)  { toast.error('Please enter valid stock'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name',         name.trim());
      formData.append('brand',        brand.trim());
      formData.append('category',     categoryId);
      formData.append('description',  description.trim());
      formData.append('price',        price);
      formData.append('discountPrice',discountPrice || '0');
      formData.append('stock',        stock);
      formData.append('sku',          sku);
      formData.append('tags',         tags);
      formData.append('isFeatured',   isFeatured);
      formData.append('isNewArrival', isNewArrival);
      formData.append('isDealOfDay',  isDealOfDay);
      formData.append('isBestSeller', isBestSeller);
      formData.append('isActive',     isActive);
      formData.append('specs',        JSON.stringify(specs.filter(s => s.key && s.value)));
      if (isEdit) formData.append('existingImages', JSON.stringify(existingImages));
      newFiles.forEach(f => formData.append('images', f));

      if (isEdit) {
        await API.put(`/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('✅ Product updated successfully!');
      } else {
        await API.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('✅ Product created successfully!');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const inp = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '1.5px solid #d1d5db', borderRadius: '8px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
  };
  const lbl = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '5px' };
  const section = { background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' };
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '4px solid #FF9900', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6b7280' }}>Loading product...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/admin/products')}
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>←</button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>
          {isEdit ? '✏️ Edit Product' : '➕ Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <div style={section}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
            Basic Information
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <span style={lbl}>Product Name *</span>
            <input style={inp} type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Samsung 253L Double Door Refrigerator" autoComplete="off" />
          </div>

          <div style={{ ...grid2, marginBottom: '16px' }}>
            <div>
              <span style={lbl}>Brand *</span>
              <input style={inp} type="text" value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="e.g. Samsung" autoComplete="off" />
            </div>
            <div>
              <span style={lbl}>Category *</span>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}
              >
                <option value="">-- Select category --</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={lbl}>Description *</span>
            <textarea style={{ ...inp, resize: 'vertical' }} rows={4} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the product features, specifications, benefits..." />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={lbl}>Tags <span style={{ fontWeight: 400, color: '#9ca3af' }}>(comma separated)</span></span>
            <input style={inp} type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="refrigerator, samsung, double door" autoComplete="off" />
          </div>
        </div>

        {/* ── Pricing & Stock ─────────────────────────────────────────────── */}
        <div style={section}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
            Pricing & Stock
          </h2>
          <div style={{ ...grid2, marginBottom: '16px' }}>
            <div>
              <span style={lbl}>Price (₹) *</span>
              <input style={inp} type="number" value={price} onChange={e => setPrice(e.target.value)}
                placeholder="28999" min="0" />
            </div>
            <div>
              <span style={lbl}>Discount Price (₹) <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
              <input style={inp} type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)}
                placeholder="24499" min="0" />
            </div>
          </div>
          <div style={grid2}>
            <div>
              <span style={lbl}>Stock Quantity *</span>
              <input style={inp} type="number" value={stock} onChange={e => setStock(e.target.value)}
                placeholder="50" min="0" />
            </div>
            <div>
              <span style={lbl}>SKU <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></span>
              <input style={inp} type="text" value={sku} onChange={e => setSku(e.target.value)}
                placeholder="SAM-REF-253L" autoComplete="off" />
            </div>
          </div>
        </div>

        {/* ── Images ──────────────────────────────────────────────────────── */}
        <div style={section}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
            Product Images
          </h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
            Add 4-5 images: front, side, back, detail. Max 10 images, 5MB each.
          </p>

          {/* Image grid */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            {existingImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', width: 90, height: 90 }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #10b981' }} />
                <button type="button" onClick={() => removeExisting(idx)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              </div>
            ))}
            {newPreviews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative', width: 90, height: 90 }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #3b82f6' }} />
                <button type="button" onClick={() => removeNew(idx)}
                  style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
              </div>
            ))}
            {(existingImages.length + newFiles.length) < 10 && (
              <label style={{ width: 90, height: 90, border: '2px dashed #d1d5db', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: '11px', gap: '4px' }}>
                <span style={{ fontSize: '24px' }}>+</span>
                <span>Add image</span>
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af' }}>🟢 Green border = saved &nbsp;|&nbsp; 🔵 Blue border = newly added</p>
        </div>

        {/* ── Specifications ───────────────────────────────────────────────── */}
        <div style={section}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
            Specifications
          </h2>
          {specs.map((spec, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
              <input style={inp} type="text" value={spec.key} onChange={e => updateSpec(idx, 'key', e.target.value)}
                placeholder="e.g. Capacity" autoComplete="off" />
              <input style={inp} type="text" value={spec.value} onChange={e => updateSpec(idx, 'value', e.target.value)}
                placeholder="e.g. 253 L" autoComplete="off" />
              <button type="button" onClick={() => removeSpec(idx)}
                style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" onClick={addSpec}
            style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            + Add Specification
          </button>
        </div>

        {/* ── Flags ────────────────────────────────────────────────────────── */}
        <div style={section}>
          <h2 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
            Product Flags
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { label: '⭐ Featured',      val: isFeatured,   set: setIsFeatured },
              { label: '🆕 New Arrival',   val: isNewArrival, set: setIsNewArrival },
              { label: '🔥 Deal of Day',   val: isDealOfDay,  set: setIsDealOfDay },
              { label: '🏆 Best Seller',   val: isBestSeller, set: setIsBestSeller },
              { label: '✅ Active',         val: isActive,     set: setIsActive },
            ].map(flag => (
              <label key={flag.label}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: flag.val ? '#fff7ed' : '#f9fafb', border: `1.5px solid ${flag.val ? '#fed7aa' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={flag.val} onChange={e => flag.set(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#FF9900', cursor: 'pointer' }} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{flag.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Submit ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => navigate('/admin/products')}
            style={{ flex: 1, padding: '14px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}
            style={{ flex: 2, padding: '14px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? '⏳ Saving...' : isEdit ? '✅ Update Product' : '✅ Create Product'}
          </button>
        </div>

      </form>
    </div>
  );
}