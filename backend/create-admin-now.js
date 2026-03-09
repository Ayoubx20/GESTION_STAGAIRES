const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  isActive: Boolean,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function createAdminNow() {
  try {
    // Connexion à MongoDB
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer l'utilisateur s'il existe déjà
    await User.deleteOne({ email: 'admin@demo.com' });
    console.log('🗑️ Ancien utilisateur supprimé');

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Créer le nouvel admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Principal',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
      phone: '0600000000',
      isActive: true,
      createdAt: new Date()
    });

    console.log('\n✅ ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('👤 Rôle: admin');
    console.log('🆔 ID:', admin._id);

    // Vérifions que le mot de passe est correct
    const testUser = await User.findOne({ email: 'admin@demo.com' }).select('+password');
    const isPasswordValid = await bcrypt.compare('admin123', testUser.password);
    
    if (isPasswordValid) {
      console.log('\n✅ Vérification: Mot de passe correct !');
    } else {
      console.log('\n❌ Vérification: Problème avec le mot de passe');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
  }
}

createAdminNow();