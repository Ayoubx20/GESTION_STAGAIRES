// test-user.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function testUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');

    // Nettoyer
    await User.deleteOne({ email: 'test@example.com' });

    // Créer
    console.log('📝 Création utilisateur...');
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      phone: '0612345678'
    });

    await user.save();
    console.log('✅ Utilisateur créé avec ID:', user._id);
    console.log('🔑 Mot de passe hashé:', user.password);

    // Tester
    const isMatch = await user.comparePassword('password123');
    console.log('🔐 Comparaison (password123):', isMatch ? '✅ correct' : '❌ incorrect');
    
    const isMatch2 = await user.comparePassword('wrongpassword');
    console.log('🔐 Comparaison (wrongpassword):', isMatch2 ? '✅ correct' : '❌ incorrect');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté');
  }
}

testUser();