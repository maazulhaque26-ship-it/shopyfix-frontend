import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const STATUS_COLOR = { Pending: 'bg-yellow-100 text-yellow-800', Processing: 'bg-blue-100 text-blue-800', Shipped: 'bg-purple-100 text-purple-800', Delivered: 'bg-green-100 text-green-800', Cancelled: 'bg-red-100 text-red-800' };

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await API.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch { toast.error('Order not found'); navigate('/orders'); }
      finally { setLoading(false); }
    };
    fetchOrder();
  }, [id, navigate]);

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const res = await API.put(`/orders/${id}/cancel`);
      setOrder(res.data.order);
      toast.success('Order cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot cancel order'); }
    finally { setCancelling(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-amazon-orange border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return null;

  const stepIdx = STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-amazon-orange hover:underline text-sm">← Back</button>
          <button onClick={() => navigate('/')} className="text-amazon-orange hover:underline text-sm">🏠 Home</button>
          <button onClick={() => navigate('/orders')} className="text-amazon-orange hover:underline text-sm">📋 All Orders</button>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
        </div>

        {/* Status tracker */}
        {order.status !== 'Cancelled' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= stepIdx ? 'bg-amazon-orange text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i < stepIdx ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs mt-1 ${i === stepIdx ? 'text-amazon-orange font-semibold' : 'text-gray-400'}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-1 mx-2 ${i < stepIdx ? 'bg-amazon-orange' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Items */}
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="font-bold text-lg mb-4">Order Items</h2>
              <div className="space-y-3">
                {order.items.map(item => (
                  <div key={item._id} className="flex gap-3 items-center">
                    <img src={item.image || 'https://via.placeholder.com/64'} alt={item.name} className="w-16 h-16 object-cover rounded border" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="font-bold text-lg mb-3">📍 Delivery Address</h2>
              <p className="font-semibold">{order.shippingAddress?.fullName}</p>
              <p className="text-gray-600 text-sm">{order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}</p>
              <p className="text-gray-600 text-sm">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
              <p className="text-gray-600 text-sm">📞 {order.shippingAddress?.phone}</p>
            </div>

            {/* Status history */}
            {order.statusHistory?.length > 0 && (
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="font-bold text-lg mb-3">📜 Status History</h2>
                <div className="space-y-2">
                  {[...order.statusHistory].reverse().map((h, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[h.status] || 'bg-gray-100 text-gray-600'}`}>{h.status}</span>
                      {h.note && <span className="text-gray-600">{h.note}</span>}
                      {h.trackingId && <span className="text-blue-600">Tracking: {h.trackingId}</span>}
                      <span className="text-gray-400 ml-auto">{new Date(h.updatedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-5">
              <h2 className="font-bold text-lg mb-3">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Items</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">GST</span><span>₹{order.taxPrice?.toLocaleString('en-IN')}</span></div>
                {order.couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon</span><span>-₹{order.couponDiscount?.toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-amazon-orange">₹{order.totalPrice?.toLocaleString('en-IN')}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Payment</span><span className="font-medium">{order.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[order.status] || ''}`}>{order.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Payment</span><span className={order.paymentStatus === 'Paid' ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>{order.paymentStatus}</span></div>
              {order.trackingId && <div className="flex justify-between"><span className="text-gray-600">Tracking ID</span><span className="text-blue-600 font-medium">{order.trackingId}</span></div>}
            </div>

            {['Pending', 'Processing'].includes(order.status) && (
              <button onClick={cancelOrder} disabled={cancelling} className="w-full border border-red-300 text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50">
                {cancelling ? 'Cancelling...' : '✕ Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}