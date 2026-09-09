'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-burhan-background pt-24 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="font-heading text-3xl font-bold text-burhan-primary mb-3">
          Something went wrong
        </h1>

        <p className="text-burhan-text-secondary mb-8">
          An unexpected error occurred. Please try again or return to the home page.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center space-x-2 bg-burhan-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-burhan-secondary transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-white text-burhan-primary border border-gray-200 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
