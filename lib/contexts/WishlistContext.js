'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWishlist = localStorage.getItem('burhan-wishlist');
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (error) {
          console.error('Failed to parse wishlist from localStorage:', error);
          localStorage.removeItem('burhan-wishlist');
        }
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('burhan-wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, isLoaded]);

  const addToWishlist = (product) => {
    setWishlist((prev) => {
      if (prev.find((item) => item._id === product._id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item._id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item._id === productId);
  };

  const toggleWishlist = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
