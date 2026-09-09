import { MongoClient } from 'mongodb';
import { getSeedCategories, getSeedProducts } from './seedData.js';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'burhanstore';

let cachedClient = null;
let cachedDb = null;
let useInMemory = !uri;

// Helper to access nested properties like 'customer.phone'
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  if (!path.includes('.')) return obj[path];
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Helper to set nested properties
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
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
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.data.push(newDoc);
    return { insertedId: newDoc._id, acknowledged: true };
  }

  async insertMany(docs) {
    const insertedIds = {};
    const createdDocs = docs.map((doc, index) => {
      const newDoc = {
        _id: doc._id || uuidv4(),
        ...doc,
        createdAt: doc.createdAt || new Date(),
        updatedAt: new Date(),
      };
      insertedIds[index] = newDoc._id;
      return newDoc;
    });
    this.data.push(...createdDocs);
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
        const currentVal = getNestedValue(doc, key) || 0;
        setNestedValue(doc, key, currentVal + val);
      }
    }
    doc.updatedAt = new Date();
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
            const currentVal = getNestedValue(doc, key) || 0;
            setNestedValue(doc, key, currentVal + val);
          }
        }
        doc.updatedAt = new Date();
        modifiedCount++;
      }
    }
    return { matchedCount: modifiedCount, modifiedCount, acknowledged: true };
  }

  async deleteOne(filter) {
    const idx = this.data.findIndex(d => matchFilter(d, filter));
    if (idx !== -1) {
      this.data.splice(idx, 1);
      return { deletedCount: 1, acknowledged: true };
    }
    return { deletedCount: 0, acknowledged: true };
  }

  async deleteMany(filter = {}) {
    if (!filter || Object.keys(filter).length === 0) {
      const count = this.data.length;
      this.data = [];
      return { deletedCount: count, acknowledged: true };
    }
    const initialCount = this.data.length;
    this.data = this.data.filter(d => !matchFilter(d, filter));
    return { deletedCount: initialCount - this.data.length, acknowledged: true };
  }
}

// Global in-memory database store
const inMemoryCollections = new Map();

function initializeInMemoryCollections() {
  if (inMemoryCollections.size > 0) return;

  const categories = getSeedCategories();
  const products = getSeedProducts();

  // Sync category product counts
  for (const cat of categories) {
    cat.productCount = products.filter(p => p.category === cat.name).length;
  }

  // Pre-configured default admin (admin@burhan.com / Admin@123)
  const defaultAdmin = {
    _id: uuidv4(),
    name: 'Super Admin',
    email: 'admin@burhan.com',
    password: '$2a$10$E66okjRht1PObVKE8mgZd.eBZaQaHSvUMRxfYhEuXSu0Zi2nprgcC',
    role: 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date(),
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
    shippingFee: 250,
    updatedAt: new Date(),
  };

  const sampleReviews = [
    {
      _id: uuidv4(),
      productId: products[0]?._id,
      name: 'Ahmed Khan',
      rating: 5,
      comment: 'Super fast delivery and authentic product! Outstanding sound quality and bass.',
      verified: true,
      createdAt: new Date(),
    },
    {
      _id: uuidv4(),
      productId: products[1]?._id,
      name: 'Sarah Tariq',
      rating: 5,
      comment: 'Very comfortable to wear for long calls and music sessions. Highly recommended!',
      verified: true,
      createdAt: new Date(),
    },
  ];

  inMemoryCollections.set('categories', new InMemoryCollection('categories', categories));
  inMemoryCollections.set('products', new InMemoryCollection('products', products));
  inMemoryCollections.set('admins', new InMemoryCollection('admins', [defaultAdmin]));
  inMemoryCollections.set('settings', new InMemoryCollection('settings', [defaultSettings]));
  inMemoryCollections.set('reviews', new InMemoryCollection('reviews', sampleReviews));
  inMemoryCollections.set('orders', new InMemoryCollection('orders', []));
  inMemoryCollections.set('errors', new InMemoryCollection('errors', []));
}

export async function connectToDatabase() {
  if (useInMemory) {
    initializeInMemoryCollections();
    return {
      client: null,
      db: {
        collection: (name) => {
          if (!inMemoryCollections.has(name)) {
            inMemoryCollections.set(name, new InMemoryCollection(name, []));
          }
          return inMemoryCollections.get(name);
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
    console.warn('[AI Studio] Remote MongoDB unavailable (' + err.message + ') - falling back to in-memory store');
    useInMemory = true;
    initializeInMemoryCollections();
    return {
      client: null,
      db: {
        collection: (name) => {
          if (!inMemoryCollections.has(name)) {
            inMemoryCollections.set(name, new InMemoryCollection(name, []));
          }
          return inMemoryCollections.get(name);
        },
      },
    };
  }
}

export async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}
