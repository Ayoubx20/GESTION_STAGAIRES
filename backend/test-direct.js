const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Importez votre modèle
const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Test de création directe
    const testUser = {
      firstName: 'Test',
      lastName: 'Direct',
      email: 'test.direct@email.com',
      password: 'password123',
      role: 'intern'
    };

    console.log('📝 Création utilisateur...');
    const user = await User.create(testUser);
    console.log('✅ Utilisateur créé avec ID:', user._id);

    // Vérification du mot de passe
    const found = await User.findById(user._id).select('+password');
    const isValid = await bcrypt.compare('password123', found.password);
    console.log('🔑 Mot de passe valide:', isValid);

  } catch (error) {
    console.error('❌ Erreur:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

test();