const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// IMPORTANT: Utilisez le modèle mis à jour
const User = require('./models/User');

async function updateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Ajouter les champs manquants à TOUS les utilisateurs
    const result = await User.updateMany(
      {}, // Tous les utilisateurs
      {
        $set: {
          isActive: true,
          isApproved: true
        }
      }
    );
    console.log(`📊 Mise à jour en masse:`);
    console.log(`- ${result.matchedCount} utilisateurs trouvés`);
    console.log(`- ${result.modifiedCount} utilisateurs modifiés\n`);

    // 2. Vérifier et réinitialiser le mot de passe de l'admin si nécessaire
    const adminEmail = 'admin@demo.com';
    const admin = await User.findOne({ email: adminEmail }).select('+password');
    
    if (admin) {
      console.log(`✅ Admin trouvé: ${admin.email}`);
      
      // Réinitialiser le mot de passe pour être sûr
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('admin123', salt);
      admin.isActive = true;
      admin.isApproved = true;
      await admin.save();
      
      console.log(`✅ Mot de passe admin réinitialisé à 'admin123'`);
      
      // Tester la méthode comparePassword
      const testPassword = await admin.comparePassword('admin123');
      console.log(`🔑 Test mot de passe: ${testPassword ? '✅ OK' : '❌ Échec'}`);
    } else {
      console.log(`❌ Admin ${adminEmail} non trouvé`);
      
      // Créer un nouvel admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = await User.create({
        firstName: 'Admin',
        lastName: 'Principal',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isApproved: true,
        phone: '0600000000'
      });
      
      console.log(`✅ Nouvel admin créé avec email: admin@demo.com`);
    }

    // 3. Lister tous les utilisateurs
    const users = await User.find({}).select('+password');
    console.log('\n📋 LISTE DES UTILISATEURS:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role})`);
      console.log(`   - Actif: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   - Approuvé: ${user.isApproved ? '✅' : '❌'}`);
      console.log(`   - Méthode comparePassword: ${typeof user.comparePassword === 'function' ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

updateUsers();