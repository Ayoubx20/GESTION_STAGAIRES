require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createSupervisor = async () => {
  try {
    // 🔗 Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const email = 'supervisor@gestion.com';
    const password = 'supervisor123';

    // 🛡️ Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('⚠️ Le superviseur existe déjà.');
      process.exit(0);
    }

    // 👤 Créer le superviseur
    const supervisor = new User({
      firstName: 'Jean',
      lastName: 'Superviseur',
      email: email,
      password: password,
      role: 'supervisor',
      isApproved: true,
      isActive: true
    });

    await supervisor.save();
    console.log('\n🌟 SUPERVISEUR CRÉÉ AVEC SUCCÈS 🌟');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('-----------------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
};

createSupervisor();
