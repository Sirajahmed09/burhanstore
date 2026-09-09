/**
 * Initialize Admin User - Simpler version
 * This file can be imported and run from Next.js API route
 */

import { getCollection } from '@/lib/db/mongodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function initializeAdmin() {
  try {
    const adminsCol = await getCollection('admins');

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
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123';
    const hashedPassword = await bcrypt.hash(initialPassword, 10);
    
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
  }
}
