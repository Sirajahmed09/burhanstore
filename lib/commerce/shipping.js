export function validateShippingSettings(settings) {
  if (settings.shippingFee !== undefined && (typeof settings.shippingFee !== 'number' || !Number.isFinite(settings.shippingFee) || settings.shippingFee < 0)) return 'Delivery charge must be a non-negative number';
  if (settings.shippingRules !== undefined) {
    if (!Array.isArray(settings.shippingRules) || settings.shippingRules.length > 200) return 'Delivery rules must be an array of at most 200 entries';
    const seen = new Set();
    for (const rule of settings.shippingRules) {
      if (!rule || typeof rule.province !== 'string' || !rule.province.trim() || (rule.city !== undefined && typeof rule.city !== 'string') || typeof rule.fee !== 'number' || !Number.isFinite(rule.fee) || rule.fee < 0) return 'Each delivery rule needs province, optional city, and a non-negative numeric fee';
      const key = rule.province.trim().toLowerCase() + ':' + String(rule.city || '').trim().toLowerCase();
      if (seen.has(key)) return 'Duplicate delivery rule for the same location';
      seen.add(key);
    }
  }
  return null;
}

export function resolveShippingFee(settings = {}, customer = {}) {
  const normalize = value => String(value || '').trim().toLowerCase();
  const province = normalize(customer.province);
  const city = normalize(customer.city);
  const rules = Array.isArray(settings.shippingRules) ? settings.shippingRules : [];
  const applicable = rules.filter(rule => normalize(rule.province) === province && Number.isFinite(rule.fee) && rule.fee >= 0);
  const match = applicable.find(rule => normalize(rule.city) && normalize(rule.city) === city) || applicable.find(rule => !normalize(rule.city));
  return match ? match.fee : (Number.isFinite(Number(settings.shippingFee)) && Number(settings.shippingFee) >= 0 ? Number(settings.shippingFee) : 200);
}
