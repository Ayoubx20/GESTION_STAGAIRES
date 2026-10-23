require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createSupervisor() {
  if (process.env.ALLOW_INITIAL_ACCOUNT_SETUP !== 'true') {
    throw new Error('Set ALLOW_INITIAL_ACCOUNT_SETUP=true to explicitly enable one-time account setup.');
  }
  const { MONGODB_URI, INITIAL_SUPERVISOR_EMAIL, INITIAL_SUPERVISOR_PASSWORD } = process.env;
  if (!MONGODB_URI || !INITIAL_SUPERVISOR_EMAIL || !INITIAL_SUPERVISOR_PASSWORD || INITIAL_SUPERVISOR_PASSWORD.length < 16) {
    throw new Error('Database URI and supervisor setup variables are required; the password must be at least 16 characters.');
  }

  await mongoose.connect(MONGODB_URI);
  const exists = await User.exists({ email: INITIAL_SUPERVISOR_EMAIL.toLowerCase().trim() });
  if (exists) throw new Error('The requested supervisor account already exists; no changes were made.');

  await User.create({
    firstName: 'Supervisor',
    lastName: 'Account',
    email: INITIAL_SUPERVISOR_EMAIL.toLowerCase().trim(),
    password: INITIAL_SUPERVISOR_PASSWORD,
    role: 'supervisor',
    isApproved: true,
    isActive: true
  });
  console.log('Supervisor account created. Credentials were not printed.');
}

createSupervisor()
  .catch(() => {
    console.error('Supervisor setup failed. Check the required environment configuration.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
