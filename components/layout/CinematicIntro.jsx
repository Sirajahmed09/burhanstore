'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const COMPLETION_KEY = 'burhan-cinematic-intro-seen';
const FALLBACK_PRODUCT = {
  name: 'BURHAN Pro 2',
  price: null,
  oldPrice: null,
  image: '/images/burhan_pro2_earbuds.jpg',
};

function readCompletionState() {
  try {
    return window.sessionStorage.getItem(COMPLETION_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberCompletion() {
  try {
    window.sessionStorage.setItem(COMPLETION_KEY, 'true');
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

function formatPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? `PKR ${value.toLocaleString()}`
    : null;
}

export default function CinematicIntro({ product }) {
  const reducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const displayProduct = useMemo(() => {
    const candidate = product && typeof product === 'object' ? product : {};
    const image = typeof candidate.image === 'string' && candidate.image.startsWith('/images/')
      ? candidate.image
      : FALLBACK_PRODUCT.image;

    return {
      name: typeof candidate.name === 'string' && candidate.name.trim()
        ? candidate.name.trim()
        : FALLBACK_PRODUCT.name,
      price: candidate.price,
      oldPrice: candidate.oldPrice,
      image,
    };
  }, [product]);

  useEffect(() => {
    setHasMounted(true);
    if (readCompletionState()) {
      setIsVisible(false);
      return undefined;
    }

    if (reducedMotion) {
      rememberCompletion();
      setIsVisible(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      rememberCompletion();
      setIsVisible(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  const dismiss = () => {
    rememberCompletion();
    setIsVisible(false);
  };

  const price = formatPrice(displayProduct.price);
  const oldPrice = displayProduct.oldPrice > displayProduct.price && price
    ? formatPrice(displayProduct.oldPrice) : null;

  if (!hasMounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="cinematic-intro"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cinematic-intro-title"
          aria-describedby="cinematic-intro-description"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reducedMotion ? 0 : 0.3 } }}
          style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
          className="fixed inset-0 z-[9999] overflow-hidden bg-[#111315] text-white"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(6,182,212,0.14),transparent_42%)]" aria-hidden="true" />

          <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
            <motion.div
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.7, ease: 'easeOut' }}
              className="flex max-w-xl flex-col items-center"
            >
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.42em] text-cyan-400" aria-label="BURHAN brand">
                BURHAN
              </p>

              <div className="relative mb-7 h-40 w-56 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-2xl shadow-cyan-950/30 sm:h-48 sm:w-72">
                <Image
                  src={displayProduct.image}
                  alt={`${displayProduct.name} product preview`}
                  fill
                  priority
                  sizes="(max-width: 640px) 224px, 288px"
                  className="object-cover"
                />
              </div>

              <h2 id="cinematic-intro-title" className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
                BURHAN
              </h2>
              <p id="cinematic-intro-description" className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
                Meet {displayProduct.name}. Premium sound, thoughtfully made for your everyday.
              </p>

              {(price || oldPrice) && (
                <div role="status" aria-live="polite" className="mt-5 flex items-center gap-3 text-sm">
                  {price && <span className="font-semibold text-cyan-300">{price}</span>}
                  {oldPrice && <span className="text-slate-500 line-through">{oldPrice}</span>}
                </div>
              )}
            </motion.div>

            <button
              type="button"
              onClick={dismiss}
              className="absolute bottom-7 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#111315]"
            >
              Skip Intro
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
