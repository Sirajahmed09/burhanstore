/**
 * Pakistani Phone Number Normalization & Validation Utility.
 *
 * Accepts varied inputs:
 * - 03150693148
 * - 0315-0693148
 * - +92 315 0693148
 * - 0092 315 0693148
 * - 923150693148
 * - 0315 0693148
 *
 * Normalizes to standard domestic format: 03XXXXXXXXX (11 digits)
 */

export function normalizePakistaniPhone(input) {
  if (!input || typeof input !== 'string') return null;

  // Strip all whitespace, hyphens, brackets, dots
  let digits = input.trim().replace(/[\s\-\(\)\.]/g, '');

  // Strip international prefix to convert to domestic leading 0
  if (digits.startsWith('+92')) {
    digits = '0' + digits.slice(3);
  } else if (digits.startsWith('0092')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('92') && digits.length === 12) {
    digits = '0' + digits.slice(2);
  }

  // Domestic Pakistani mobile numbers: 11 digits, starts with 03
  if (/^03\d{9}$/.test(digits)) {
    return digits;
  }

  return null;
}

export function isValidPakistaniPhone(input) {
  return normalizePakistaniPhone(input) !== null;
}
