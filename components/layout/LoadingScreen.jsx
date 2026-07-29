'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen loading before
    const hasSeenLoading = sessionStorage.getItem('burhan-loading-seen');
    
    if (hasSeenLoading) {
      setIsLoading(false);
      return;
    }

    // Step progression: headphone → B → BURHAN → fade out
    const timers = [
      setTimeout(() => setCurrentStep(1), 600),  // Show headphone drawing
      setTimeout(() => setCurrentStep(2), 1400), // Transform to B
      setTimeout(() => setCurrentStep(3), 2000), // Show BURHAN
      setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('burhan-loading-seen', 'true');
      }, 2800) // Fade out
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-burhan-primary"
      >
        <div className="relative">
          {/* Headphone Cable Animation */}
          {currentStep >= 0 && currentStep < 2 && (
            <motion.svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: currentStep >= 0 ? 1 : 0 }}
              className="absolute inset-0"
            >
              {/* Left cable */}
              <motion.path
                d="M30 40 Q20 50 20 70 L20 90"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: currentStep >= 0 ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
              
              {/* Right cable */}
              <motion.path
                d="M90 40 Q100 50 100 70 L100 90"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: currentStep >= 0 ? 1 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut", delay: 0.1 }}
              />
              
              {/* Headband */}
              <motion.path
                d="M30 40 Q60 20 90 40"
                stroke="#06B6D4"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: currentStep >= 0 ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut", delay: 0.3 }}
              />
              
              {/* Left earpiece */}
              <motion.circle
                cx="20"
                cy="70"
                r="12"
                stroke="#06B6D4"
                strokeWidth="3"
                fill="none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: currentStep >= 1 ? 1 : 0, opacity: currentStep >= 1 ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              />
              
              {/* Right earpiece */}
              <motion.circle
                cx="100"
                cy="70"
                r="12"
                stroke="#06B6D4"
                strokeWidth="3"
                fill="none"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: currentStep >= 1 ? 1 : 0, opacity: currentStep >= 1 ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              />
            </motion.svg>
          )}

          {/* Transform to B Monogram */}
          {currentStep >= 2 && currentStep < 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="text-8xl font-heading font-bold text-burhan-accent"
            >
              B
            </motion.div>
          )}

          {/* BURHAN Wordmark */}
          {currentStep >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="font-heading text-5xl font-bold text-white mb-2">
                BURHAN
              </div>
              <div className="text-sm text-burhan-accent tracking-wider">
                Powering Your Digital Lifestyle
              </div>
            </motion.div>
          )}
        </div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: currentStep >= 3 ? 1 : 0 }}
          className="absolute bottom-12 flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-burhan-accent rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
