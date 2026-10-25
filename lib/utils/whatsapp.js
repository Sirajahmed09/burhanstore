/**
 * Centralized WhatsApp utilities for BURHAN STORE.
 *
 * WhatsApp wa.me links require standard international format digits
 * without leading zeros, plus signs, or hyphens.
 * e.g., Pakistani numbers like 0315-0693148 or +92 315 0693148 normalize to 923150693148.
 */

export function normalizeWhatsAppNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';

  // Pakistani numbers:
  // Starts with 03 (e.g. 03150693148 -> 923150693148)
  if (digits.startsWith('03') && digits.length === 11) {
    return '92' + digits.slice(1);
  }

  // Starts with 923 and is 12 digits (e.g. 923150693148)
  if (digits.startsWith('923') && digits.length === 12) {
    return digits;
  }

  // Starts with 00923 (e.g. 00923150693148)
  if (digits.startsWith('00923') && digits.length === 14) {
    return digits.slice(2);
  }

  // Starts with 3 and is 10 digits (e.g. 3150693148 -> 923150693148)
  if (digits.startsWith('3') && digits.length === 10) {
    return '92' + digits;
  }

  // Valid international numbers (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return '';
}

export function getWhatsAppUrl(phone, message = '') {
  const cleanNumber = normalizeWhatsAppNumber(phone);
  if (!cleanNumber) return null;

  const baseUrl = `https://wa.me/${cleanNumber}`;
  if (message && typeof message === 'string' && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}

export function formatDisplayPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('03')) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.length === 12 && digits.startsWith('92')) {
    return `0${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return String(phone).trim();
}
