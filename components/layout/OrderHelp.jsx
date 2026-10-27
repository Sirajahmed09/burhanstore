'use client';
import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { getWhatsAppUrl } from '@/lib/utils/whatsapp';
import { trackEvent } from '@/lib/analytics/gtag';
export default function OrderHelp() {
  const pathname = usePathname();
  const { settings } = useStoreSettings();
  if (!pathname || pathname.startsWith('/admin') || !settings?.whatsapp) return null;
  const url = getWhatsAppUrl(settings.whatsapp, 'Hello BURHAN STORE, I need help with a product or placing my order.');
  if (!url) return null;
  const nearCheckout = pathname.startsWith('/shop/') || pathname === '/checkout';
  return <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('support_click', { source: 'order_help', page_path: pathname })} className={`fixed right-4 ${nearCheckout ? 'bottom-24' : 'bottom-5'} z-30 inline-flex items-center gap-2 rounded-full bg-[#171A20] text-white px-4 py-3 shadow-lg border border-white/20 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#B9A47C]`} aria-label="Ask BURHAN STORE for help on WhatsApp"><MessageCircle className="w-4 h-4 text-[#B9A47C]" /><span>Need help?</span></a>;
}
