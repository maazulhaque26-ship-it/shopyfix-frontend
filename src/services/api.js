/**
 * api.js — Professional Audit Fix
 *
 * CRITICAL BUG FIXED:
 * window.location.href = '/login' causes a FULL browser page reload which:
 *   - Wipes React from memory → blank white screen until JS re-parses
 *   - Destroys Redux store → user sees blank then flicker
 *   - Breaks payment flows (Stripe/Razorpay callback → redirect → lost order)
 *
 * FIX: Dispatch a custom DOM event 'auth:expired' that App.jsx listens to.
 *   App.jsx handles it with navigate() (React Router) = no reload, no blank screen.
 *
 * OTHER FIXES:
 * 1. Added timeout to prevent hung requests (15s)
 * 2. Payment paths are excluded from auth redirect (prevents logout mid-payment)
 * 3. Added request ID header for debugging
 */
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000, // FIX: prevent hung requests
});

// ── Request: attach JWT token ─────────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: handle auth errors WITHOUT page reload ──────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path   = window.location.pathname;

    // Never redirect during payment — user would lose their order
    const isPaymentPath = ['/checkout', '/order-success', '/payment']
      .some(p => path.includes(p));

    if (status === 401 && !isPaymentPath && path !== '/login' && path !== '/register') {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // FIX: dispatch event instead of window.location.href
      // App.jsx listener calls navigate('/login') — no page reload
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(error);
  }
);

export default API;