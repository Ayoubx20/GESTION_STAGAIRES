require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createInitialAccounts() {
  if (process.env.ALLOW_INITIAL_ACCOUNT_SETUP !== 'true') throw new Error('Explicit setup confirmation is required.');
  const { MONGODB_URI, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_INTERN_EMAIL, INITIAL_INTERN_PASSWORD } = process.env;
  if (![MONGODB_URI, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, INITIAL_INTERN_EMAIL, INITIAL_INTERN_PASSWORD].every(Boolean) || INITIAL_ADMIN_PASSWORD.length < 16 || INITIAL_INTERN_PASSWORD.length < 16) {
    throw new Error('Database and account setup variables are required; passwords must be at least 16 characters.');
  }
  await mongoose.connect(MONGODB_URI);
  const accounts = [
    { firstName: 'Initial', lastName: 'Administrator', email: INITIAL_ADMIN_EMAIL, password: INITIAL_ADMIN_PASSWORD, role: 'admin', isApproved: true, isActive: true },
    { firstName: 'Initial', lastName: 'Intern', email: INITIAL_INTERN_EMAIL, password: INITIAL_INTERN_PASSWORD, role: 'intern', isApproved: false, isActive: false }
  ];
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const account of accounts) {
        account.email = account.email.toLowerCase().trim();
        if (await User.exists({ email: account.email }).session(session)) throw new Error('An account already exists; no accounts were changed.');
      }
      await User.create(accounts, { session });
    });
  } finally {
    await session.endSession();
  }
  console.log('Initial accounts created. Credentials were not printed.');
}

createInitialAccounts()
  .catch(() => {
    console.error('Initial account setup failed. Check the required environment configuration.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
