// backend/create-missing-interns.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Intern = require('./models/Intern');

async function createMissingInterns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer tous les utilisateurs avec le rôle 'intern'
    const internUsers = await User.find({ role: 'intern' });
    console.log(`📋 ${internUsers.length} utilisateurs stagiaires trouvés\n`);

    // Récupérer les profils existants
    const existingInterns = await Intern.find({}).populate('user');
    const existingUserIds = existingInterns.map(intern => intern.user?._id?.toString());

    let created = 0;
    let skipped = 0;

    for (const user of internUsers) {
      if (!existingUserIds.includes(user._id.toString())) {
        // Créer un profil stagiaire
        const studentId = `STU${String(user._id).slice(-6)}`;
        await Intern.create({
          user: user._id,
          studentId: studentId,
          school: 'Non spécifiée',
          major: 'Non spécifiée',
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: 'pending'
        });
        console.log(`✅ Profil créé pour ${user.firstName} ${user.lastName} - ${studentId}`);
        created++;
      } else {
        console.log(`⏭️ Profil déjà existant pour ${user.firstName} ${user.lastName}`);
        skipped++;
      }
    }

    console.log(`\n📊 Résumé: ${created} profils créés, ${skipped} ignorés`);

    // Afficher la liste finale
    const finalInterns = await Intern.find({}).populate('user', 'firstName lastName email');
    console.log('\n📋 LISTE FINALE DES STAGIAIRES:');
    console.log('================================');
    finalInterns.forEach((intern, index) => {
      console.log(`${index + 1}. ${intern.user?.firstName} ${intern.user?.lastName} - ${intern.studentId} (${intern.status})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté');
  }
}

createMissingInterns();