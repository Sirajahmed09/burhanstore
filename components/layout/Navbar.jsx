'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, Menu, X, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getCartCount } = useCart();
  const { wishlist } = useWishlist();

  // Do not render public storefront navbar inside Admin Panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/shop' },
    { name: 'Track Order', href: '/track' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      {/* Top Announcement Bar */}
      <div className="bg-slate-950 text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center space-x-2">
        <span className="flex items-center space-x-1 text-cyan-400">
          <Truck className="w-3.5 h-3.5" />
          <span>Nationwide Cash on Delivery Across Pakistan</span>
        </span>
        <span className="hidden sm:inline text-slate-500">·</span>
        <span className="hidden sm:inline text-slate-300">
          6-Month Replacement Warranty*
        </span>
        <span className="hidden md:inline text-slate-500">·</span>
        <span className="hidden md:inline text-emerald-400 font-semibold">
          Open Parcel Verification
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div
        className={`bg-white/95 backdrop-blur-md border-b transition-all duration-200 ${
          isScrolled
            ? 'border-slate-200/90 shadow-xs py-0'
            : 'border-slate-200/60 py-0.5'
        }`}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center space-x-2.5 group">
              <span className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 group-hover:text-cyan-700 transition-colors">
                BURHAN
              </span>
              <span className="hidden lg:inline-block text-[11px] font-semibold text-slate-500 border-l border-slate-200 pl-2.5 uppercase tracking-wider">
                Official Store
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-colors ${
                      isActive
                        ? 'text-cyan-700 bg-cyan-50'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search Toggle Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Search products"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Wishlist Button */}
              <Link
                href="/wishlist"
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-full transition-colors"
                aria-label={`Wishlist with ${wishlist.length} items`}
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative flex items-center space-x-1.5 sm:space-x-2 bg-slate-950 text-white hover:bg-cyan-600 transition-colors px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-2xs"
                aria-label={`Shopping cart with ${getCartCount()} items`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Cart</span>
                {getCartCount() > 0 && (
                  <span className="bg-cyan-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Mobile Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Search Dropdown Modal */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden border-t border-slate-100"
              >
                <form onSubmit={handleSearchSubmit} className="py-3">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search BURHAN Pro 2, wireless earbuds, accessories..."
                      className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Drawer Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="md:hidden overflow-hidden border-t border-slate-100"
              >
                <div className="py-3 space-y-1">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          isActive
                            ? 'text-cyan-700 bg-cyan-50'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {link.name}
                      </Link>
                    );
                  })}

                  <div className="pt-3 border-t border-slate-100 px-4 text-xs text-slate-500 flex flex-col gap-1">
                    <span className="font-semibold text-slate-700">Fast Nationwide Cash on Delivery</span>
                    <span>Direct WhatsApp: 0315-0693148</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
