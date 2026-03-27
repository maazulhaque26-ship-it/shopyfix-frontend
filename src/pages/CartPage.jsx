import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { updateCartItem, removeFromCart, clearCart } from '../redux/slices/shopSlices';
import { EmptyState } from '../components/index.jsx';
import BackButton from '../components/BackButton.jsx';

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);

  const subtotal = items.reduce((sum, item) => {
    const price = item.product?.discountPrice > 0 ? item.product.discountPrice : item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);
  const shipping = subtotal > 500 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  const handleRemove = async (productId) => {
    await dispatch(removeFromCart(productId));
    toast.success('Item removed');
  };

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    await dispatch(updateCartItem({ itemId, quantity }));
  };

  const handleClear = async () => {
    if (window.confirm('Clear entire cart?')) {
      await dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Add some products to your cart and they will appear here"
          action={<Link to="/products" className="btn-orange">Shop Now</Link>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;
            const price = product.discountPrice > 0 ? product.discountPrice : product.price;

            return (
              <div key={item._id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                <Link to={`/products/${product.slug}`} className="flex-shrink-0 w-24 h-24 border rounded overflow-hidden bg-gray-50">
                  <img
                    src={product.images?.[0]?.url || 'https://placehold.co/96x96/f3f4f6/9ca3af?text=No+Img'}
                    alt={product.name}
                    className="w-full h-full object-contain p-1"
                    onError={e => { e.target.src = 'https://placehold.co/96x96/f3f4f6/9ca3af?text=No+Img'; }}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product.slug}`} className="font-medium text-gray-900 hover:text-amazon-orange transition-colors text-sm line-clamp-2">
                    {product.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>
                  {product.stock > 0 ? (
                    <p className="text-xs text-green-600 mt-0.5">In Stock</p>
                  ) : (
                    <p className="text-xs text-red-500 mt-0.5">Out of Stock</p>
                  )}

                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="flex items-center border border-gray-300 rounded">
                      <button onClick={() => handleQuantityChange(item._id, item.quantity - 1)} className="px-2.5 py-1 hover:bg-gray-100 transition-colors text-lg leading-none">−</button>
                      <span className="px-3 py-1 text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)} disabled={item.quantity >= product.stock} className="px-2.5 py-1 hover:bg-gray-100 transition-colors text-lg leading-none disabled:opacity-40">+</button>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-gray-900">₹{(price * item.quantity).toLocaleString('en-IN')}</div>
                      {product.discountPrice > 0 && (
                        <div className="text-xs text-gray-400 line-through">₹{(product.price * item.quantity).toLocaleString('en-IN')}</div>
                      )}
                    </div>
                  </div>

                  <button onClick={() => handleRemove(product._id)} className="text-xs text-red-500 hover:text-red-700 transition-colors mt-2">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <button onClick={handleClear} className="text-sm text-gray-500 hover:text-red-500 transition-colors">
            Clear All
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
            <h2 className="font-semibold text-gray-900 text-lg mb-4 pb-2 border-b">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (18% GST)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              {shipping === 0 && (
                <p className="text-xs text-green-600">🎉 You saved ₹49 on shipping!</p>
              )}
            </div>

            <button
              onClick={() => {
                if (!user) {
                  toast.error('⚠️ Please login first to proceed to checkout!', {
                    position: 'top-center',
                    autoClose: 3000,
                  });
                  setTimeout(() => navigate('/login'), 1500);
                } else {
                  navigate('/checkout');
                }
              }}
              className="w-full btn-orange py-3 mt-4 text-base font-semibold"
            >
              {user ? 'Proceed to Checkout' : '🔐 Login to Checkout'}
            </button>

            <Link to="/products" className="block text-center text-sm text-amazon-blue hover:underline mt-3">
              ← Continue Shopping
            </Link>

            {/* Trust badges */}
            <div className="mt-4 pt-4 border-t space-y-1.5 text-xs text-gray-500">
              <div>🔒 Secure Checkout — SSL Encrypted</div>
              <div>🔄 Easy 10-day returns</div>
              <div>🚚 Free delivery on orders ₹500+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}