const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../config');
const connectDB = require('../config/db');

/**
 * Seed an admin user for initial setup.
 * Run with: npm run seed
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@pulse.com';
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    await User.create({
      username: 'admin',
      email: adminEmail,
      password: 'admin123',
      role: 'admin',
      tenantId: 'default-tenant',
    });

    console.log('Admin user seeded successfully.');
    console.log('Email: admin@pulse.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
