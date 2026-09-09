'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            System Error
          </h1>
          <p className="text-gray-600 mb-6 text-sm">
            A critical error occurred while rendering the application.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 px-6 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Refresh Application
          </button>
        </div>
      </body>
    </html>
  );
}
