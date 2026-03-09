const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// IMPORTANT: Utilisez le modèle mis à jour
const User = require('./models/User');

async function testLoginFixed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    const email = 'admin@demo.com';
    const password = 'admin123';

    // IMPORTANT: Il faut sélectionner le password car il a select: false
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('📋 Utilisateur trouvé:');
    console.log('- Email:', user.email);
    console.log('- Rôle:', user.role);
    console.log('- Actif:', user.isActive);
    console.log('- Approuvé:', user.isApproved);
    console.log('- Méthode comparePassword existe:', typeof user.comparePassword === 'function');

    // Vérifier que la méthode existe
    if (typeof user.comparePassword !== 'function') {
      console.log('❌ ERREUR: La méthode comparePassword n\'est pas disponible');
      console.log('👉 Redémarrez le backend après avoir mis à jour le modèle');
      return;
    }

    const isValid = await user.comparePassword(password);
    console.log('- Mot de passe valide:', isValid);

    // Vérifier les conditions de connexion
    if (user.isActive && user.isApproved && isValid) {
      console.log('\n✅ Connexion réussie !');
    } else {
      console.log('\n❌ Échec de connexion');
      if (!user.isActive) console.log('   → Compte inactif');
      if (!user.isApproved) console.log('   → Compte non approuvé');
      if (!isValid) console.log('   → Mot de passe incorrect');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testLoginFixed();