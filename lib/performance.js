/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and page performance
 */

// Report Web Vitals to analytics
export function reportWebVitals(metric) {
  if (process.env.NODE_ENV === 'production') {
    // Send to analytics endpoint
    const body = JSON.stringify(metric);
    const url = '/api/analytics/vitals';

    // Use sendBeacon if available, fallback to fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true }).catch(console.error);
    }
  }
}

// Performance observer for monitoring
export function initPerformanceObserver() {
  if (typeof window === 'undefined') return;

  // Observe long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log tasks longer than 50ms
          if (entry.duration > 50) {
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long tasks not supported
    }
  }
}

// Prefetch critical resources
export function prefetchCriticalResources() {
  if (typeof window === 'undefined') return;

  const criticalUrls = [
    '/api/products/best-sellers',
    '/api/categories',
  ];

  criticalUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Lazy load images in viewport
export function setupIntersectionObserver() {
  if (typeof window === 'undefined') return;
  if (!('IntersectionObserver' in window)) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  document.querySelectorAll('img.lazy').forEach(img => {
    imageObserver.observe(img);
  });
}

// Cache management
export const cacheManager = {
  set: (key, data, ttl = 300000) => {
    if (typeof window === 'undefined') return;
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (e) {
      // Storage full, clear old items
      cacheManager.clearExpired();
    }
  },

  get: (key) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (e) {
      return null;
    }
  },

  clearExpired: () => {
    if (typeof window === 'undefined') return;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (Date.now() - item.timestamp > item.ttl) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    });
  }
};
