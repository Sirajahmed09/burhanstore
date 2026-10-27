 'use client';
import { useEffect, useState } from 'react';
export function useStoreSettings() {
  const [state, setState] = useState({ settings: null, error: '', loading: true });
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    fetch('/api/settings', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load delivery charges. Please refresh and try again.');
        const data = await response.json();
        if (!data.settings) throw new Error('Delivery settings are unavailable. Please refresh.');
        setState({ settings: data.settings, error: '', loading: false });
      })
      .catch(() => setState({ settings: null, error: 'Unable to load delivery charges. Please refresh and try again.', loading: false }))
      .finally(() => clearTimeout(timeout));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);
  return state;
}
