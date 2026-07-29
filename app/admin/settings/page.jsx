'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Save, Globe, Image, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // Business Info
    businessName: 'Burhan',
    tagline: 'Powering Your Digital Lifestyle',
    logo: '',
    favicon: '',
    
    // Contact
    phone: '03013301830',
    whatsapp: '03150693148',
    email: 'infoburhancommunication@gmail.com',
    address: 'Karachi, Sindh, Pakistan',
    
    // Social Media
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    
    // SEO
    seoTitle: 'Burhan - Powering Your Digital Lifestyle',
    seoDescription: 'Premium consumer electronics and mobile accessories in Pakistan',
    seoKeywords: 'burhan, electronics, pakistan, earbuds, headphones',
    
    // Analytics
    googleAnalyticsId: '',
    googleTagManagerId: '',
    metaPixelId: '',
    tiktokPixelId: '',
    
    // Ecommerce
    currency: 'PKR',
    shippingFee: 200,
    taxRate: 0,
    
    // Features
    maintenanceMode: false,
    loadingAnimation: true,
    newsletterEnabled: false,
    reviewsEnabled: true,
    wishlistEnabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...settings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-burhan-primary mb-2">
              Site Settings
            </h1>
            <p className="text-gray-600">Configure your store settings</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-burhan-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-burhan-primary mb-4 flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Business Information</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={settings.logo}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Favicon URL
                </label>
                <input
                  type="url"
                  value={settings.favicon}
                  onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-burhan-primary mb-4 flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Contact Information</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-burhan-primary mb-4">
              Social Media Links
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2 flex items-center space-x-2">
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </label>
                <input
                  type="url"
                  value={settings.facebook}
                  onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://facebook.com/burhan"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2 flex items-center space-x-2">
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </label>
                <input
                  type="url"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://instagram.com/burhan"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2 flex items-center space-x-2">
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </label>
                <input
                  type="url"
                  value={settings.twitter}
                  onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://twitter.com/burhan"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2 flex items-center space-x-2">
                  <Youtube className="w-4 h-4" />
                  <span>YouTube</span>
                </label>
                <input
                  type="url"
                  value={settings.youtube}
                  onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://youtube.com/@burhan"
                />
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-burhan-primary mb-4">
              Analytics & Tracking
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={settings.googleAnalyticsId}
                  onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={settings.googleTagManagerId}
                  onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  value={settings.metaPixelId}
                  onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="Facebook Pixel ID"
                />
              </div>
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={settings.tiktokPixelId}
                  onChange={(e) => setSettings({ ...settings, tiktokPixelId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="TikTok Pixel ID"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-burhan-primary mb-4">
              Features & Options
            </h2>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.loadingAnimation}
                  onChange={(e) => setSettings({ ...settings, loadingAnimation: e.target.checked })}
                  className="w-5 h-5 text-burhan-secondary rounded"
                />
                <span className="text-burhan-text-primary font-semibold">Enable Loading Animation</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 text-burhan-secondary rounded"
                />
                <span className="text-burhan-text-primary font-semibold">Maintenance Mode</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.newsletterEnabled}
                  onChange={(e) => setSettings({ ...settings, newsletterEnabled: e.target.checked })}
                  className="w-5 h-5 text-burhan-secondary rounded"
                />
                <span className="text-burhan-text-primary font-semibold">Enable Newsletter</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.reviewsEnabled}
                  onChange={(e) => setSettings({ ...settings, reviewsEnabled: e.target.checked })}
                  className="w-5 h-5 text-burhan-secondary rounded"
                />
                <span className="text-burhan-text-primary font-semibold">Enable Reviews</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wishlistEnabled}
                  onChange={(e) => setSettings({ ...settings, wishlistEnabled: e.target.checked })}
                  className="w-5 h-5 text-burhan-secondary rounded"
                />
                <span className="text-burhan-text-primary font-semibold">Enable Wishlist</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button (Bottom) */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-burhan-primary text-white px-8 py-4 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
