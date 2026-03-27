import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function BackButton({ to, label }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amazon-orange transition-colors bg-white border border-gray-200 hover:border-amazon-orange px-3 py-1.5 rounded-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amazon-orange transition-colors bg-white border border-gray-200 hover:border-amazon-orange px-3 py-1.5 rounded-lg"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Home
      </Link>

      {to && label && (
        <Link
          to={to}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-amazon-orange transition-colors bg-white border border-gray-200 hover:border-amazon-orange px-3 py-1.5 rounded-lg"
        >
          {label}
        </Link>
      )}
    </div>
  );
}