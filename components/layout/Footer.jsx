'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Do not render public footer inside Admin Panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const companyLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Track Order', href: '/track' },
    { name: 'All Products', href: '/shop' },
  ];

  const policyLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'FAQ', href: '/faq' },
  ];

  const categoryLinks = [
    { name: 'Wireless Earbuds', href: '/category/wireless-earbuds' },
    { name: 'Headphones', href: '/category/headphones' },
    { name: 'Chargers', href: '/category/chargers' },
    { name: 'Power Banks', href: '/category/power-banks' },
    { name: 'Smart Watches', href: '/category/smart-watches' },
    { name: 'Gaming Accessories', href: '/category/gaming-accessories' },
  ];

  return (
    <footer className="bg-[#0B0D10] text-white border-t border-white/10">
      <div className="container mx-auto px-4 max-w-6xl py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <div className="font-heading text-2xl font-black tracking-tight mb-3 text-white">
              BURHAN
            </div>
            <p className="text-white/60 text-xs sm:text-sm leading-relaxed mb-6">
              Sound that moves with you. Quiet luxury audio gear, verified wireless earbuds, and everyday mobile tech delivered across Pakistan.
            </p>
            <div className="space-y-2.5 text-xs text-white/80">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-[#B9A47C] flex-shrink-0" />
                <span>0301-3301830 / 0315-0693148</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-[#B9A47C] flex-shrink-0" />
                <span className="break-all">infoburhancommunication@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-[#B9A47C] flex-shrink-0" />
                <span>Karachi, Sindh, Pakistan</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white/90 mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white/90 mb-4">
              Categories
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies & Social Links */}
          <div>
            <h3 className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-white/90 mb-4">
              Support & Policies
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm mb-6">
              {policyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2.5">
              Connect With Us
            </h4>
            <div className="flex space-x-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit BURHAN on Facebook"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit BURHAN on Instagram"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit BURHAN on Twitter"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit BURHAN on YouTube"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="text-white/50 text-xs">
            © {currentYear} BURHAN STORE. All rights reserved. Sound that moves with you.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/70">
            <span className="text-white/40 mr-1">Payment & Assurance:</span>
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md font-medium text-white">Cash on Delivery</span>
            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md font-medium text-white">Debit / Credit Card</span>
            <span className="px-2.5 py-1 bg-white/5 border border-[#B9A47C]/40 text-[#B9A47C] rounded-md font-semibold">
              6-Month Replacement Warranty* (Terms Apply)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
