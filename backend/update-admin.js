const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Mettre à jour l'admin avec l'ID spécifique
    const adminId = '69ab5f6fe774967caec97ea2';
    
    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      {
        $set: {
          isActive: true,
          isApproved: true
        }
      },
      { new: true } // Retourner le document mis à jour
    );

    if (updatedAdmin) {
      console.log('✅ Admin mis à jour avec succès !');
      console.log('📧 Email:', updatedAdmin.email);
      console.log('👤 Rôle:', updatedAdmin.role);
      console.log('✅ Actif:', updatedAdmin.isActive);
      console.log('✅ Approuvé:', updatedAdmin.isApproved);
    } else {
      console.log('❌ Admin non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

updateAdmin();