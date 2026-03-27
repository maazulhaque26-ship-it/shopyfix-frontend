// Utility to fix image URLs
// Local uploads are stored as /uploads/filename.jpg
// They need to be served from the backend: http://localhost:5000/uploads/filename.jpg

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'https://shopyfix-backend.onrender.com';

export function getImageUrl(url) {
  if (!url) return null;
  // Already a full URL (http/https) or placeholder
  if (url.startsWith('http')) return url;
  // Local upload path — prefix with backend URL
  if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
  return url;
}

export const PLACEHOLDER = 'https://via.placeholder.com/400x400?text=No+Image';

export function imgSrc(url) {
  return getImageUrl(url) || PLACEHOLDER;
}