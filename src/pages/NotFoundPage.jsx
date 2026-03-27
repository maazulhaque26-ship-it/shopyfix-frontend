import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-9xl font-bold text-gray-200 mb-2 leading-none">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-8">Sorry, we couldn't find the page you're looking for.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="btn-orange px-6 py-2.5">Go Home</Link>
        <Link to="/products" className="btn-outline px-6 py-2.5">Browse Products</Link>
      </div>
    </div>
  );
}