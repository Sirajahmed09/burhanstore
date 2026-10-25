/**
 * Social Media Validation & Configuration Utilities for BURHAN STORE.
 *
 * Rules:
 * - Must start with https://
 * - Malicious URI schemes (javascript:, data:, vbscript:) are strictly rejected.
 * - Host must match the verified platform domain.
 * - Profile path must not be root-only (e.g. reject https://facebook.com or https://instagram.com/ with no handle).
 */

const PLATFORM_DOMAINS = {
  facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be']
};

export function isValidSocialUrl(platform, rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();

  // Reject malicious schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return false;
  }

  if (!trimmed.startsWith('https://')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;

    const host = parsed.hostname.toLowerCase();
    const validHosts = PLATFORM_DOMAINS[platform.toLowerCase()];
    if (!validHosts) return false;

    const hostMatches = validHosts.includes(host);
    if (!hostMatches) return false;

    // Must have a real path or handle beyond just "/"
    const path = parsed.pathname.replace(/\/+$/, '');
    if (path.length <= 1) {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Filter a settings object to only include verified social links
 */
export function getVerifiedSocialLinks(settings) {
  if (!settings || typeof settings !== 'object') return [];

  const verified = [];
  const platforms = ['instagram', 'facebook', 'tiktok', 'twitter', 'youtube'];

  for (const platform of platforms) {
    const url = settings[platform];
    if (url && isValidSocialUrl(platform, url)) {
      verified.push({
        platform,
        url: url.trim(),
        label: platform.charAt(0).toUpperCase() + platform.slice(1)
      });
    }
  }

  return verified;
}
