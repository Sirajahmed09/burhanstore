import { MongoClient } from 'mongodb';
import { getSeedCategories, getSeedProducts } from './seedData.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const getMongoUri = () => {
  return (
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    ''
  ).trim();
};

const dbName = process.env.DB_NAME || 'burhanstore';

// Data persistence file paths (with serverless /tmp fallback)
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store_data.json');
const TMP_DATA_FILE = path.join('/tmp', 'burhan_store_data.json');

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
        if (docVal === target) return false;
      } else if (op === '$in') {
        if (!Array.isArray(target) || !target.includes(docVal)) return false;
      } else if (op === '$nin') {
        if (Array.isArray(target) && target.includes(docVal)) return false;
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

// Safe disk persistence with serverless /tmp fallback
let saveTimeout = null;
function persistDatabaseToDisk() {
  const collections = globalThis.__BURHAN_DATABASE_COLLECTIONS__;
  if (!collections) return;

  const payload = {};
  for (const [name, col] of collections.entries()) {
    payload[name] = col.data || [];
  }

  const json = JSON.stringify(payload, null, 2);

  // 1. Try writing to process.cwd()/data/store_data.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, json, 'utf-8');
    return;
  } catch (err) {
    // Expected on read-only serverless filesystems (e.g. Vercel)
  }

  // 2. Fallback to /tmp which is always writable in serverless environments
  try {
    fs.writeFileSync(TMP_DATA_FILE, json, 'utf-8');
  } catch (tmpErr) {
    // Non-fatal, in-memory collections remain active
  }
}

function triggerSave() {
  // In serverless (e.g. Vercel), save synchronously before the container freezes
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    persistDatabaseToDisk();
    return;
  }

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(persistDatabaseToDisk, 200);
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

  async updateOne(filter, update) {
    const doc = this.data.find(d => matchFilter(d, filter));
    if (!doc) return { matchedCount: 0, modifiedCount: 0, acknowledged: true };

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
    return globalThis.__BURHAN_DATABASE_COLLECTIONS__;
  }

  const collections = new Map();
  globalThis.__BURHAN_DATABASE_COLLECTIONS__ = collections;

  // Check if saved database exists on disk
  let diskData = null;
  const candidateFiles = [DATA_FILE, TMP_DATA_FILE];
  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        diskData = JSON.parse(raw);
        if (diskData && typeof diskData === 'object') break;
      } catch (e) {
        console.warn('[Burhan Store DB] Could not parse disk data from ' + filePath);
      }
    }
  }

  if (diskData && typeof diskData === 'object') {
    for (const [name, items] of Object.entries(diskData)) {
      collections.set(name, new InMemoryCollection(name, Array.isArray(items) ? items : []));
    }

    // Ensure essential collections exist
    const essentialCollections = ['categories', 'products', 'admins', 'settings', 'reviews', 'orders', 'errors'];
    for (const cName of essentialCollections) {
      if (!collections.has(cName)) {
        collections.set(cName, new InMemoryCollection(cName, []));
      }
    }

    // Ensure default admin exists
    const adminsCol = collections.get('admins');
    if (adminsCol && adminsCol.data.length === 0) {
      adminsCol.data.push(
        {
          _id: 'admin-burhan-owner',
          name: 'Burhan Store Owner',
          email: 'burhan@store',
          password: '$2a$10$TkWPJq8jg0cD7LJ1iwd1UOAOM9PWHxNRxBwZ3b41vdbjO4xpZxI7e',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 'admin-superadmin',
          name: 'Super Admin',
          email: 'admin@burhan.com',
          password: '$2a$10$E66okjRht1PObVKE8mgZd.eBZaQaHSvUMRxfYhEuXSu0Zi2nprgcC',
          role: 'superadmin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      triggerSave();
    }

    return collections;
  }

  // Seed default data
  const categories = getSeedCategories();
  const products = getSeedProducts();

  for (const cat of categories) {
    cat.productCount = products.filter(p => p.category === cat.name).length;
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
      console.log('[Burhan Store DB] Initializing superadmin in MongoDB...');
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
      await adminsCol.insertMany([burhanAdmin, defaultAdmin]);
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
      ]);
    } catch (idxErr) {
      // Non-fatal if index already exists
    }

    globalThis.__BURHAN_MONGO_SEEDED__ = true;
  } catch (err) {
    console.warn('[Burhan Store DB] Real MongoDB auto-seed notice:', err.message);
  }
}

export async function connectToDatabase() {
  const uri = getMongoUri();

  // If no URI provided, use shared in-memory collections
  if (!uri) {
    const collections = initializeInMemoryCollections();
    return {
      client: null,
      db: {
        collection: (name) => {
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
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    globalThis.__BURHAN_MONGO_PROMISE__ = connectPromise;
    const client = await connectPromise;
    const db = client.db(dbName);

    globalThis.__BURHAN_MONGO_CLIENT__ = client;
    globalThis.__BURHAN_MONGO_DB__ = db;

    await ensureRealMongoSeeded(db);
    return { client, db };
  } catch (err) {
    console.error('[Burhan Store DB] CRITICAL: Could not connect to remote MongoDB (' + err.message + ')');
    console.warn('[Burhan Store DB] Falling back to shared in-memory store for this request.');
    globalThis.__BURHAN_MONGO_PROMISE__ = null;
    const collections = initializeInMemoryCollections();
    return {
      client: null,
      db: {
        collection: (name) => {
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
  const uri = getMongoUri();
  const isConnected = Boolean(globalThis.__BURHAN_MONGO_CLIENT__);
  return {
    isConfigured: Boolean(uri),
    isConnected,
    provider: isConnected ? 'mongodb' : 'in-memory',
    envKeyUsed: process.env.MONGODB_URI ? 'MONGODB_URI' : (process.env.MONGO_URL ? 'MONGO_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none')),
    databaseName: dbName,
    seeded: Boolean(globalThis.__BURHAN_MONGO_SEEDED__ || (globalThis.__BURHAN_DATABASE_COLLECTIONS__ && globalThis.__BURHAN_DATABASE_COLLECTIONS__.size > 0)),
  };
}
