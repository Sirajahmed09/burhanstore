'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingBag, Heart, Menu, X, Truck, ShieldCheck } from 'lucide-react';
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
    { name: 'Shop', href: '/shop' },
    { name: 'Track Order', href: '/track' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      {/* Top Announcement Bar - Quiet Luxury Obsidian */}
      <div className="bg-[#0B0D10] text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center space-x-2 border-b border-white/5">
        <span className="flex items-center space-x-1.5 text-[#B9A47C]">
          <Truck className="w-3.5 h-3.5" />
          <span>Nationwide Cash on Delivery Across Pakistan</span>
        </span>
        <span className="hidden sm:inline text-white/30">·</span>
        <span className="hidden sm:inline text-white/80">
          Direct Store Support
        </span>
        <span className="hidden md:inline text-white/30">·</span>
        <span className="hidden md:inline text-emerald-400/90 font-medium">
          Delivery Guidance
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div
        className={`bg-[#F4F2ED]/95 backdrop-blur-md border-b transition-all duration-200 ${
          isScrolled
            ? 'border-[#E2DDD5] shadow-sm py-0'
            : 'border-[#EAE6DF] py-0.5'
        }`}
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Brand Logo - Quiet Luxury Wordmark */}
            <Link href="/" className="flex items-center space-x-2.5 group">
              <span className="font-heading text-xl sm:text-2xl font-black tracking-tight text-[#171A20] group-hover:text-[#B9A47C] transition-colors">
                BURHAN
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-[#5A606A] border-l border-[#D6D1C7] pl-2 uppercase tracking-[0.2em]">
                Store
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-[#171A20] bg-white border border-[#E2DDD5] shadow-2xs'
                        : 'text-[#5A606A] hover:text-[#171A20] hover:bg-white/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Search Toggle Button */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#171A20] hover:bg-white/80 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
                aria-label="Search products"
              >
                <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Wishlist Button */}
              <Link
                href="/wishlist"
                className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#171A20] hover:bg-white/80 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
                aria-label={`Wishlist with ${wishlist.length} items`}
              >
                <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-[#171A20] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button */}
              <Link
                href="/cart"
                className="relative flex items-center space-x-1.5 sm:space-x-2 bg-[#171A20] text-white hover:bg-[#0B0D10] transition-colors px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
                aria-label={`Shopping cart with ${getCartCount()} items`}
              >
                <ShoppingBag className="w-4 h-4 text-[#B9A47C]" />
                <span className="hidden sm:inline">Cart</span>
                {getCartCount() > 0 && (
                  <span className="bg-[#B9A47C] text-[#0B0D10] text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-4 text-center leading-none">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Mobile Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-9 h-9 flex items-center justify-center text-[#171A20] hover:bg-white/80 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
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
                className="overflow-hidden border-t border-[#E2DDD5]"
              >
                <form onSubmit={handleSearchSubmit} className="py-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search audio gear, wireless earbuds, accessories..."
                      className="w-full bg-white border border-[#D6D1C7] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#171A20] placeholder-[#5A606A] focus:outline-none focus:ring-2 focus:ring-[#B9A47C]"
                      autoFocus
                    />
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#5A606A]" />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[#E2DDD5] bg-[#F4F2ED] px-4 py-4 space-y-1 shadow-lg"
            >
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-[#171A20] bg-white border border-[#E2DDD5]'
                        : 'text-[#5A606A] hover:text-[#171A20] hover:bg-white/60'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
