require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function recoverAdministrator() {
  if (process.env.ALLOW_ADMIN_RECOVERY !== 'true') throw new Error('Explicit administrator recovery confirmation is required.');
  const { MONGODB_URI, ADMIN_RECOVERY_EMAIL, ADMIN_RECOVERY_PASSWORD } = process.env;
  if (!MONGODB_URI || !ADMIN_RECOVERY_EMAIL || !ADMIN_RECOVERY_PASSWORD || ADMIN_RECOVERY_PASSWORD.length < 16) {
    throw new Error('Recovery configuration is incomplete; the password must be at least 16 characters.');
  }
  await mongoose.connect(MONGODB_URI);
  const admin = await User.findOne({ email: ADMIN_RECOVERY_EMAIL.toLowerCase().trim(), role: 'admin' }).select('+password');
  if (!admin) throw new Error('No matching administrator account was found; no account was created.');
  admin.password = ADMIN_RECOVERY_PASSWORD;
  admin.isApproved = true;
  admin.isActive = true;
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();
  console.log('Administrator credentials updated; no credential values were printed.');
}

recoverAdministrator()
  .catch(() => {
    console.error('Administrator recovery failed. Check the required environment configuration.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
