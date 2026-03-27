import { useSearchParams, useNavigate } from 'react-router-dom';

export default function OrderSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderNumber = params.get('orderNumber');
  const orderId = params.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed! 🎉</h1>
        <p className="text-gray-500 mb-4">Thank you for your purchase.</p>
        {orderNumber && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">Order Number</p>
            <p className="font-bold text-amazon-orange text-lg">{orderNumber}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-8">You can track your order from the Orders page.</p>
        <div className="flex flex-col gap-3">
          {orderId && (
            <button onClick={() => navigate(`/orders/${orderId}`)} className="w-full bg-amazon-orange text-white py-3 rounded-lg font-semibold hover:bg-orange-600">
              📦 Track Order
            </button>
          )}
          <button onClick={() => navigate('/orders')} className="w-full border border-amazon-orange text-amazon-orange py-3 rounded-lg font-semibold hover:bg-orange-50">
            📋 All Orders
          </button>
          <button onClick={() => navigate('/')} className="w-full border border-gray-200 text-gray-600 py-3 rounded-lg hover:bg-gray-50">
            🏠 Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}