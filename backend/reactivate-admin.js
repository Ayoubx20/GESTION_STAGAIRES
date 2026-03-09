const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function reactivateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // 1. Voir tous les admins
    const admins = await User.find({ role: 'admin' });
    console.log('📋 Administrateurs trouvés:');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} - Actif: ${admin.isActive}`);
    });

    // 2. Réactiver l'admin spécifique
    const adminEmail = 'admin@demo.com'; // Changez selon votre email
    const admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      admin.isActive = true;
      admin.isApproved = true;
      await admin.save();
      console.log(`\n✅ Admin ${adminEmail} réactivé avec succès!`);
    } else {
      console.log(`\n❌ Admin ${adminEmail} non trouvé`);
    }

    // 3. Créer un nouvel admin si nécessaire
    const newAdmin = await User.findOne({ email: 'admin@system.com' });
    if (!newAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@system.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isApproved: true,
        phone: '0600000000'
      });
      console.log('✅ Nouvel admin créé: admin@system.com / admin123');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

reactivateAdmin();