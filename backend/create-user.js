require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createPendingIntern() {
  if (process.env.ALLOW_INITIAL_ACCOUNT_SETUP !== 'true') throw new Error('Explicit setup confirmation is required.');
  const { MONGODB_URI, SETUP_USER_EMAIL, SETUP_USER_PASSWORD, SETUP_USER_FIRST_NAME, SETUP_USER_LAST_NAME } = process.env;
  if (![MONGODB_URI, SETUP_USER_EMAIL, SETUP_USER_PASSWORD, SETUP_USER_FIRST_NAME, SETUP_USER_LAST_NAME].every(Boolean) || SETUP_USER_PASSWORD.length < 16) {
    throw new Error('Required setup variables are missing; the password must be at least 16 characters.');
  }
  await mongoose.connect(MONGODB_URI);
  const email = SETUP_USER_EMAIL.toLowerCase().trim();
  if (await User.exists({ email })) throw new Error('The requested account already exists; no changes were made.');
  await User.create({
    firstName: SETUP_USER_FIRST_NAME,
    lastName: SETUP_USER_LAST_NAME,
    email,
    password: SETUP_USER_PASSWORD,
    role: 'intern',
    isApproved: false,
    isActive: false
  });
  console.log('Pending intern account created. Credentials were not printed.');
}

createPendingIntern()
  .catch(() => {
    console.error('Account setup failed. Check the required environment configuration.');
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
