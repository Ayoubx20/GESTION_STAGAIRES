require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createInitialAdministrator() {
  if (process.env.ALLOW_INITIAL_ACCOUNT_SETUP !== 'true') {
    throw new Error('Set ALLOW_INITIAL_ACCOUNT_SETUP=true to explicitly enable one-time account setup.');
  }
  const { MONGODB_URI, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD } = process.env;
  if (!MONGODB_URI || !INITIAL_ADMIN_EMAIL || !INITIAL_ADMIN_PASSWORD || INITIAL_ADMIN_PASSWORD.length < 16) {
    throw new Error('Database URI and administrator setup variables are required; the password must be at least 16 characters.');
  }

  await mongoose.connect(MONGODB_URI);
  const exists = await User.exists({ email: INITIAL_ADMIN_EMAIL.toLowerCase().trim() });
  if (exists) throw new Error('The requested administrator already exists; no account was changed.');
  await User.create({
    firstName: 'Initial',
    lastName: 'Administrator',
    email: INITIAL_ADMIN_EMAIL.toLowerCase().trim(),
    password: INITIAL_ADMIN_PASSWORD,
    role: 'admin',
    isApproved: true,
    isActive: true
  });
  console.log('Administrator account created. Credentials were not printed.');
}

createInitialAdministrator()
  .catch(() => {
    console.error('Administrator setup failed. Check the required environment configuration.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
