'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.user) {
        // Successfully logged in
        window.location.href = '/admin/dashboard'; // Force navigation
      } else {
        setError('Login failed - no user data received');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-burhan-primary via-slate-800 to-burhan-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-burhan-secondary rounded-full mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-burhan-primary mb-2">
              Burhan Admin
            </h1>
            <p className="text-burhan-text-secondary">
              Sign in to access the admin panel
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-burhan-error/10 border border-burhan-error text-burhan-error rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-burhan-text-primary font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="admin@burhan.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-burhan-text-primary font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-burhan-primary text-white py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-burhan-text-secondary text-center">
              <strong>Default Credentials:</strong><br />
              Email: admin@burhan.com<br />
              Password: Admin@123
            </p>
          </div>

          {/* Back to Store */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-burhan-secondary hover:text-burhan-primary font-semibold text-sm"
            >
              ← Back to Store
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
