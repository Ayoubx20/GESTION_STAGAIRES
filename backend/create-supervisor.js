const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

async function createSupervisor() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    let sup = await User.findOne({ email: 'superviseur@test.com' });
    if (!sup) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('12341234', salt);
      sup = await User.create({
        firstName: 'Super',
        lastName: 'Viseur',
        email: 'superviseur@test.com',
        password: hashedPassword,
        role: 'supervisor'
      });
      console.log('Supervisor created!');
    } else {
      console.log('Supervisor already exists!');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createSupervisor();
