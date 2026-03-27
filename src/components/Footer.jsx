import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [settings, setSettings] = useState({
    storeName: 'Shopifix',
    storeTagline: 'Your one-stop destination for home & kitchen appliances. Quality products, great prices, fast delivery.',
    phone: '1800-123-4567',
    email: 'support@shopifix.com',
    facebook: '#',
    twitter: '#',
    instagram: '#',
    youtube: '#',
    copyrightText: '© 2024 Shopifix. All rights reserved.',
  });

  useEffect(() => {
    API.get('/settings')
      .then(r => { if (r.data.settings) setSettings(r.data.settings); })
      .catch(() => {});
  }, []);

  const [subscribing, setSubscribing] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email address'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error('Please enter a valid email address'); return; }
    setSubscribing(true);
    try {
      const res = await API.post('/newsletter/subscribe', { email });
      toast.success(res.data.message || 'Subscribed successfully! 🎉');
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const socialLinks = [
    { key: 'facebook', letter: 'f', url: settings.facebook },
    { key: 'twitter', letter: 't', url: settings.twitter },
    { key: 'instagram', letter: 'i', url: settings.instagram },
    { key: 'youtube', letter: 'y', url: settings.youtube },
  ];

  return (
    <footer>
      {/* Back to top */}
      <div
        className="bg-amazon-dark-light text-white text-center py-3 text-sm cursor-pointer hover:bg-gray-600 transition-colors"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Back to top
      </div>

      {/* Main Footer */}
      <div className="bg-amazon-dark text-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-bold text-white font-serif tracking-tight">
                {settings.storeName || 'Shopifix'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {settings.storeTagline}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.url || '#'}
                  target={s.url && s.url !== '#' ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center hover:bg-amazon-orange transition-colors text-xs uppercase"
                >
                  {s.letter}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Shop By Category</h3>
            <ul className="space-y-2 text-sm">
              {['Refrigerators', 'Washing Machines', 'Microwaves', 'Air Conditioners', 'Dishwashers', 'Vacuum Cleaners'].map((cat) => (
                <li key={cat}>
                  <Link to={`/products?keyword=${cat.toLowerCase()}`} className="hover:text-amazon-orange transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'My Account', href: '/profile' },
                { label: 'My Orders', href: '/orders' },
                { label: 'Wishlist', href: '/wishlist' },
                { label: 'Track Order', href: '/orders' },
                { label: 'Return Policy', href: '#' },
                { label: 'Contact Us', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-amazon-orange transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">Stay Connected</h3>
            <p className="text-sm text-gray-400 mb-3">Subscribe for exclusive deals and offers.</p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-3 py-2 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange"
              />
              <button type="submit" disabled={subscribing} className="bg-amazon-orange hover:bg-amazon-orange-hover text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-60">
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <span>📞</span>
                <span>{settings.phone} (Toll Free)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span>✉️</span>
                <span>{settings.email}</span>
              </div>
              {settings.address && (
                <div className="flex items-start gap-2 text-gray-400">
                  <span>📍</span>
                  <span>{settings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <p>{settings.copyrightText}</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-amazon-orange transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-amazon-orange transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-amazon-orange transition-colors">Sitemap</a>
            </div>
            <div className="flex items-center gap-2">
              <span>Payments:</span>
              {['Visa', 'MC', 'UPI', 'EMI'].map((p) => (
                <span key={p} className="bg-gray-700 px-2 py-0.5 rounded text-xs">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}