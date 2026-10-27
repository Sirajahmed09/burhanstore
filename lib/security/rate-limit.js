import { createHmac } from 'node:crypto';
import { getCollection } from '../db/mongodb.js';
import { RequestError } from './requests.js';
export async function consumeRateLimit(scope, identifier, limit, windowMs, options = {}) {
  const now = options.now ?? Date.now();
  const col = options.collection || await getCollection('security_rate_limits');
  const key = createHmac('sha256', process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'local-rate-limit').update(`${scope}:${identifier}:${Math.floor(now / windowMs)}`).digest('hex');
  for (let slot = 0; slot < limit; slot++) {
    try { await col.insertOne({ _id: `${key}:${slot}`, expiresAt: new Date((Math.floor(now / windowMs) + 1) * windowMs) }); return; }
    catch (error) { if (error.code !== 11000) throw new RequestError('Please try again shortly', 503); }
  }
  throw new RequestError('Too many attempts. Please wait before trying again.', 429);
}
export function validateOrderLimits(items, total) {
  const units = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const maximumUnits = Number(process.env.MAX_CHECKOUT_UNITS) || 5;
  const maximumTotal = Number(process.env.MAX_CHECKOUT_TOTAL) || 50000;
  if (units > maximumUnits || items.some(item => item.quantity > 3) || total > maximumTotal) throw new RequestError('For bulk orders, please contact our store on WhatsApp.', 400);
}
