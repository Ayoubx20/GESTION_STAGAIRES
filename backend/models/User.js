const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'supervisor', 'intern'], default: 'intern' },
  phone: String,
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// ✅ SOLUTION FINALE - Sans utiliser 'next' (return Promise)
userSchema.pre('save', async function() {
  console.log('🔧 Hook pre-save appelé');
  
  try {
    // Vérifier si le mot de passe est modifié
    if (!this.isModified('password')) {
      return;
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    
    // Remplacer par le hash
    this.password = hash;
    console.log('✅ Mot de passe haché avec succès');
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error; // Important: throw l'erreur au lieu de next(error)
  }
});

// Méthode de comparaison
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);