'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Save, Globe, Image, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, Video } from 'lucide-react';

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
    tiktok: '',
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
    shippingRules: [],
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
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          ...getAuthHeaders()
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const { _id, ...cleanDataSettings } = data.settings;
          setSettings({ ...settings, ...cleanDataSettings });
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
    setNotification(null);
    try {
      const { _id, ...cleanPayload } = settings;
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(cleanPayload)
      });

      if (response.ok) {
        setNotification({ type: 'success', message: 'Settings saved successfully!' });
      } else {
        const errData = await response.json().catch(() => ({}));
        setNotification({ type: 'error', message: errData.error || 'Failed to save settings' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof SyntaxError ? 'Delivery rules contain invalid JSON. Use the example shown below.' : 'Error saving settings. Please try again.' });
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

        {notification && (
          <div className={`p-4 mb-6 rounded-xl border text-sm font-semibold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-xs ml-4 font-bold hover:underline"
            >
              ✕
            </button>
          </div>
        )}

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

          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 space-y-4">
          <h2 className="font-heading text-xl font-bold">Delivery Charges</h2>
          <label className="block text-sm">Default charge (PKR)
            <input type="number" min="0" step="0.01" value={settings.shippingFee} onChange={e => setSettings({ ...settings, shippingFee: Number(e.target.value) })} className="block w-full border rounded-xl p-3 mt-2" />
          </label>
          <p className="text-sm text-gray-600">Optional location rates. A city rate takes priority over its province rate. Leave city blank to cover the whole province.</p>
          {(settings.shippingRules || []).map((rule, index) => (
            <div key={index} className="grid sm:grid-cols-4 gap-3 border rounded-xl p-3">
              <label className="text-sm">Province
                <select aria-label={`Province for rate ${index + 1}`} value={rule.province} onChange={e => setSettings({ ...settings, shippingRules: settings.shippingRules.map((entry, i) => i === index ? { ...entry, province: e.target.value } : entry) })} className="block w-full border rounded-lg p-2 mt-1">
                  <option value="">Select province</option>
                  {['Sindh', 'Punjab', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Kashmir', 'Islamabad Capital Territory'].map(province => <option key={province}>{province}</option>)}
                </select>
              </label>
              <label className="text-sm">City (optional)
                <input aria-label={`City for rate ${index + 1}`} value={rule.city || ''} onChange={e => setSettings({ ...settings, shippingRules: settings.shippingRules.map((entry, i) => i === index ? { ...entry, city: e.target.value } : entry) })} className="block w-full border rounded-lg p-2 mt-1" placeholder="All cities" />
              </label>
              <label className="text-sm">Charge (PKR)
                <input aria-label={`Charge for rate ${index + 1}`} type="number" min="0" step="0.01" value={rule.fee} onChange={e => setSettings({ ...settings, shippingRules: settings.shippingRules.map((entry, i) => i === index ? { ...entry, fee: Number(e.target.value) } : entry) })} className="block w-full border rounded-lg p-2 mt-1" />
              </label>
              <button type="button" className="text-red-700 underline text-sm" onClick={() => setSettings({ ...settings, shippingRules: settings.shippingRules.filter((_, i) => i !== index) })}>Remove rate</button>
            </div>
          ))}
          <button type="button" className="border rounded-xl px-4 py-2 text-sm font-semibold" onClick={() => setSettings({ ...settings, shippingRules: [...(settings.shippingRules || []), { province: '', city: '', fee: settings.shippingFee }] })}>Add location rate</button>
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
              <div>
                <label className="block text-burhan-text-primary font-semibold mb-2 flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>TikTok</span>
                </label>
                <input
                  type="url"
                  value={settings.tiktok || ''}
                  onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-burhan-secondary"
                  placeholder="https://tiktok.com/@burhan"
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
