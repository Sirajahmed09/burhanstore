import { MongoClient, ObjectId } from 'mongodb';
import { getSeedCategories, getSeedProducts } from './seedData.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/**
 * Supported MongoDB connection environment variables in strict priority order:
 * 1. MONGODB_URI
 * 2. MONGODB_URL
 * 3. MONGO_URL
 * 4. DATABASE_URL
 */
export const SUPPORTED_MONGO_ENV_VARS = [
  'MONGODB_URI',
  'MONGODB_URL',
  'MONGO_URL',
  'DATABASE_URL'
];

/**
 * Sanitizes MongoDB connection string by masking user credentials.
 * Safe for logging and diagnostic error reports.
 */
export function sanitizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== 'string') return '';
  return rawUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/i, '$1****$2');
}

/**
 * Resolves MongoDB URI according to strict priority order.
 * If a higher-priority variable is present but invalid, it does NOT silently fallback to
 * a lower-priority variable. It returns a sanitized configuration error.
 */
export function resolveMongoUri() {
  for (const envKey of SUPPORTED_MONGO_ENV_VARS) {
    const rawVal = process.env[envKey];
    if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
      const trimmed = rawVal.trim();
      // Validate scheme: must start with mongodb:// or mongodb+srv://
      const isValidScheme = /^mongodb(\+srv)?:\/\//i.test(trimmed);
      if (!isValidScheme) {
        return {
          uri: '',
          envKeyUsed: envKey,
          error: `Invalid MongoDB URI scheme in '${envKey}'. Connection string must start with 'mongodb://' or 'mongodb+srv://'.`,
          sanitizedUri: '',
          isConfigured: true,
          isValid: false
        };
      }
      return {
        uri: trimmed,
        envKeyUsed: envKey,
        error: null,
        sanitizedUri: sanitizeMongoUri(trimmed),
        isConfigured: true,
        isValid: true
      };
    }
  }

  return {
    uri: '',
    envKeyUsed: 'none',
    error: `No MongoDB connection string configured. Supported variables: ${SUPPORTED_MONGO_ENV_VARS.join(', ')}.`,
    sanitizedUri: '',
    isConfigured: false,
    isValid: false
  };
}

export const getMongoUri = () => {
  const resolution = resolveMongoUri();
  return resolution.isValid ? resolution.uri : '';
};

const dbName = process.env.DB_NAME || 'burhanstore';

// Data persistence file paths (with serverless /tmp fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store_data.json');
const TMP_DATA_FILE = path.join('/tmp', 'burhan_store_data.json');

/**
 * Universal ID query helper for both MongoDB and InMemoryCollection
 * Matches string IDs, UUIDs, MongoDB ObjectIds, slugs, and custom IDs.
 */
export function buildIdQuery(id) {
  if (!id) return { _id: id };
  const or = [
    { _id: id },
    { id: id },
    { slug: id }
  ];
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      or.push({ _id: new ObjectId(id) });
    } catch (e) {}
  }
  return { $or: or };
}

// Helper to access nested properties like 'customer.phone'
function getNestedValue(obj, pathKey) {
  if (!obj || !pathKey) return undefined;
  if (!pathKey.includes('.')) return obj[pathKey];
  const parts = pathKey.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Helper to set nested properties
function setNestedValue(obj, pathKey, value) {
  const parts = pathKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

// Check if a document matches a single condition
function matchCondition(docVal, condition) {
  if (condition === null || condition === undefined) {
    return docVal === condition;
  }
  // Support MongoDB ObjectId matching in InMemoryCollection
  if (
    (condition && typeof condition === 'object' && condition._bsontype === 'ObjectId') ||
    (docVal && typeof docVal === 'object' && docVal._bsontype === 'ObjectId')
  ) {
    return String(docVal) === String(condition);
  }
  if (typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date) && !(condition instanceof RegExp)) {
    for (const op of Object.keys(condition)) {
      const target = condition[op];
      if (op === '$regex') {
        const flags = condition.$options || '';
        const re = new RegExp(target, flags);
        if (!re.test(String(docVal || ''))) return false;
      } else if (op === '$gt') {
        if (!(docVal > target)) return false;
      } else if (op === '$gte') {
        if (!(docVal >= target)) return false;
      } else if (op === '$lt') {
        if (!(docVal < target)) return false;
      } else if (op === '$lte') {
        if (!(docVal <= target)) return false;
      } else if (op === '$ne') {
        if (docVal === target || (docVal != null && target != null && String(docVal) === String(target))) return false;
      } else if (op === '$in') {
        if (!Array.isArray(target)) return false;
        const matchesIn = target.some(t => t === docVal || String(t) === String(docVal));
        if (!matchesIn) return false;
      } else if (op === '$nin') {
        if (!Array.isArray(target)) return false;
        const matchesNin = target.some(t => t === docVal || String(t) === String(docVal));
        if (matchesNin) return false;
      }
    }
    return true;
  }
  if (condition instanceof RegExp) {
    return condition.test(String(docVal || ''));
  }
  return docVal === condition || (docVal != null && condition != null && String(docVal) === String(condition));
}

// Match document against MongoDB-style filter
function matchFilter(doc, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) return true;

  for (const key of Object.keys(filter)) {
    if (key === '$or') {
      const orList = filter[key];
      if (Array.isArray(orList)) {
        const matchesAny = orList.some(subFilter => matchFilter(doc, subFilter));
        if (!matchesAny) return false;
      }
      continue;
    }

    if (key === '$and') {
      const andList = filter[key];
      if (Array.isArray(andList)) {
        const matchesAll = andList.every(subFilter => matchFilter(doc, subFilter));
        if (!matchesAll) return false;
      }
      continue;
    }

    const docVal = getNestedValue(doc, key);
    const condition = filter[key];

    if (!matchCondition(docVal, condition)) {
      return false;
    }
  }

  return true;
}

// Safe disk persistence with serverless /tmp fallback - SYNCHRONOUS AND IMMEDIATE
function persistDatabaseToDisk() {
  const collections = globalThis.__BURHAN_DATABASE_COLLECTIONS__;
  if (!collections) return;

  const payload = {};
  for (const [name, col] of collections.entries()) {
    payload[name] = col.data || [];
  }

  const json = JSON.stringify(payload, null, 2);
  let fileMtime = 0;

  // 1. Write to process.cwd()/data/store_data.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, json, 'utf-8');
    try {
      fileMtime = Math.max(fileMtime, fs.statSync(DATA_FILE).mtimeMs);
    } catch (e) {}
  } catch (err) {
    // Expected on read-only serverless filesystems (e.g. Vercel)
  }

  // 2. Also write to /tmp for durability across serverless container reuse
  try {
    fs.writeFileSync(TMP_DATA_FILE, json, 'utf-8');
    try {
      fileMtime = Math.max(fileMtime, fs.statSync(TMP_DATA_FILE).mtimeMs);
    } catch (e) {}
  } catch (tmpErr) {
    // Non-fatal, in-memory collections remain active
  }

  globalThis.__BURHAN_DB_LOADED_MTIME__ = fileMtime || Date.now();
}

function triggerSave() {
  // Always persist immediately so disk reflects real DB state before API response returns
  persistDatabaseToDisk();
}

/**
 * Sync in-memory collections from disk if another worker or process updated disk data
 */
function syncInMemoryCollectionsFromDisk() {
  const collections = globalThis.__BURHAN_DATABASE_COLLECTIONS__;
  if (!collections) return;

  let bestFile = null;
  let bestMtime = 0;

  for (const filePath of [DATA_FILE, TMP_DATA_FILE]) {
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs > bestMtime) {
          bestMtime = stat.mtimeMs;
          bestFile = filePath;
        }
      }
    } catch (e) {}
  }

  const currentLoaded = globalThis.__BURHAN_DB_LOADED_MTIME__ || 0;
  if (!bestFile || bestMtime <= currentLoaded) {
    return;
  }

  try {
    const raw = fs.readFileSync(bestFile, 'utf-8');
    const diskData = JSON.parse(raw);
    if (diskData && typeof diskData === 'object') {
      for (const [name, items] of Object.entries(diskData)) {
        if (collections.has(name)) {
          collections.get(name).data = Array.isArray(items) ? items : [];
        } else {
          collections.set(name, new InMemoryCollection(name, Array.isArray(items) ? items : []));
        }
      }
      globalThis.__BURHAN_DB_LOADED_MTIME__ = bestMtime;
    }
  } catch (err) {
    console.warn('[Burhan Store DB] Could not sync with disk:', err.message);
  }
}

class InMemoryCollection {
  constructor(name, initialData = []) {
    this.name = name;
    this.data = initialData;
  }

  find(filter = {}) {
    const matched = this.data.filter(doc => matchFilter(doc, filter));
    let result = [...matched];

    const cursor = {
      sort: (sortObj = {}) => {
        const keys = Object.keys(sortObj);
        if (keys.length > 0) {
          result.sort((a, b) => {
            for (const key of keys) {
              const dir = sortObj[key] === -1 || sortObj[key] === 'desc' ? -1 : 1;
              const valA = getNestedValue(a, key);
              const valB = getNestedValue(b, key);
              if (valA === valB) continue;
              if (valA === undefined || valA === null) return 1;
              if (valB === undefined || valB === null) return -1;
              
              // Handle date sorting accurately
              const timeA = new Date(valA).getTime();
              const timeB = new Date(valB).getTime();
              if (!isNaN(timeA) && !isNaN(timeB)) {
                return (timeA > timeB ? 1 : -1) * dir;
              }

              if (valA > valB) return dir;
              if (valA < valB) return -dir;
            }
            return 0;
          });
        }
        return cursor;
      },
      skip: (n = 0) => {
        if (n > 0) result = result.slice(n);
        return cursor;
      },
      limit: (n = 0) => {
        if (n > 0) result = result.slice(0, n);
        return cursor;
      },
      project: (projection = {}) => {
        const fields = Object.keys(projection);
        if (fields.length > 0) {
          result = result.map(doc => {
            const projected = { _id: doc._id };
            for (const field of fields) {
              if (projection[field]) {
                projected[field] = getNestedValue(doc, field);
              }
            }
            return projected;
          });
        }
        return cursor;
      },
      toArray: async () => {
        return JSON.parse(JSON.stringify(result));
      },
    };

    return cursor;
  }

  async findOne(filter = {}) {
    const doc = this.data.find(d => matchFilter(d, filter));
    return doc ? JSON.parse(JSON.stringify(doc)) : null;
  }

  async countDocuments(filter = {}) {
    return this.data.filter(doc => matchFilter(doc, filter)).length;
  }

  async insertOne(doc) {
    const newDoc = {
      _id: doc._id || uuidv4(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.push(newDoc);
    triggerSave();
    return { insertedId: newDoc._id, acknowledged: true };
  }

  async insertMany(docs) {
    const insertedIds = {};
    const createdDocs = docs.map((doc, index) => {
      const newDoc = {
        _id: doc._id || uuidv4(),
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      insertedIds[index] = newDoc._id;
      return newDoc;
    });
    this.data.push(...createdDocs);
    triggerSave();
    return { insertedCount: createdDocs.length, insertedIds, acknowledged: true };
  }

  async updateOne(filter, update, options = {}) {
    const doc = this.data.find(d => matchFilter(d, filter));
    if (!doc) {
      if (options && options.upsert) {
        const newDoc = {
          _id: uuidv4(),
          ...filter,
          ...(update.$set || {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.data.push(newDoc);
        triggerSave();
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: newDoc._id, acknowledged: true };
      }
      return { matchedCount: 0, modifiedCount: 0, acknowledged: true };
    }

    if (update.$set) {
      for (const [key, val] of Object.entries(update.$set)) {
        setNestedValue(doc, key, val);
      }
    }
    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        const currentVal = Number(getNestedValue(doc, key)) || 0;
        setNestedValue(doc, key, currentVal + Number(val));
      }
    }
    doc.updatedAt = new Date().toISOString();
    triggerSave();
    return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
  }

  async updateMany(filter, update) {
    let modifiedCount = 0;
    for (const doc of this.data) {
      if (matchFilter(doc, filter)) {
        if (update.$set) {
          for (const [key, val] of Object.entries(update.$set)) {
            setNestedValue(doc, key, val);
          }
        }
        if (update.$inc) {
          for (const [key, val] of Object.entries(update.$inc)) {
            const currentVal = Number(getNestedValue(doc, key)) || 0;
            setNestedValue(doc, key, currentVal + Number(val));
          }
        }
        doc.updatedAt = new Date().toISOString();
        modifiedCount++;
      }
    }
    if (modifiedCount > 0) triggerSave();
    return { matchedCount: modifiedCount, modifiedCount, acknowledged: true };
  }

  async deleteOne(filter) {
    const idx = this.data.findIndex(d => matchFilter(d, filter));
    if (idx !== -1) {
      this.data.splice(idx, 1);
      triggerSave();
      return { deletedCount: 1, acknowledged: true };
    }
    return { deletedCount: 0, acknowledged: true };
  }

  async deleteMany(filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      const count = this.data.length;
      this.data = [];
      triggerSave();
      return { deletedCount: count, acknowledged: true };
    }
    const initialCount = this.data.length;
    this.data = this.data.filter(d => !matchFilter(d, filter));
    const deletedCount = initialCount - this.data.length;
    if (deletedCount > 0) triggerSave();
    return { deletedCount, acknowledged: true };
  }
}

// Global in-memory database store shared across all Next.js API route chunks
function initializeInMemoryCollections() {
  if (globalThis.__BURHAN_DATABASE_COLLECTIONS__ && globalThis.__BURHAN_DATABASE_COLLECTIONS__.size > 0) {
    syncInMemoryCollectionsFromDisk();
    return globalThis.__BURHAN_DATABASE_COLLECTIONS__;
  }

  const collections = new Map();
  globalThis.__BURHAN_DATABASE_COLLECTIONS__ = collections;

  // Check if saved database exists on disk (pick newer file between DATA_FILE and TMP_DATA_FILE)
  let diskData = null;
  let bestFile = null;
  let bestMtime = 0;

  for (const filePath of [DATA_FILE, TMP_DATA_FILE]) {
    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs > bestMtime) {
          bestMtime = stat.mtimeMs;
          bestFile = filePath;
        }
      }
    } catch (e) {}
  }

  if (bestFile) {
    try {
      const raw = fs.readFileSync(bestFile, 'utf-8');
      diskData = JSON.parse(raw);
      globalThis.__BURHAN_DB_LOADED_MTIME__ = bestMtime;
    } catch (e) {
      console.warn('[Burhan Store DB] Could not parse disk data from ' + bestFile);
    }
  }

  if (diskData && typeof diskData === 'object') {
    for (const [name, items] of Object.entries(diskData)) {
      collections.set(name, new InMemoryCollection(name, Array.isArray(items) ? items : []));
    }

    // Ensure essential collections exist
    const essentialCollections = ['categories', 'products', 'admins', 'settings', 'reviews', 'orders', 'approvals', 'audit_logs', 'errors'];
    for (const cName of essentialCollections) {
      if (!collections.has(cName)) {
        collections.set(cName, new InMemoryCollection(cName, []));
      }
    }

    // Ensure default admin exists
    const adminsCol = collections.get('admins');
    if (adminsCol) {
      // Ensure owner siraj@mainadmin exists
      const hasSiraj = adminsCol.data.some(a => (a.email || '').toLowerCase() === 'siraj@mainadmin');
      if (!hasSiraj) {
        adminsCol.data.unshift({
          _id: 'admin-owner-siraj',
          name: 'Siraj Ahmed (Store Owner)',
          email: 'siraj@mainadmin',
          password: '$2a$10$i5EEGpbK71v11OWUrbUvReoj/ICRfnYaT59KfMskeTcWX/5qLV7ES',
          role: 'owner',
          status: 'active',
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        triggerSave();
      }

      if (adminsCol.data.length === 0) {
        adminsCol.data.push(
          {
            _id: 'admin-owner-siraj',
            name: 'Siraj Ahmed (Store Owner)',
            email: 'siraj@mainadmin',
            password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
            role: 'owner',
            status: 'active',
            permissions: ['*'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'admin-burhan-owner',
            name: 'Burhan Store Owner',
            email: 'burhan@store',
            password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
            role: 'owner',
            status: 'active',
            permissions: ['*'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'admin-superadmin',
            name: 'Super Admin',
            email: 'admin@burhan.com',
            password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
            role: 'owner',
            status: 'active',
            permissions: ['*'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
        triggerSave();
      }
    }

    return collections;
  }

  // Seed default data
  const categories = getSeedCategories();
  const products = getSeedProducts();

  for (const cat of categories) {
    cat.productCount = products.filter(p => p.category === cat.name && p.status === 'active' && p.isActive !== false).length;
  }
  for (const p of products) {
    if (!p.status) p.status = 'active';
    if (typeof p.isActive === 'undefined') p.isActive = true;
  }

  const burhanAdmin = {
    _id: 'admin-burhan-owner',
    name: 'Burhan Store Owner',
    email: 'burhan@store',
    password: '$2a$10$TkWPJq8jg0cD7LJ1iwd1UOAOM9PWHxNRxBwZ3b41vdbjO4xpZxI7e',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultAdmin = {
    _id: 'admin-superadmin',
    name: 'Super Admin',
    email: 'admin@burhan.com',
    password: '$2a$10$E66okjRht1PObVKE8mgZd.eBZaQaHSvUMRxfYhEuXSu0Zi2nprgcC',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultSettings = {
    _id: uuidv4(),
    type: 'general',
    storeName: 'Burhan Store',
    email: 'support@burhanstore.com',
    phone: '+92 300 1234567',
    currency: 'PKR',
    currencySymbol: 'Rs.',
    freeShippingThreshold: 5000,
    shippingFee: 200,
    updatedAt: new Date().toISOString(),
  };

  const sampleReviews = [
    {
      _id: uuidv4(),
      productId: products[0]?._id,
      name: 'Ahmed Khan',
      rating: 5,
      comment: 'Super fast delivery and authentic product! Outstanding sound quality and bass.',
      verified: true,
      createdAt: new Date().toISOString(),
    },
    {
      _id: uuidv4(),
      productId: products[1]?._id,
      name: 'Sarah Tariq',
      rating: 5,
      comment: 'Very comfortable to wear for long calls and music sessions. Highly recommended!',
      verified: true,
      createdAt: new Date().toISOString(),
    },
  ];

  collections.set('categories', new InMemoryCollection('categories', categories));
  collections.set('products', new InMemoryCollection('products', products));
  collections.set('admins', new InMemoryCollection('admins', [burhanAdmin, defaultAdmin]));
  collections.set('settings', new InMemoryCollection('settings', [defaultSettings]));
  collections.set('reviews', new InMemoryCollection('reviews', sampleReviews));
  collections.set('orders', new InMemoryCollection('orders', []));
  collections.set('errors', new InMemoryCollection('errors', []));

  persistDatabaseToDisk();
  return collections;
}

// Auto-seed real MongoDB collections if empty (safe, non-destructive)
async function ensureRealMongoSeeded(db) {
  if (globalThis.__BURHAN_MONGO_SEEDED__) return;
  try {
    const productsCol = db.collection('products');
    const categoriesCol = db.collection('categories');
    const adminsCol = db.collection('admins');

    const productCount = await productsCol.countDocuments();
    if (productCount === 0) {
      console.log('[Burhan Store DB] Initializing seed products and categories in MongoDB...');
      const seedCategories = getSeedCategories();
      const seedProducts = getSeedProducts();
      if (seedCategories.length > 0) {
        await categoriesCol.insertMany(seedCategories);
      }
      if (seedProducts.length > 0) {
        await productsCol.insertMany(seedProducts);
      }
    }

    const adminCount = await adminsCol.countDocuments();
    if (adminCount === 0) {
      console.log('[Burhan Store DB] Initializing owner and admins in MongoDB...');
      const sirajOwner = {
        _id: 'admin-owner-siraj',
        name: 'Siraj Ahmed (Store Owner)',
        email: 'siraj@mainadmin',
        password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
        role: 'owner',
        status: 'active',
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const burhanAdmin = {
        _id: 'admin-burhan-owner',
        name: 'Burhan Store Owner',
        email: 'burhan@store',
        password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
        role: 'owner',
        status: 'active',
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const defaultAdmin = {
        _id: 'admin-superadmin',
        name: 'Super Admin',
        email: 'admin@burhan.com',
        password: '$2a$10$c8w109GrzkCvbYuu6bJSWejRMzlK5V3laumpoWcbHTTW5oP6JWvA.',
        role: 'owner',
        status: 'active',
        permissions: ['*'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await adminsCol.insertMany([sirajOwner, burhanAdmin, defaultAdmin]);
    } else {
      // Ensure siraj@mainadmin exists even if other admins exist
      const siraj = await adminsCol.findOne({ email: 'siraj@mainadmin' });
      if (!siraj) {
        await adminsCol.insertOne({
          _id: 'admin-owner-siraj',
          name: 'Siraj Ahmed (Store Owner)',
          email: 'siraj@mainadmin',
          password: '$2a$10$i5EEGpbK71v11OWUrbUvReoj/ICRfnYaT59KfMskeTcWX/5qLV7ES',
          role: 'owner',
          status: 'active',
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Safely ensure essential indexes exist
    try {
      await Promise.all([
        db.collection('orders').createIndex({ createdAt: -1 }),
        db.collection('orders').createIndex({ 'customer.phone': 1 }),
        db.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true }),
        db.collection('products').createIndex({ category: 1 }),
        db.collection('categories').createIndex({ slug: 1 }, { unique: true, sparse: true }),
        db.collection('admins').createIndex({ email: 1 }, { unique: true, sparse: true }),
        db.collection('approvals').createIndex({ status: 1, createdAt: -1 }),
        db.collection('audit_logs').createIndex({ timestamp: -1 }),
      ]);
    } catch (idxErr) {
      // Non-fatal if index already exists
    }

    // Ensure settings record exists for general configuration
    try {
      const settingsCol = db.collection('settings');
      const genSettings = await settingsCol.findOne({ type: 'general' });
      if (!genSettings) {
        await settingsCol.insertOne({
          type: 'general',
          storeName: 'BURHAN STORE',
          email: 'support@burhanstore.com',
          phone: '+92 300 1234567',
          currency: 'PKR',
          currencySymbol: 'Rs.',
          shippingFee: 200,
          freeShippingThreshold: 5000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (secErr) {
      // Non-fatal
    }

    globalThis.__BURHAN_MONGO_SEEDED__ = true;
  } catch (err) {
    console.warn('[Burhan Store DB] Real MongoDB auto-seed notice:', err.message);
  }
}

/**
 * Sanitizes MongoDB error message by removing sensitive connection strings or passwords.
 */
export function sanitizeMongoError(msg) {
  if (!msg || typeof msg !== 'string') return 'Database connection failed';
  return msg.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)[^@]+(@.+)/gi, '$1****$2');
}

export async function connectToDatabase() {
  const resolution = resolveMongoUri();

  // If a variable is configured but invalid, do not silently fallback or ignore
  if (resolution.isConfigured && !resolution.isValid) {
    throw new Error(`[Burhan Store DB Configuration Error] ${resolution.error}`);
  }

  const uri = resolution.uri;

  // If no URI provided
  if (!uri) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      throw new Error(`[Burhan Store DB] Production database environment variable missing. Please configure MONGODB_URI or MONGODB_URL in Vercel.`);
    }
    const collections = initializeInMemoryCollections();
    syncInMemoryCollectionsFromDisk();
    return {
      client: null,
      db: {
        collection: (name) => {
          syncInMemoryCollectionsFromDisk();
          if (!collections.has(name)) {
            collections.set(name, new InMemoryCollection(name, []));
          }
          return collections.get(name);
        },
      },
    };
  }

  // Check cached MongoDB connection on globalThis (vital for Next.js / Vercel Serverless)
  if (globalThis.__BURHAN_MONGO_CLIENT__ && globalThis.__BURHAN_MONGO_DB__) {
    return { client: globalThis.__BURHAN_MONGO_CLIENT__, db: globalThis.__BURHAN_MONGO_DB__ };
  }

  // Fast backoff for persistent auth/connection errors (prevents 8s latency per request)
  const RETRY_INTERVAL_MS = 60000;
  if (globalThis.__BURHAN_MONGO_LAST_ERROR__ && globalThis.__BURHAN_MONGO_LAST_ATTEMPT__ && (Date.now() - globalThis.__BURHAN_MONGO_LAST_ATTEMPT__ < RETRY_INTERVAL_MS)) {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      throw new Error(`[Burhan Store DB] Remote MongoDB unavailable in production: ${sanitizeMongoError(globalThis.__BURHAN_MONGO_LAST_ERROR__)}`);
    }
    const collections = initializeInMemoryCollections();
    syncInMemoryCollectionsFromDisk();
    return {
      client: null,
      db: {
        collection: (name) => {
          syncInMemoryCollectionsFromDisk();
          if (!collections.has(name)) {
            collections.set(name, new InMemoryCollection(name, []));
          }
          return collections.get(name);
        },
      },
    };
  }

  // Reuse pending connection promise to avoid dog-piling during cold starts
  if (globalThis.__BURHAN_MONGO_PROMISE__) {
    try {
      const client = await globalThis.__BURHAN_MONGO_PROMISE__;
      const db = client.db(dbName);
      globalThis.__BURHAN_MONGO_CLIENT__ = client;
      globalThis.__BURHAN_MONGO_DB__ = db;
      await ensureRealMongoSeeded(db);
      return { client, db };
    } catch (pErr) {
      globalThis.__BURHAN_MONGO_PROMISE__ = null;
    }
  }

  try {
    const connectPromise = MongoClient.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      socketTimeoutMS: 30000,
    });

    globalThis.__BURHAN_MONGO_PROMISE__ = connectPromise;
    const client = await connectPromise;
    const db = client.db(dbName);

    globalThis.__BURHAN_MONGO_CLIENT__ = client;
    globalThis.__BURHAN_MONGO_DB__ = db;

    await ensureRealMongoSeeded(db);
    return { client, db };
  } catch (err) {
    const cleanErr = sanitizeMongoError(err.message);
    if (!globalThis.__BURHAN_MONGO_WARNED__) {
      console.warn('[Burhan Store DB] Remote MongoDB notice: ' + cleanErr);
      globalThis.__BURHAN_MONGO_WARNED__ = true;
    }
    globalThis.__BURHAN_MONGO_PROMISE__ = null;
    globalThis.__BURHAN_MONGO_LAST_ERROR__ = cleanErr;
    globalThis.__BURHAN_MONGO_LAST_ATTEMPT__ = Date.now();

    // In production on Vercel with configured URI, do NOT silently fallback to in-memory mock data
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      throw new Error(`[Burhan Store DB] Remote MongoDB connection failed in production: ${cleanErr}`);
    }

    // Graceful resilient data layer for development & offline environments
    const collections = initializeInMemoryCollections();
    syncInMemoryCollectionsFromDisk();
    return {
      client: null,
      db: {
        collection: (name) => {
          syncInMemoryCollectionsFromDisk();
          if (!collections.has(name)) {
            collections.set(name, new InMemoryCollection(name, []));
          }
          return collections.get(name);
        },
      },
    };
  }
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

export function getDatabaseStatus() {
  const resolution = resolveMongoUri();
  const isConnected = Boolean(globalThis.__BURHAN_MONGO_CLIENT__);
  return {
    isConfigured: resolution.isConfigured,
    isValid: resolution.isValid,
    isConnected,
    provider: isConnected ? 'mongodb' : 'in-memory',
    envKeyUsed: resolution.envKeyUsed,
    sanitizedUri: resolution.sanitizedUri,
    configError: resolution.error,
    databaseName: dbName,
    seeded: Boolean(globalThis.__BURHAN_MONGO_SEEDED__ || (globalThis.__BURHAN_DATABASE_COLLECTIONS__ && globalThis.__BURHAN_DATABASE_COLLECTIONS__.size > 0)),
    lastError: globalThis.__BURHAN_MONGO_LAST_ERROR__ || null,
  };
}
