#!/usr/bin/env node
/**
 * Safe Administrator Bootstrap Script
 *
 * Usage:
 *   node bootstrap_admin.js <email> <password> [name]
 * Or configure environment variables:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node bootstrap_admin.js
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function bootstrap() {
  const emailArg = process.argv[2] || process.env.ADMIN_EMAIL;
  const passwordArg = process.argv[3] || process.env.ADMIN_PASSWORD;
  const nameArg = process.argv[4] || process.env.ADMIN_NAME || 'Keerti Boutique Admin';

  if (!emailArg || !passwordArg) {
    console.error('\n[Error] Admin email and password are required.');
    console.error('Usage: node bootstrap_admin.js <email> <password> [name]');
    console.error('Example: node bootstrap_admin.js manager@keerticouture.com StrongP@ssw0rd! "Store Manager"\n');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const password = passwordArg;
  const name = nameArg.trim();

  if (!EMAIL_REGEX.test(email)) {
    console.error('\n[Error] Invalid email format:', email);
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('\n[Error] Password must be at least 6 characters long.');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('\n[Error] MONGO_URI is missing in .env');
    process.exit(1);
  }

  console.log(`\nConnecting to database...`);
  await mongoose.connect(mongoUri);

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      existing.isAdmin = true;
      existing.name = name;
      existing.password = password; // pre('save') hook will hash this
      await existing.save();
      console.log(`[Success] Existing account for ${email} elevated to Administrator!`);
    } else {
      const user = new User({
        name,
        email,
        password,
        isAdmin: true,
      });
      await user.save();
      console.log(`[Success] New Administrator account created successfully: ${email}`);
    }
  } catch (err) {
    console.error('[Error] Failed to bootstrap administrator:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.\n');
    process.exit(0);
  }
}

bootstrap();

