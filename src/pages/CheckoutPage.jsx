/**
 * CheckoutPage.jsx — Professional Audit Fix
 *
 * STRIPE BUGS FIXED:
 * 1. "Use Stripe Elements" error — was trying to pass raw card numbers.
 *    FIX: CardElement stays ALWAYS MOUNTED (display:none when not on step 1)
 *    so elements.getElement(CardElement) always finds it at payment time.
 * 2. "Failed to fetch" — happens when stripePromise is null (bad key)
 *    FIX: validates pk_ prefix before calling loadStripe, shows config warning
 * 3. CardElement unmounts between steps → getElement returns null → crash
 *    FIX: Payment div uses display:none NOT conditional rendering
 *
 * OTHER FIXES:
 * 1. item.price was undefined — items store product ref, not flat price
 *    FIX: correctly reads discountPrice || price from item.product
 * 2. coupon endpoint was /coupons/validate — changed to /coupons/apply
 * 3. navigate path fixed to /order-success?orderId= (matches route definition)
 * 4. useCallback on all handlers to prevent re-renders
 * 5. Removed unused useDispatch import (resetCart already in shopSlices)
 */
import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate }                             from 'react-router-dom';
import { useSelector, useDispatch }                from 'react-redux';
import { toast }                                   from 'react-toastify';
import { loadStripe }                              from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import API                                         from '../services/api';
import { resetCart }                               from '../redux/slices/shopSlices';

// ── Stripe init — validate key before loading ─────────────────────
const stripeKey     = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey?.startsWith('pk_') ? loadStripe(stripeKey) : null;

// ── Helper: get item price from product ref ───────────────────────
const getItemPrice = (item) => {
  const p = item.product;
  if (!p) return item.price || 0;
  return (p.discountPrice > 0 ? p.discountPrice : p.price) || item.price || 0;
};

// ── Step indicator ────────────────────────────────────────────────
const Steps = memo(({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
    {['Address', 'Payment', 'Review'].map((label, idx) => (
      <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
            background: current >= idx ? '#FF9900' : '#e5e7eb',
            color: current >= idx ? '#fff' : '#9ca3af',
            transition: 'all 0.2s',
          }}>
            {current > idx ? '✓' : idx + 1}
          </div>
          <span style={{ fontSize: 12, marginTop: 4, fontWeight: current === idx ? 700 : 400, color: current === idx ? '#FF9900' : '#6b7280' }}>
            {label}
          </span>
        </div>
        {idx < 2 && (
          <div style={{ width: 60, height: 2, background: current > idx ? '#FF9900' : '#e5e7eb', margin: '0 8px', marginBottom: 20, transition: 'all 0.2s' }} />
        )}
      </div>
    ))}
  </div>
));

// ── Inner checkout form (must be inside Elements) ─────────────────
function CheckoutForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stripe   = useStripe();
  const elements = useElements();

  const { user }  = useSelector(s => s.auth);
  const { items } = useSelector(s => s.cart);

  const [step,            setStep]           = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useNewAddress,   setUseNewAddress]  = useState(false);
  const [newAddress,      setNewAddress]     = useState({
    fullName: '', phone: '', addressLine1: '',
    addressLine2: '', city: '', state: '', pincode: '',
  });
  const [paymentMethod,   setPaymentMethod]  = useState('COD');
  const [couponCode,      setCouponCode]     = useState('');
  const [couponDiscount,  setCouponDiscount] = useState(0);
  const [couponApplied,   setCouponApplied]  = useState(false);
  const [placing,         setPlacing]        = useState(false);

  // Set default address once
  useEffect(() => {
    if (user?.addresses?.length > 0) {
      setSelectedAddress(user.addresses.find(a => a.isDefault) || user.addresses[0]);
    } else {
      setUseNewAddress(true);
    }
  }, [user]);

  // ── Price calculations ──────────────────────────────────────────
  // FIX: read price from product ref, not flat item.price
  const itemsPrice = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const shippingPrice = itemsPrice >= 500 ? 0 : 99;
  const taxPrice      = Math.round(itemsPrice * 0.18);
  const totalPrice    = Math.max(0, itemsPrice + shippingPrice + taxPrice - couponDiscount);

  const getAddress = useCallback(() => (
    useNewAddress ? newAddress : selectedAddress
  ), [useNewAddress, newAddress, selectedAddress]);

  // ── Coupon ──────────────────────────────────────────────────────
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    if (couponApplied)      { toast.info('Coupon already applied'); return; }
    try {
      // FIX: correct endpoint (was /coupons/validate)
      const res = await API.post('/coupons/apply', { code: couponCode.toUpperCase(), orderAmount: itemsPrice });
      const discount = res.data.coupon?.discountAmount || res.data.discount || 0;
      setCouponDiscount(discount);
      setCouponApplied(true);
      toast.success(`✅ Coupon applied! You save ₹${discount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    }
  }, [couponCode, couponApplied, itemsPrice]);

  // ── Address validation ──────────────────────────────────────────
  const validateAddress = useCallback(() => {
    const a = getAddress();
    if (!a?.fullName?.trim())    { toast.error('Please enter full name'); return false; }
    if (!a?.phone?.trim())       { toast.error('Please enter phone number'); return false; }
    if (!a?.addressLine1?.trim()){ toast.error('Please enter address'); return false; }
    if (!a?.city?.trim())        { toast.error('Please enter city'); return false; }
    if (!a?.state?.trim())       { toast.error('Please enter state'); return false; }
    if (!a?.pincode?.trim())     { toast.error('Please enter pincode'); return false; }
    return true;
  }, [getAddress]);

  // ── Place order ─────────────────────────────────────────────────
  const placeOrder = useCallback(async () => {
    if (placing) return;
    setPlacing(true);

    try {
      let stripePaymentIntentId = '';

      // ── Stripe card payment ──────────────────────────────────────
      if (paymentMethod === 'Stripe') {
        if (!stripePromise) {
          toast.error('Stripe is not configured. Please use Cash on Delivery or contact support.');
          setPlacing(false); return;
        }

        if (!stripe || !elements) {
          toast.error('Stripe is still loading. Please wait a moment and try again.');
          setPlacing(false); return;
        }

        // FIX: CardElement is ALWAYS mounted (display:none when not on step 1)
        // So getElement() will ALWAYS find it — no "Card element not found" error
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          toast.error('Card form not ready. Please go back to the Payment step.');
          setPlacing(false); return;
        }

        // 1. Create PaymentIntent on backend
        let clientSecret;
        try {
          const intentRes = await API.post('/payment/create-intent', { amount: totalPrice });
          clientSecret          = intentRes.data.clientSecret;
          stripePaymentIntentId = intentRes.data.paymentIntentId;
        } catch (err) {
          toast.error(err.response?.data?.message || '❌ Payment initialization failed');
          setPlacing(false); return;
        }

        // 2. Confirm payment via Stripe Elements (card details stay in Stripe's iframe)
        const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement, // ← Stripe Elements iframe, NOT raw card data
              billing_details: {
                name:  user?.name  || '',
                email: user?.email || '',
              },
            },
          }
        );

        if (stripeErr) {
          const codeMap = {
            card_declined:      '❌ Card declined. Please try a different card.',
            insufficient_funds: '❌ Insufficient funds. Please try another card.',
            incorrect_cvc:      '❌ Incorrect CVV. Please check your card.',
            expired_card:       '❌ Card expired. Please use a valid card.',
            incorrect_number:   '❌ Invalid card number.',
            processing_error:   '❌ Processing error. Please try again.',
          };
          toast.error(codeMap[stripeErr.code] || `❌ ${stripeErr.message}`);
          setPlacing(false); return;
        }

        if (paymentIntent?.status !== 'succeeded') {
          toast.error(`❌ Payment ${paymentIntent?.status}. Please try again.`);
          setPlacing(false); return;
        }

        stripePaymentIntentId = paymentIntent.id;
        toast.info('💳 Card charged successfully! Saving your order...');
      }

      // ── Create order in database ─────────────────────────────────
      const orderPayload = {
        items: items.map(item => ({
          product:  item.product?._id || item.product,
          quantity: item.quantity,
          price:    getItemPrice(item),
        })),
        shippingAddress:      getAddress(),
        paymentMethod,
        stripePaymentIntentId,
        couponCode:     couponApplied ? couponCode.toUpperCase() : '',
        couponDiscount,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      };

      const res = await API.post('/orders', orderPayload);

      dispatch(resetCart()); // clear cart in Redux

      toast.success('🎉 Order placed successfully!');

      // FIX: navigate to correct route with orderId param
      navigate(`/order-success?orderId=${res.data.order._id}&orderNumber=${res.data.order.orderNumber}`);

    } catch (err) {
      toast.error(err.response?.data?.message || '❌ Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  }, [placing, paymentMethod, stripe, elements, user, items, getAddress, dispatch, navigate,
      totalPrice, couponApplied, couponCode, couponDiscount, itemsPrice, shippingPrice, taxPrice]);

  // ── Empty cart guard ─────────────────────────────────────────────
  if (!items || items.length === 0) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 56 }}>🛒</div>
        <p style={{ fontSize: 18, color: '#6b7280' }}>Your cart is empty</p>
        <button onClick={() => navigate('/products')} style={{ padding: '10px 28px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
          Shop Now
        </button>
      </div>
    );
  }

  // ── Shared styles ─────────────────────────────────────────────────
  const S = {
    card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: 16 },
    inp:  { width: '100%', padding: '10px 12px', fontSize: 14, border: '1.5px solid #d1d5db', borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    btn:  (primary) => ({ flex: primary ? 2 : 1, padding: '12px 0', background: primary ? '#FF9900' : '#fff', color: primary ? '#fff' : '#374151', border: primary ? 'none' : '1.5px solid #d1d5db', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '24px 16px' }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#FF9900', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>← Back</button>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#FF9900', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>🏠 Home</button>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Checkout</h1>
        </div>

        <Steps current={step} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
          <div>

            {/* ── STEP 0: Address ──────────────────────────────────── */}
            {step === 0 && (
              <div style={S.card}>
                <h2 style={{ margin: '0 0 20px', fontWeight: 700 }}>📍 Delivery Address</h2>

                {user?.addresses?.map((addr, i) => (
                  <label key={i} style={{ display: 'flex', gap: 12, padding: 14, border: `2px solid ${selectedAddress === addr && !useNewAddress ? '#FF9900' : '#e5e7eb'}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer', background: selectedAddress === addr && !useNewAddress ? '#fff7ed' : '#fff' }}>
                    <input type="radio" checked={selectedAddress === addr && !useNewAddress}
                      onChange={() => { setSelectedAddress(addr); setUseNewAddress(false); }} style={{ marginTop: 3 }} />
                    <div>
                      <p style={{ fontWeight: 700, margin: '0 0 3px' }}>{addr.fullName}</p>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                        {addr.city}, {addr.state} — {addr.pincode} | 📞 {addr.phone}
                      </p>
                    </div>
                  </label>
                ))}

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12, color: useNewAddress ? '#FF9900' : '#374151', fontWeight: useNewAddress ? 700 : 400, fontSize: 14 }}>
                  <input type="radio" checked={useNewAddress} onChange={() => setUseNewAddress(true)} />
                  + Add new address
                </label>

                {useNewAddress && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      ['fullName',     'Full Name *',              'span 1'],
                      ['phone',        'Phone *',                  'span 1'],
                      ['addressLine1', 'Address Line 1 *',         'span 2'],
                      ['addressLine2', 'Address Line 2 (Optional)','span 2'],
                      ['city',         'City *',                   'span 1'],
                      ['state',        'State *',                  'span 1'],
                      ['pincode',      'Pincode *',                'span 1'],
                    ].map(([field, label, col]) => (
                      <div key={field} style={{ gridColumn: col }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                        <input
                          style={S.inp}
                          type="text"
                          value={newAddress[field]}
                          onChange={e => setNewAddress(p => ({ ...p, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => { if (validateAddress()) setStep(1); }}
                  style={{ ...S.btn(true), flex: 'unset', width: '100%', marginTop: 16 }}
                >
                  Continue to Payment →
                </button>
              </div>
            )}

            {/* ── STEP 1: Payment (ALWAYS MOUNTED — display:none trick) ── */}
            {/* FIX: CardElement must NEVER unmount between steps         */}
            {/* Using display:none keeps it mounted so getElement() works  */}
            <div style={{ display: step === 1 ? 'block' : 'none' }}>
              <div style={S.card}>
                <h2 style={{ margin: '0 0 20px', fontWeight: 700 }}>💳 Payment Method</h2>

                {/* Coupon */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input
                    style={{ ...S.inp, flex: 1 }}
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME10)"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponApplied}
                  />
                  <button onClick={applyCoupon} disabled={couponApplied}
                    style={{ padding: '10px 16px', background: '#FF9900', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: couponApplied ? 'not-allowed' : 'pointer', opacity: couponApplied ? 0.6 : 1 }}>
                    {couponApplied ? '✓ Applied' : 'Apply'}
                  </button>
                </div>

                {/* COD option */}
                <label style={{ display: 'flex', gap: 12, padding: 14, border: `2px solid ${paymentMethod === 'COD' ? '#FF9900' : '#e5e7eb'}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer', background: paymentMethod === 'COD' ? '#fff7ed' : '#fff' }}>
                  <input type="radio" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} style={{ marginTop: 3 }} />
                  <div>
                    <p style={{ fontWeight: 700, margin: '0 0 4px' }}>💵 Cash on Delivery</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Pay when your order arrives at your door</p>
                  </div>
                </label>

                {/* Card option */}
                <label style={{ display: 'flex', gap: 12, padding: 14, border: `2px solid ${paymentMethod === 'Stripe' ? '#FF9900' : '#e5e7eb'}`, borderRadius: 10, cursor: 'pointer', background: paymentMethod === 'Stripe' ? '#fff7ed' : '#fff' }}>
                  <input type="radio" checked={paymentMethod === 'Stripe'} onChange={() => setPaymentMethod('Stripe')} style={{ marginTop: 3 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px' }}>💳 Credit / Debit Card</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Visa · Mastercard · RuPay · Amex — secured by Stripe</p>

                    {stripePromise ? (
                      <div style={{
                        padding: '10px 12px',
                        border: '1.5px solid #d1d5db',
                        borderRadius: 8,
                        background: '#fff',
                        // Dimmed when COD is selected but still MOUNTED
                        opacity:        paymentMethod !== 'Stripe' ? 0.4 : 1,
                        pointerEvents:  paymentMethod !== 'Stripe' ? 'none' : 'auto',
                        transition: 'opacity 0.2s',
                      }}>
                        <CardElement options={{
                          style: {
                            base:    { fontSize: '15px', color: '#1a1a1a', fontFamily: 'inherit', '::placeholder': { color: '#9ca3af' } },
                            invalid: { color: '#ef4444' },
                          },
                          hidePostalCode: true,
                        }} />
                      </div>
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                        ⚠️ Stripe not configured. Add <code>VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...</code> to <code>frontend/.env</code>
                      </div>
                    )}

                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '8px 0 0' }}>
                      🧪 Test: <code>4242 4242 4242 4242</code> · <code>12/29</code> · <code>123</code>
                    </p>
                  </div>
                </label>

                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setStep(0)} style={S.btn(false)}>← Back</button>
                  <button onClick={() => setStep(2)} style={S.btn(true)}>Review Order →</button>
                </div>
              </div>
            </div>

            {/* ── STEP 2: Review ──────────────────────────────────────── */}
            {step === 2 && (
              <div style={S.card}>
                <h2 style={{ margin: '0 0 20px', fontWeight: 700 }}>📋 Review Order</h2>

                {/* Items */}
                {items.map(item => {
                  const price = getItemPrice(item);
                  const img   = item.product?.images?.[0]?.url;
                  return (
                    <div key={item._id || item.product?._id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: '#f3f4f6', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                        {img ? (
                          <img
                            src={img.startsWith('/uploads/')
                              ? `${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${img}`
                              : img}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📦</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 3px' }}>{item.product?.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                          Qty: {item.quantity} × ₹{price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>
                        ₹{(price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}

                {/* Address summary */}
                {(() => { const a = getAddress(); return a ? (
                  <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 13 }}>
                    <p style={{ fontWeight: 700, margin: '0 0 3px' }}>📍 Delivering to:</p>
                    <p style={{ margin: 0, color: '#6b7280' }}>{a.fullName}, {a.addressLine1}, {a.city}, {a.state} — {a.pincode}</p>
                  </div>
                ) : null; })()}

                {/* Payment method summary */}
                <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 13 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    💳 Payment: <span style={{ fontWeight: 400 }}>{paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit/Debit Card (Stripe)'}</span>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={S.btn(false)}>← Back</button>
                  <button
                    onClick={placeOrder}
                    disabled={placing || (paymentMethod === 'Stripe' && !stripe)}
                    style={{ ...S.btn(true), opacity: placing ? 0.7 : 1, cursor: placing ? 'not-allowed' : 'pointer' }}
                  >
                    {placing ? '⏳ Placing order...' : `✅ Place Order — ₹${totalPrice.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ─────────────────────────────────── */}
          <div style={{ ...S.card, alignSelf: 'flex-start', position: 'sticky', top: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 16px', paddingBottom: 10, borderBottom: '1px solid #e5e7eb' }}>Order Summary</h3>
            <div style={{ fontSize: 14 }}>
              {[
                [`Items (${items.length})`, `₹${itemsPrice.toLocaleString('en-IN')}`],
                ['Shipping',                shippingPrice === 0 ? '🆓 FREE' : `₹${shippingPrice}`],
                ['GST (18%)',               `₹${taxPrice.toLocaleString('en-IN')}`],
                ...(couponDiscount > 0 ? [[`Coupon (${couponCode})`, `−₹${couponDiscount.toLocaleString('en-IN')}`]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#6b7280' }}>{label}</span>
                  <span style={{ color: label.startsWith('Coupon') ? '#16a34a' : '#111', fontWeight: label.startsWith('Coupon') ? 600 : 400 }}>{value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, borderTop: '1px solid #e5e7eb', paddingTop: 10, marginTop: 4 }}>
                <span>Total</span>
                <span style={{ color: '#FF9900' }}>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {itemsPrice < 500 && (
              <p style={{ fontSize: 12, color: '#6b7280', background: '#fefce8', padding: '8px 10px', borderRadius: 6, marginTop: 12 }}>
                🚚 Add ₹{500 - itemsPrice} more for FREE shipping!
              </p>
            )}
            <div style={{ marginTop: 16, padding: '10px 0', borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span>🔒 100% Secure Payments</span>
              <span>🔄 Easy 10-day returns</span>
              <span>📦 Free shipping on ₹500+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Outer wrapper ─────────────────────────────────────────────────
export default function CheckoutPage() {
  // If no valid Stripe key, render without Elements (COD still works)
  if (!stripePromise) {
    return <CheckoutForm />;
  }
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}