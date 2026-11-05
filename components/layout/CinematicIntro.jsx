'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

const COMPLETION_KEY = 'burhan-cinematic-intro-seen';
const DURATION = 2200;
const ease = [0.22, 1, 0.36, 1];

export default function CinematicIntro() {
  const dialogRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const dismiss = useCallback(() => {
    try { window.sessionStorage.setItem(COMPLETION_KEY, 'true'); } catch { /* Optional storage. */ }
    setVisible(false);
  }, []);

  useEffect(() => {
    // Respect reduced motion before presenting any animated frame.
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let seen = false;
    try { seen = window.sessionStorage.getItem(COMPLETION_KEY) === 'true'; } catch { /* Optional storage. */ }
    if (!seen && !preference.matches) setVisible(true);
    const onPreference = (event) => { if (event.matches) dismiss(); };
    preference.addEventListener('change', onPreference);
    return () => preference.removeEventListener('change', onPreference);
  }, [dismiss]);

  useEffect(() => {
    if (!visible) return undefined;
    const dialog = dialogRef.current;
    // Native modal keeps keyboard focus inside and the storefront inert.
    if (!dialog || typeof dialog.showModal !== 'function') { dismiss(); return undefined; }
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(dismiss, DURATION);
    return () => {
      window.clearTimeout(timer);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <dialog ref={dialogRef} aria-labelledby="cinematic-intro-title" aria-describedby="cinematic-intro-description"
      onCancel={(event) => { event.preventDefault(); dismiss(); }}
      className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-transparent">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: DURATION / 1000, times: [0, 0.1, 0.84, 1] }}
        className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#080a0d] px-6 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(185,164,124,0.13),transparent_62%)]" />
        <motion.div aria-hidden="true" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.65, 0], scale: 1.2 }}
          transition={{ duration: 2, ease }}
          className="pointer-events-none absolute h-[min(80vw,520px)] w-[min(80vw,520px)] rounded-full border border-[#B9A47C]/20" />
        <motion.div aria-hidden="true" initial={{ x: '-100%', opacity: 0 }} animate={{ x: '100%', opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, delay: 0.15, ease }}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(185,164,124,0.12)_50%,transparent_65%)]" />
        <div className="relative flex w-full max-w-xl flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, ease }}
            className="mb-7 rounded-2xl border border-[#B9A47C]/25 bg-white/[0.02] p-3 shadow-[0_0_60px_rgba(185,164,124,0.08)]">
            <Image src="/brand/burhan-symbol.webp" alt="" width={64} height={64} priority className="rounded-lg" />
          </motion.div>
          <div className="overflow-hidden pb-2">
            <motion.p id="cinematic-intro-title" initial={{ y: '110%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.16, ease }}
              className="pl-[0.15em] font-heading text-[clamp(2.5rem,11vw,5.5rem)] font-semibold leading-none tracking-[0.15em] text-[#f3eee5]">
              BURHAN
            </motion.p>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-3 pl-[0.6em] text-[10px] font-medium uppercase tracking-[0.6em] text-[#B9A47C] sm:text-xs">STORE</motion.p>
          <motion.div aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.35, ease }}
            className="my-7 h-px w-24 bg-gradient-to-r from-transparent via-[#B9A47C]/70 to-transparent" />
          <motion.p id="cinematic-intro-description" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease }} className="text-sm font-light tracking-[0.06em] text-[#c5c3bf] sm:text-base">
            Sound that moves with you.
          </motion.p>
        </div>
        <button type="button" onClick={dismiss}
          className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 min-h-11 rounded-full border border-white/20 px-5 py-2 text-xs tracking-wide text-white/80 transition-colors hover:border-[#B9A47C] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B9A47C]">
          Skip Intro <span aria-hidden="true" className="ml-2">→</span>
        </button>
        <motion.div aria-hidden="true" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: DURATION / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-px w-full origin-left bg-[#B9A47C]/60" />
      </motion.div>
    </dialog>
  );
}
