import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ProductCard, EmptyState } from '../components/index.jsx';
import BackButton from '../components/BackButton.jsx';

export default function WishlistPage() {
  const { products } = useSelector(s => s.wishlist);
  const { user } = useSelector(s => s.auth);

  if (!user) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <EmptyState icon="🤍" title="Sign in to view wishlist" message="Save your favourite items and find them here" action={<Link to="/login" className="btn-orange">Sign In</Link>} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <BackButton />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist ({products.length} items)</h1>
      {products.length === 0 ? (
        <EmptyState icon="🤍" title="Your wishlist is empty" message="Tap the heart on any product to save it here" action={<Link to="/products" className="btn-orange">Browse Products</Link>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(product => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </div>
  );
}