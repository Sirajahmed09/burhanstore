/**
 * Reliable Client-Side API Utility for Burhan Store
 * - Forces cache-busting (no-store, no-cache, timestamp)
 * - Safely handles non-JSON / HTML error responses (prevents "Unexpected token '<'")
 * - Strictly validates server response and database operation success
 */

export async function apiFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  
  // Cache busting: append timestamp to GET requests to guarantee zero stale cache
  let finalUrl = url;
  if (method === 'GET') {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}_t=${Date.now()}`;
  }

  const defaultHeaders = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (options.body && typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  let res;
  try {
    res = await fetch(finalUrl, {
      ...options,
      cache: 'no-store',
      headers: mergedHeaders,
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message || 'Unable to connect to server'}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('Failed to parse JSON response:', parseErr);
      data = null;
    }
  } else {
    // Received HTML or plain text (e.g. Next.js 404/500 error page or redirect)
    const rawText = await res.text().catch(() => '');
    const cleanText = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
    
    if (!res.ok) {
      throw new Error(cleanText || `Server returned HTML error (${res.status})`);
    }
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed with status ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  if (data && data.success === false) {
    const msg = data.error || data.message || 'Database operation was rejected by server';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const apiGet = (url, headers = {}) => apiFetch(url, { method: 'GET', headers });

export const apiPost = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiPut = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'PUT',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiPatch = (url, body, headers = {}) =>
  apiFetch(url, {
    method: 'PATCH',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

export const apiDelete = (url, headers = {}) =>
  apiFetch(url, {
    method: 'DELETE',
    headers,
  });
