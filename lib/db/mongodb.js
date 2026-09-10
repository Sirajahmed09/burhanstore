import { MongoClient } from 'mongodb';
import { getSeedCategories, getSeedProducts } from './seedData.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'burhanstore';

let cachedClient = null;
let cachedDb = null;
let useInMemory = !uri;

// Data persistence file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store_data.json');

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
  return docVal === condition;
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

// Debounced save to disk function
let saveTimeout = null;
function persistDatabaseToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const collections = globalThis.__BURHAN_DATABASE_COLLECTIONS__;
    if (!collections) return;

    const payload = {};
    for (const [name, col] of collections.entries()) {
      payload[name] = col.data || [];
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Burhan Store DB] Failed to save database to disk:', err.message);
  }
}

function triggerSave() {
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
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      diskData = JSON.parse(raw);
    } catch (e) {
      console.warn('[Burhan Store DB] Could not parse disk data, falling back to seed data');
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

export async function connectToDatabase() {
  if (useInMemory) {
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

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = await MongoClient.connect(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 2500,
    });
    const db = client.db(dbName);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (err) {
    console.warn('[Burhan Store DB] Remote MongoDB unavailable (' + err.message + ') - falling back to shared store');
    useInMemory = true;
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
