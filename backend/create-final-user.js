const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function createFinalUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer les anciens utilisateurs avec ces emails
    await User.deleteOne({ email: 'admin@demo.com' });
    await User.deleteOne({ email: 'demo@demo.com' });

    // Créer un admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@demo.com',
      password: 'admin123',
      role: 'admin',
      phone: '0600000000'
    });
    console.log('✅ Admin créé: admin@demo.com / admin123');

    // Créer un utilisateur simple
    const user = await User.create({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@demo.com',
      password: 'demo123',
      role: 'intern',
      phone: '0611111111'
    });
    console.log('✅ Utilisateur créé: demo@demo.com / demo123');

    console.log('\n🎉 Utilisateurs créés avec succès !');
    console.log('\n📧 Identifiants de connexion :');
    console.log('1. Admin: admin@demo.com / admin123');
    console.log('2. Utilisateur: demo@demo.com / demo123');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createFinalUser();