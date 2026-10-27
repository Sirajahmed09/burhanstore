'use client';
import { useRef, useEffect, useState } from 'react';
import Script from 'next/script';
export default function SecurityCheck({ siteKey, onToken }) {
  const container = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !window.turnstile || !container.current) return;
    const widget = window.turnstile.render(container.current, { sitekey: siteKey, action: 'checkout', callback: value => onTokenRef.current(value), 'expired-callback': () => onTokenRef.current(''), 'error-callback': () => onTokenRef.current('') });
    return () => { if (window.turnstile) window.turnstile.remove(widget); };
  }, [ready, siteKey]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} /><div ref={container} className="my-4" /><p className="text-xs text-slate-600">Complete the security check before placing your order.</p></>;
}
