/** Validation helpers for shipment details attached when an order ships. */

const MIN_COURIER_LENGTH = 2;
const MAX_COURIER_LENGTH = 100;
const MAX_TRACKING_LENGTH = 100;

function isPrivateOrLocalHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host === 'localhost.localdomain' || host.endsWith('.localhost')) {
    return true;
  }

  // Reject IPv4 loopback, private, link-local, and metadata ranges.
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4) return host === '::1' || host.startsWith('fc') || host.startsWith('fd');

  const octets = ipv4.slice(1).map(Number);
  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 0)
  );
}

/**
 * Accept only absolute HTTPS URLs to a public host. This prevents javascript,
 * data, HTTP, local-network, and credential-bearing URLs from being stored as
 * tracking links.
 */
export function isTrustedHttpsUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false;

  try {
    const url = new URL(value.trim());
    return (
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !isPrivateOrLocalHostname(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Validate courier, tracking number, and tracking URL as a complete shipment
 * record. Returns field-level errors and a trimmed value for valid input.
 */
export function validateShipmentDetails(details) {
  const errors = {};
  const input = details && typeof details === 'object' ? details : {};
  const courier = typeof input.courier === 'string' ? input.courier.trim() : '';
  const trackingNumber = typeof input.trackingNumber === 'string' ? input.trackingNumber.trim() : '';
  const trackingUrl = typeof input.trackingUrl === 'string' ? input.trackingUrl.trim() : '';

  if (courier.length < MIN_COURIER_LENGTH || courier.length > MAX_COURIER_LENGTH) {
    errors.courier = `Courier must be between ${MIN_COURIER_LENGTH} and ${MAX_COURIER_LENGTH} characters`;
  }
  if (trackingNumber.length === 0 || trackingNumber.length > MAX_TRACKING_LENGTH) {
    errors.trackingNumber = `Tracking number must be between 1 and ${MAX_TRACKING_LENGTH} characters`;
  }
  if (!isTrustedHttpsUrl(trackingUrl)) {
    errors.trackingUrl = 'Tracking URL must be a valid public HTTPS URL';
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    ...(valid ? { value: { courier, trackingNumber, trackingUrl } } : {})
  };
}
