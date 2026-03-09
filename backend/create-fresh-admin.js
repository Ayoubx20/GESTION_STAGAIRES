const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function createFreshAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Supprimer l'ancien admin s'il existe
    await User.deleteOne({ email: 'admin@demo.com' });
    console.log('🗑️ Ancien admin supprimé');

    // Créer un nouvel admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = await User.create({
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isApproved: true,
      phone: '0600000000',
      createdAt: new Date()
    });

    console.log('✅ Nouvel admin créé avec succès !');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('🆔 ID:', newAdmin._id);

    // Vérifier que tout est correct
    const verifyAdmin = await User.findOne({ email: 'admin@demo.com' });
    console.log('\n📋 Vérification:');
    console.log('- Email:', verifyAdmin.email);
    console.log('- Rôle:', verifyAdmin.role);
    console.log('- Actif:', verifyAdmin.isActive);
    console.log('- Approuvé:', verifyAdmin.isApproved);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

createFreshAdmin();