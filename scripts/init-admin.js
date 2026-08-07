/**
 * Initialize Admin User - Simpler version
 * This file can be imported and run from Next.js API route
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function initializeAdmin() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || 'burhan_store';

  if (!mongoUrl) {
    throw new Error('MONGO_URL environment variable is not set');
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const adminsCol = db.collection('admins');

    // Check if admin already exists
    const existingAdmin = await adminsCol.findOne({ email: 'admin@burhan.com' });
    
    if (existingAdmin) {
      return {
        exists: true,
        message: 'Admin user already exists',
        email: existingAdmin.email,
        role: existingAdmin.role
      };
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = {
      _id: uuidv4(),
      name: 'Super Admin',
      email: 'admin@burhan.com',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await adminsCol.insertOne(admin);

    return {
      exists: false,
      created: true,
      message: 'Admin user created successfully',
      email: admin.email,
      role: admin.role
    };

  } catch (error) {
    console.error('Error initializing admin:', error);
    throw error;
  } finally {
    await client.close();
  }
}
